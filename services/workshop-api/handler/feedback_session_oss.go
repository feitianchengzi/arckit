package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	sts20150401 "github.com/alibabacloud-go/sts-20150401/v2/client"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
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

type CreateFeedbackAPIKeyUploadPolicyRequest struct {
	ProjectID    uint   `json:"project_id" binding:"required"`
	CustomUserID string `json:"custom_user_id" binding:"required"`
	Type         string `json:"type" binding:"required"`
	FileName     string `json:"file_name" binding:"required"`
	MimeType     string `json:"mime_type" binding:"required"`
	Size         int64  `json:"size" binding:"required"`
}

type GetFeedbackAPIKeyOSSCredentialsRequest struct {
	ProjectID    uint   `form:"project_id" binding:"required"`
	CustomUserID string `form:"custom_user_id" binding:"required"`
}

type FeedbackUploadPolicyResponse struct {
	ObjectKey string            `json:"object_key"`
	UploadURL string            `json:"upload_url"`
	Fields    map[string]string `json:"fields"`
	ExpiresAt string            `json:"expires_at"`
}

type feedbackAttachmentScope struct {
	ProjectID    uint
	CustomUserID string
	SessionID    string
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

func feedbackDeveloperAttachmentPrefix(projectID, userID uint) string {
	rootPath := strings.Trim(strings.TrimSpace(os.Getenv("OSS_ROOT_PATH")), "/")
	parts := []string{
		"feedbacks",
		"v2",
		strconv.FormatUint(uint64(projectID), 10),
		"developers",
		strconv.FormatUint(uint64(userID), 10),
	}
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

func buildFeedbackOSSObjectPolicy(bucketName, objectKey string) (string, error) {
	objectKey = strings.TrimLeft(strings.TrimSpace(objectKey), "/")
	resource := fmt.Sprintf("acs:oss:*:*:%s/%s", bucketName, objectKey)
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

func createFeedbackUploadPolicyForPrefix(c *gin.Context, objectKeyPrefix string, req CreateFeedbackUploadPolicyRequest) {
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

	objectKey := feedbackUploadObjectKey(objectKeyPrefix, mimeType)
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

func createFeedbackUploadPolicyForScope(c *gin.Context, scope feedbackAttachmentScope, req CreateFeedbackUploadPolicyRequest) {
	createFeedbackUploadPolicyForPrefix(c, feedbackAttachmentPrefix(scope.ProjectID, scope.CustomUserID), req)
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
	createFeedbackUploadPolicyForScope(c, feedbackAttachmentScope{
		ProjectID:    scope.ProjectID,
		CustomUserID: scope.CustomUserID,
		SessionID:    scope.SessionID,
	}, req)
}

// CreateFeedbackDeveloperUploadPolicy returns an exact upload policy for a
// project member replying to a feedback conversation. Developer attachments
// live under a separate per-member prefix, never in a customer's namespace.
func CreateFeedbackDeveloperUploadPolicy(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	var req CreateFeedbackUploadPolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}
	userID, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "上传开发者回复附件")
	if !ok {
		return
	}
	createFeedbackUploadPolicyForPrefix(c, feedbackDeveloperAttachmentPrefix(feedback.ProjectID, userID), req)
}

func requireAPIKeyFeedbackAttachmentScope(c *gin.Context, projectID uint, customUserID string) (feedbackAttachmentScope, bool) {
	customUserID = strings.TrimSpace(customUserID)
	if projectID == 0 || customUserID == "" || len(customUserID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 和 custom_user_id 为必填项，custom_user_id 最大长度为 128", nil))
		return feedbackAttachmentScope{}, false
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return feedbackAttachmentScope{}, false
	}
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return feedbackAttachmentScope{}, false
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "当前认证用户不是该项目成员，无法访问反馈附件", nil))
			return feedbackAttachmentScope{}, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return feedbackAttachmentScope{}, false
	}

	return feedbackAttachmentScope{
		ProjectID:    projectID,
		CustomUserID: customUserID,
		SessionID:    fmt.Sprintf("apikey-%d-%s", userID, customUserID),
	}, true
}

