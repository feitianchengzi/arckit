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
	"strconv"
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
	feedbackConsoleProjectEnv  = "FEEDBACK_CONSOLE_PROJECT_ID"
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
	CustomUserID string `json:"custom_user_id"`
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

func feedbackConsoleProjectID() uint {
	raw := strings.TrimSpace(os.Getenv(feedbackConsoleProjectEnv))
	parsed, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || parsed == 0 {
		return 0
	}
	projectID := uint(parsed)
	if uint64(projectID) != parsed {
		return 0
	}
	return projectID
}

// resolveFeedbackSessionCustomerID gives authenticated Console users a
// customer-only identity for the configured self-feedback project. The
// identity is derived from trusted gateway authentication instead of request
// input, so one Console user cannot request another user's feedback session.
func resolveFeedbackSessionCustomerID(allowConsoleProject bool, projectID, userID uint, requestedCustomUserID string) (string, bool) {
	consoleProjectID := feedbackConsoleProjectID()
	if allowConsoleProject && consoleProjectID != 0 && projectID == consoleProjectID {
		return fmt.Sprintf("console_%d", userID), true
	}
	return strings.TrimSpace(requestedCustomUserID), false
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

// CreateUserFeedbackSession issues the Console self-feedback project a
// customer-only session without granting project management membership.
func CreateUserFeedbackSession(c *gin.Context) {
	createFeedbackSession(c, true)
}

// CreateFeedbackSession exchanges a server-held Workshop API Key for a
// short-lived browser token scoped to exactly one project/customer pair.
func CreateFeedbackSession(c *gin.Context) {
	createFeedbackSession(c, false)
}

func createFeedbackSession(c *gin.Context, allowConsoleProject bool) {
	var req CreateFeedbackSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
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

	customUserID, isConsoleProject := resolveFeedbackSessionCustomerID(allowConsoleProject, req.ProjectID, userID, req.CustomUserID)
	req.CustomUserID = customUserID
	if req.ProjectID == 0 || req.CustomUserID == "" || len(req.CustomUserID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 和 custom_user_id 为必填项，custom_user_id 最大长度为 128", nil))
		return
	}

	if isConsoleProject {
		var project models.Project
		if err := db.First(&project, req.ProjectID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "Console 反馈项目不存在", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证 Console 反馈项目失败: "+err.Error(), nil))
			return
		}
	} else {
		var member models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, userID).First(&member).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "当前认证用户不是该项目成员，无法创建反馈会话", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
			return
		}
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
