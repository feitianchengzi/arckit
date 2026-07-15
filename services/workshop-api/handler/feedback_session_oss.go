package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"todo/middleware"
	"todo/response"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	sts20150401 "github.com/alibabacloud-go/sts-20150401/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	feedbackImageMaxSize         = int64(10 * 1024 * 1024)
	feedbackFileMaxSize          = int64(20 * 1024 * 1024)
	feedbackUploadPolicyLifetime = 10 * time.Minute
)

type CreateFeedbackUploadPolicyRequest struct {
	Type     string `json:"type" binding:"required"`
	FileName string `json:"file_name" binding:"required"`
	MimeType string `json:"mime_type" binding:"required"`
	Size     int64  `json:"size" binding:"required"`
}

type FeedbackUploadPolicyResponse struct {
	ObjectKey string            `json:"object_key"`
	UploadURL string            `json:"upload_url"`
	Fields    map[string]string `json:"fields"`
	ExpiresAt string            `json:"expires_at"`
}

type feedbackPostPolicy struct {
	Expiration string        `json:"expiration"`
	Conditions []interface{} `json:"conditions"`
}

func feedbackAttachmentPrefix(projectID uint, customUserID string) string {
	rootPath := strings.Trim(strings.TrimSpace(os.Getenv("OSS_ROOT_PATH")), "/")
	sum := sha256.Sum256([]byte(customUserID))
	parts := []string{"feedbacks", "v2", strconv.FormatUint(uint64(projectID), 10), hex.EncodeToString(sum[:])}
	if rootPath != "" {
		parts = append([]string{rootPath}, parts...)
	}
	return strings.Join(parts, "/") + "/"
}

func buildFeedbackOSSPolicy(bucketName, prefix string) (string, error) {
	resource := fmt.Sprintf("acs:oss:*:*:%s/%s*", bucketName, prefix)
	policy := map[string]interface{}{
		"Version": "1",
		"Statement": []map[string]interface{}{
			{
				"Effect":   "Allow",
				"Action":   []string{"oss:GetObject"},
				"Resource": []string{resource},
			},
		},
	}
	encoded, err := json.Marshal(policy)
	if err != nil {
		return "", err
	}
	return string(encoded), nil
}

func hmacSHA256(key []byte, value string) []byte {
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write([]byte(value))
	return mac.Sum(nil)
}

func feedbackUploadObjectKey(prefix, mimeType string) string {
	extensions := map[string]string{
		"image/jpeg":      "jpg",
		"image/png":       "png",
		"image/webp":      "webp",
		"image/gif":       "gif",
		"application/pdf": "pdf",
		"text/plain":      "txt",
		"text/csv":        "csv",
		"application/zip": "zip",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document":   "docx",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         "xlsx",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
	}
	return prefix + uuid.NewString() + "." + extensions[mimeType]
}

func ossRegionID(region string) string {
	return strings.TrimPrefix(strings.TrimSpace(region), "oss-")
}

func buildFeedbackUploadPolicy(accessKeyID, accessKeySecret, bucketName, region, objectKey, mimeType string, size int64, now time.Time) (FeedbackUploadPolicyResponse, error) {
	region = ossRegionID(region)
	if accessKeyID == "" || accessKeySecret == "" || bucketName == "" || region == "" {
		return FeedbackUploadPolicyResponse{}, fmt.Errorf("OSS 配置不完整")
	}

	expiresAt := now.UTC().Add(feedbackUploadPolicyLifetime)
	date := now.UTC().Format("20060102")
	requestDate := now.UTC().Format("20060102T150405Z")
	credential := fmt.Sprintf("%s/%s/%s/oss/aliyun_v4_request", accessKeyID, date, region)
	policy := feedbackPostPolicy{
		Expiration: expiresAt.Format("2006-01-02T15:04:05.000Z"),
		Conditions: []interface{}{
			map[string]string{"bucket": bucketName},
			map[string]string{"x-oss-signature-version": "OSS4-HMAC-SHA256"},
			map[string]string{"x-oss-credential": credential},
			map[string]string{"x-oss-date": requestDate},
			[]interface{}{"content-length-range", size, size},
			[]interface{}{"eq", "$success_action_status", "201"},
			[]interface{}{"eq", "$key", objectKey},
			[]interface{}{"in", "$content-type", []string{mimeType}},
		},
	}
	policyJSON, err := json.Marshal(policy)
	if err != nil {
		return FeedbackUploadPolicyResponse{}, err
	}
	encodedPolicy := base64.StdEncoding.EncodeToString(policyJSON)
	dateKey := hmacSHA256([]byte("aliyun_v4"+accessKeySecret), date)
	regionKey := hmacSHA256(dateKey, region)
	serviceKey := hmacSHA256(regionKey, "oss")
	signingKey := hmacSHA256(serviceKey, "aliyun_v4_request")
	signature := hex.EncodeToString(hmacSHA256(signingKey, encodedPolicy))

	return FeedbackUploadPolicyResponse{
		ObjectKey: objectKey,
		UploadURL: fmt.Sprintf("https://%s.oss-%s.aliyuncs.com", bucketName, region),
		Fields: map[string]string{
			"key":                     objectKey,
			"policy":                  encodedPolicy,
			"x-oss-signature-version": "OSS4-HMAC-SHA256",
			"x-oss-credential":        credential,
			"x-oss-date":              requestDate,
			"x-oss-signature":         signature,
			"success_action_status":   "201",
		},
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}, nil
}