// CreateFeedbackUploadPolicyByAPIKey supports the direct API Key V2 SDK mode.
// The API Key is validated by the gateway; this handler only creates an exact,
// project/customer-scoped POST policy and never returns a write credential.
func CreateFeedbackUploadPolicyByAPIKey(c *gin.Context) {
	var req CreateFeedbackAPIKeyUploadPolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	scope, ok := requireAPIKeyFeedbackAttachmentScope(c, req.ProjectID, req.CustomUserID)
	if !ok {
		return
	}
	createFeedbackUploadPolicyForScope(c, scope, CreateFeedbackUploadPolicyRequest{
		Type:     req.Type,
		FileName: req.FileName,
		MimeType: req.MimeType,
		Size:     req.Size,
	})
}

// writeFeedbackOSSTempCredentials returns a read-only STS credential scoped
// to the current feedback session's object prefix.
func writeFeedbackOSSTempCredentials(c *gin.Context, scope feedbackAttachmentScope) {
	writeFeedbackOSSTempCredentialsForObject(c, scope, "")
}

func writeFeedbackOSSTempCredentialsForObject(c *gin.Context, scope feedbackAttachmentScope, objectKey string) {
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
	var (
		policy string
		err    error
	)
	if objectKey == "" {
		policy, err = buildFeedbackOSSPolicy(bucketName, prefix)
	} else {
		policy, err = buildFeedbackOSSObjectPolicy(bucketName, objectKey)
	}
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

func GetFeedbackSessionOSSTempCredentials(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	writeFeedbackOSSTempCredentials(c, feedbackAttachmentScope{
		ProjectID:    scope.ProjectID,
		CustomUserID: scope.CustomUserID,
		SessionID:    scope.SessionID,
	})
}

// GetFeedbackAPIKeyOSSTempCredentials returns a read-only, customer-prefix
// credential for the direct API Key V2 mode.
func GetFeedbackAPIKeyOSSTempCredentials(c *gin.Context) {
	var req GetFeedbackAPIKeyOSSCredentialsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	scope, ok := requireAPIKeyFeedbackAttachmentScope(c, req.ProjectID, req.CustomUserID)
	if !ok {
		return
	}
	writeFeedbackOSSTempCredentials(c, scope)
}

func parseFeedbackAttachmentIDParam(c *gin.Context) (uint, bool) {
	raw := strings.TrimSpace(c.Param("attachment_id"))
	parsed, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || parsed == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的反馈附件 ID", nil))
		return 0, false
	}
	return uint(parsed), true
}

func loadFeedbackMessageAttachment(c *gin.Context, db *gorm.DB, feedbackID, attachmentID uint) (models.FeedbackMessageAttachment, bool) {
	var attachment models.FeedbackMessageAttachment
	if err := db.Where("id = ? AND feedback_id = ?", attachmentID, feedbackID).First(&attachment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeNotFound, "反馈附件不存在", nil))
			return attachment, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈附件失败: "+err.Error(), nil))
		return attachment, false
	}
	if attachment.ObjectKey == nil || strings.TrimSpace(*attachment.ObjectKey) == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "该附件不支持 OSS 临时访问", nil))
		return attachment, false
	}
	return attachment, true
}

// GetFeedbackAttachmentOSSCredentials grants a project member, or a direct
// API Key caller for the matching customer, read access to exactly one
// feedback attachment. It is used for developer-uploaded attachments that do
// not live beneath the customer's upload prefix.
func GetFeedbackAttachmentOSSCredentials(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	attachmentID, ok := parseFeedbackAttachmentIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}
	userID, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "读取反馈附件")
	if !ok {
		return
	}
	if isAPIKeyRequest(c) {
		if _, ok := requireCustomerFeedbackAccess(c, feedback, c.Query("custom_user_id")); !ok {
			return
		}
	}
	attachment, ok := loadFeedbackMessageAttachment(c, db, feedbackID, attachmentID)
	if !ok {
		return
	}
	writeFeedbackOSSTempCredentialsForObject(c, feedbackAttachmentScope{
		ProjectID: feedback.ProjectID,
		SessionID: fmt.Sprintf("feedback-attachment-%d-%d-%d", userID, feedbackID, attachmentID),
	}, strings.TrimSpace(*attachment.ObjectKey))
}

