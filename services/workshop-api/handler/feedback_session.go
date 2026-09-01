package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	feedbackSessionTokenPrefix = "fbs_"
	feedbackSessionIssuer      = "workshop-feedback"
	feedbackSessionAudience    = "workshop-v2"
	feedbackSessionLifetime    = 15 * time.Minute
)

type feedbackSessionClaims struct {
	Version      int    `json:"v"`
	Issuer       string `json:"iss"`
	Audience     string `json:"aud"`
	SessionID    string `json:"jti"`
	ProjectID    uint   `json:"project_id"`
	CustomUserID string `json:"custom_user_id"`
	IssuedAt     int64  `json:"iat"`
	ExpiresAt    int64  `json:"exp"`
}

type CreateFeedbackSessionRequest struct {
	ProjectID    uint   `json:"project_id" binding:"required"`
	CustomUserID string `json:"custom_user_id" binding:"required"`
}

type FeedbackSessionResponse struct {
	Token        string `json:"token"`
	TokenType    string `json:"token_type"`
	ProjectID    uint   `json:"project_id"`
	CustomUserID string `json:"custom_user_id"`
	ExpiresAt    string `json:"expires_at"`
}

func feedbackSessionSigningKey() ([]byte, error) {
	key := strings.TrimSpace(os.Getenv("FEEDBACK_SESSION_SIGNING_KEY"))
	if len(key) < 32 {
		return nil, fmt.Errorf("FEEDBACK_SESSION_SIGNING_KEY 未配置或长度不足 32 字节")
	}
	return []byte(key), nil
}

func signFeedbackSessionToken(projectID uint, customUserID string, now time.Time) (string, time.Time, error) {
	signingKey, err := feedbackSessionSigningKey()
	if err != nil {
		return "", time.Time{}, err
	}

	expiresAt := now.Add(feedbackSessionLifetime)
	claims := feedbackSessionClaims{
		Version:      1,
		Issuer:       feedbackSessionIssuer,
		Audience:     feedbackSessionAudience,
		SessionID:    uuid.NewString(),
		ProjectID:    projectID,
		CustomUserID: customUserID,
		IssuedAt:     now.Unix(),
		ExpiresAt:    expiresAt.Unix(),
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", time.Time{}, err
	}
	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, signingKey)
	_, _ = mac.Write([]byte(encodedPayload))
	token := feedbackSessionTokenPrefix + encodedPayload + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return token, expiresAt, nil
}

// CreateFeedbackSession exchanges a server-held Workshop API Key for a
// short-lived browser token scoped to exactly one project/customer pair.
func CreateFeedbackSession(c *gin.Context) {
	var req CreateFeedbackSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	req.CustomUserID = strings.TrimSpace(req.CustomUserID)
	if req.ProjectID == 0 || req.CustomUserID == "" || len(req.CustomUserID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 和 custom_user_id 为必填项，custom_user_id 最大长度为 128", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, userID).First(&member).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "当前认证用户不是该项目成员，无法创建反馈会话", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	token, expiresAt, err := signFeedbackSessionToken(req.ProjectID, req.CustomUserID, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建反馈会话失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusCreated, response.NewSuccessResponse(FeedbackSessionResponse{
		Token:        token,
		TokenType:    "Bearer",
		ProjectID:    req.ProjectID,
		CustomUserID: req.CustomUserID,
		ExpiresAt:    expiresAt.Format(time.RFC3339),
	}))
}