// CreateFeedbackUploadPolicy returns a V4 PostObject policy scoped to one
// exact object key, byte size, and content type. No write-capable credential
// is ever exposed to a browser.
func CreateFeedbackUploadPolicy(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	var req CreateFeedbackUploadPolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	fileName := strings.TrimSpace(req.FileName)
	if fileName == "" || len(fileName) > 255 || strings.ContainsRune(fileName, '\x00') {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "file_name 必须为不超过 255 字符的有效文件名", nil))
		return
	}
	mimeType, err := validateFeedbackAttachmentMetadata(req.Type, req.MimeType, req.Size)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}

	objectKey := feedbackUploadObjectKey(feedbackAttachmentPrefix(scope.ProjectID, scope.CustomUserID), mimeType)
	uploadPolicy, err := buildFeedbackUploadPolicy(
		strings.TrimSpace(os.Getenv("OSS_ACCESS_KEY_ID")),
		strings.TrimSpace(os.Getenv("OSS_ACCESS_KEY_SECRET")),
		strings.TrimSpace(os.Getenv("OSS_BUCKET_NAME")),
		strings.TrimSpace(os.Getenv("OSS_REGION")),
		objectKey,
		mimeType,
		req.Size,
		time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建反馈附件上传策略失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(uploadPolicy))
}

// GetFeedbackSessionOSSTempCredentials returns a read-only STS credential
// scoped to the current feedback session's object prefix.
func GetFeedbackSessionOSSTempCredentials(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}

	accessKeyID := os.Getenv("OSS_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("OSS_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("OSS_BUCKET_NAME")
	roleARN := os.Getenv("OSS_RAM_ROLE_ARN")
	region := ossRegionID(os.Getenv("OSS_REGION"))
	if accessKeyID == "" || accessKeySecret == "" || bucketName == "" || roleARN == "" || region == "" {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "OSS 配置不完整", nil))
		return
	}

	prefix := feedbackAttachmentPrefix(scope.ProjectID, scope.CustomUserID)
	policy, err := buildFeedbackOSSPolicy(bucketName, prefix)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "构建 OSS 授权策略失败: "+err.Error(), nil))
		return
	}

	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKeyID),
		AccessKeySecret: tea.String(accessKeySecret),
		Endpoint:        tea.String("sts." + region + ".aliyuncs.com"),
	}
	client, err := sts20150401.NewClient(config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建 STS 客户端失败: "+err.Error(), nil))
		return
	}

	sessionHash := sha256.Sum256([]byte(scope.SessionID))
	request := &sts20150401.AssumeRoleRequest{
		DurationSeconds: tea.Int64(900),
		RoleArn:         tea.String(roleARN),
		RoleSessionName: tea.String(fmt.Sprintf("fb-%d-%s", scope.ProjectID, hex.EncodeToString(sessionHash[:6]))),
		Policy:          tea.String(policy),
	}
	stsResponse, err := client.AssumeRoleWithOptions(request, &util.RuntimeOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取反馈附件临时凭证失败: "+err.Error(), nil))
		return
	}

	creds := stsResponse.Body.Credentials
	c.JSON(http.StatusOK, response.NewSuccessResponse(GetOSSTempCredentialsResponse{
		AccessKeyId:     tea.StringValue(creds.AccessKeyId),
		AccessKeySecret: tea.StringValue(creds.AccessKeySecret),
		SecurityToken:   tea.StringValue(creds.SecurityToken),
		Expiration:      tea.StringValue(creds.Expiration),
		BucketName:      bucketName,
		Region:          "oss-" + region,
		RootPath:        prefix,
		AuthorizationV4: true,
		Secure:          true,
	}))
}
