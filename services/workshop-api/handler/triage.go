package handler

import (
	"encoding/json"
	"math"
	"net/http"
	"strings"
	"unicode/utf8"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
)

// TriageResult AI 分诊结果
type TriageResult struct {
	Confidence          float64 `json:"confidence"`
	Type                string  `json:"type"`
	Priority            string  `json:"priority"`
	Actionability       string  `json:"actionability"`
	NeedsClarification  bool    `json:"needs_clarification"`
	Clarity             float64 `json:"clarity"`
	Impact              float64 `json:"impact"`
	Urgency             float64 `json:"urgency"`
	Reasoning           string  `json:"reasoning"`
}

// TriageHandler 对反馈执行 AI 分诊分析，结果写入 feedback.data.triage
func TriageHandler(c *gin.Context) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeNotFound, "反馈不存在", nil))
		return
	}

	triage := analyzeFeedback(feedback.Title, feedback.Content)

	data := parseFeedbackPayload(feedback.Data)
	data["triage"] = triage
	raw, err := json.Marshal(data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "序列化失败", nil))
		return
	}
	text := string(raw)

	if err := db.Model(&feedback).Update("data", &text).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "更新失败", nil))
		return
	}
	feedback.Data = &text

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"feedback_id": feedback.ID,
		"triage":      triage,
	}))
}

// analyzeFeedback 基于关键词和文本特征的启发式分诊
func analyzeFeedback(title, content string) TriageResult {
	text := strings.ToLower(title + " " + content)
	runeCount := utf8.RuneCountInString(content)

	// 类型判断
	issueType := classifyType(text)

	// 优先级判断
	priority := classifyPriority(text, issueType)

	// 可行动性判断
	actionability := classifyActionability(text, issueType)

	// 是否需要补问
	needsClarification := needsMoreInfo(text, runeCount)

	// 三维评分
	clarity := scoreClarity(text, runeCount)
	impact := scoreImpact(text, issueType)
	urgency := scoreUrgency(text, issueType, priority)

	// 综合置信度
	confidence := (clarity + impact + urgency) / 3

	// 推理说明
	reasoning := buildReasoning(issueType, priority, actionability, needsClarification, clarity, impact, urgency)

	return TriageResult{
		Confidence:         round2(confidence),
		Type:               issueType,
		Priority:           priority,
		Actionability:      actionability,
		NeedsClarification: needsClarification,
		Clarity:            round2(clarity),
		Impact:             round2(impact),
		Urgency:            round2(urgency),
		Reasoning:          reasoning,
	}
}

var bugKeywords = []string{"崩溃", "crash", "bug", "错误", "error", "失败", "fail", "异常", "exception", "不能", "无法", "can't", "cannot", "不了", "白屏", "黑屏", "卡死", "无响应", "500", "404", "报错"}
var featureKeywords = []string{"希望", "建议", "需求", "功能", "feature", "能不能", "是否可以", "新增", "添加", "支持", "增加", "优化", "改进", "体验"}
var questionKeywords = []string{"怎么", "如何", "为什么", "why", "how", "什么", "哪里", "在哪", "是什么", "请问", "咨询"}
var urgentKeywords = []string{"紧急", "urgent", "马上", "立刻", "尽快", "asap", "阻塞", "block", "生产", "线上", "线上环境", "客户", "影响用户", "数据丢失"}
var negativeKeywords = []string{"差", "烂", "垃圾", "失望", "投诉", "退款", "卸载", "不用了", "太差"}

func classifyType(text string) string {
	bugScore, featureScore, questionScore := 0, 0, 0
	for _, kw := range bugKeywords {
		if strings.Contains(text, kw) {
			bugScore++
		}
	}
	for _, kw := range featureKeywords {
		if strings.Contains(text, kw) {
			featureScore++
		}
	}
	for _, kw := range questionKeywords {
		if strings.Contains(text, kw) {
			questionScore++
		}
	}
	max := bugScore
	result := "bug"
	if featureScore > max {
		max = featureScore
		result = "feature"
	}
	if questionScore > max {
		max = questionScore
		result = "question"
	}
	if max == 0 {
		result = "other"
	}
	return result
}