// GetFeedbackAttachmentOSSCredentialsFromSession grants an fbs token read
// access to exactly one attachment that belongs to its own feedback.
func GetFeedbackAttachmentOSSCredentialsFromSession(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	attachmentID, ok := parseFeedbackAttachmentIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	_, scope, ok := requireScopedFeedback(c, db, feedbackID)
	if !ok {
		return
	}
	attachment, ok := loadFeedbackMessageAttachment(c, db, feedbackID, attachmentID)
	if !ok {
		return
	}
	writeFeedbackOSSTempCredentialsForObject(c, feedbackAttachmentScope{
		ProjectID:    scope.ProjectID,
		CustomUserID: scope.CustomUserID,
		SessionID:    scope.SessionID,
	}, strings.TrimSpace(*attachment.ObjectKey))
}

func parseTaskAttachmentIDParam(c *gin.Context) (uint, bool) {
	raw := strings.TrimSpace(c.Param("id"))
	parsed, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || parsed == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的待办附件 ID", nil))
		return 0, false
	}
	return uint(parsed), true
}

func taskAttachmentReferencesObjectKey(content, objectKey string) bool {
	content = strings.TrimSpace(content)
	objectKey = strings.TrimSpace(objectKey)
	if content == "" || objectKey == "" {
		return false
	}
	return content == objectKey ||
		strings.Contains(content, "[image]("+objectKey+")") ||
		strings.Contains(content, "[file]("+objectKey+")")
}

// GetFeedbackTaskAttachmentOSSCredentials grants a project member read
// access to one feedback object embedded in a task attachment created during
// feedback conversion. The object must belong to the feedback linked to that
// task, so task membership alone cannot be used to request arbitrary objects.
func GetFeedbackTaskAttachmentOSSCredentials(c *gin.Context) {
	if isAPIKeyRequest(c) {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "API Key 认证不允许读取待办反馈附件", nil))
		return
	}

	taskAttachmentID, ok := parseTaskAttachmentIDParam(c)
	if !ok {
		return
	}
	objectKey := strings.TrimSpace(c.Query("object_key"))
	if objectKey == "" || len(objectKey) > 1024 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "object_key 无效", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	var taskAttachment models.TaskAttachment
	if err := db.First(&taskAttachment, taskAttachmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskAttachmentNotFound, "待办附件不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskAttachmentQueryFailed, "查询待办附件失败: "+err.Error(), nil))
		return
	}
	if !taskAttachmentReferencesObjectKey(taskAttachment.Content, objectKey) {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "该对象不属于待办附件", nil))
		return
	}

	var task models.Task
	if err := db.First(&task, taskAttachment.TaskID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "待办不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询待办失败: "+err.Error(), nil))
		return
	}
	userID, ok := requireFeedbackProjectMember(c, db, task.ProjectID, "读取待办反馈附件")
	if !ok {
		return
	}

	var links []models.FeedbackTaskLink
	if err := db.Where("task_id = ?", task.ID).Find(&links).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈待办关联失败: "+err.Error(), nil))
		return
	}
	feedbackIDs := make([]uint, 0, len(links))
	for _, link := range links {
		feedbackIDs = append(feedbackIDs, link.FeedbackID)
	}
	if len(feedbackIDs) == 0 {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "待办未关联反馈附件", nil))
		return
	}

	var sourceAttachment models.FeedbackMessageAttachment
	if err := db.Where("feedback_id IN ? AND object_key = ?", feedbackIDs, objectKey).First(&sourceAttachment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "该对象不属于关联反馈", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈附件失败: "+err.Error(), nil))
		return
	}

	writeFeedbackOSSTempCredentialsForObject(c, feedbackAttachmentScope{
		ProjectID: task.ProjectID,
		SessionID: fmt.Sprintf("task-feedback-attachment-%d-%d-%d", userID, taskAttachment.ID, sourceAttachment.ID),
	}, objectKey)
}