func classifyPriority(text, issueType string) string {
	for _, kw := range urgentKeywords {
		if strings.Contains(text, kw) {
			return "P1"
		}
	}
	if issueType == "bug" {
		for _, kw := range []string{"崩溃", "crash", "数据丢失", "阻塞", "生产", "线上"} {
			if strings.Contains(text, kw) {
				return "P1"
			}
		}
		return "P2"
	}
	if issueType == "feature" {
		return "P2"
	}
	return "P3"
}

func classifyActionability(text, issueType string) string {
	if issueType == "question" {
		return "需确认后行动"
	}
	if issueType == "bug" {
		for _, kw := range []string{"步骤", "复现", "操作", "截图", "日志", "版本"} {
			if strings.Contains(text, kw) {
				return "可直接行动"
			}
		}
		return "需补充信息"
	}
	if issueType == "feature" {
		return "需评估后行动"
	}
	return "需确认后行动"
}

func needsMoreInfo(text string, runeCount int) bool {
	if runeCount < 20 {
		return true
	}
	for _, kw := range []string{"具体", "详细", "步骤", "复现", "版本", "环境", "截图"} {
		if strings.Contains(text, kw) {
			return false
		}
	}
	if runeCount < 50 {
		return true
	}
	return false
}

func scoreClarity(text string, runeCount int) float64 {
	score := 0.5
	if runeCount > 100 {
		score += 0.2
	} else if runeCount > 50 {
		score += 0.1
	} else if runeCount < 20 {
		score -= 0.2
	}
	hasSteps := false
	for _, kw := range []string{"步骤", "1.", "2.", "首先", "然后", "接着"} {
		if strings.Contains(text, kw) {
			hasSteps = true
			break
		}
	}
	if hasSteps {
		score += 0.15
	}
	hasDetail := false
	for _, kw := range []string{"版本", "环境", "设备", "浏览器", "系统", "截图", "日志"} {
		if strings.Contains(text, kw) {
			hasDetail = true
			break
		}
	}
	if hasDetail {
		score += 0.15
	}
	return math.Min(1, math.Max(0, score))
}

func scoreImpact(text string, issueType string) float64 {
	score := 0.4
	if issueType == "bug" {
		score = 0.6
	}
	for _, kw := range []string{"所有用户", "全部", "所有", "线上", "生产", "影响", "阻塞"} {
		if strings.Contains(text, kw) {
			score += 0.2
			break
		}
}
	for _, kw := range negativeKeywords {
		if strings.Contains(text, kw) {
			score += 0.15
			break
		}
	}
	return math.Min(1, math.Max(0, score))
}

func scoreUrgency(text string, issueType, priority string) float64 {
	score := 0.3
	if priority == "P1" {
		score = 0.9
	} else if priority == "P2" {
		score = 0.6
	}
	if issueType == "bug" {
		score += 0.1
	}
	return math.Min(1, math.Max(0, score))
}

func buildReasoning(issueType, priority, actionability string, needsClarification bool, clarity, impact, urgency float64) string {
	var parts []string
	switch issueType {
	case "bug":
		parts = append(parts, "检测到缺陷类反馈")
	case "feature":
		parts = append(parts, "检测到功能需求类反馈")
	case "question":
		parts = append(parts, "检测到咨询类反馈")
	default:
		parts = append(parts, "反馈类型不明确")
	}
	if priority == "P1" {
		parts = append(parts, "涉及紧急或线上问题")
	}
	if needsClarification {
		parts = append(parts, "信息不足，需补问")
	}
	if clarity < 0.5 {
		parts = append(parts, "描述不够清晰")
	}
	if impact > 0.7 {
		parts = append(parts, "影响面较大")
	}
	if len(parts) == 0 {
		parts = append(parts, "常规反馈")
	}
	return strings.Join(parts, "；")
}

func round2(f float64) float64 {
	return math.Round(f*100) / 100
}
