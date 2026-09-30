package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// OpenHandsSyncResult OpenHands Agent Server 同步调用结果
type OpenHandsSyncResult struct {
	ConversationID string // OpenHands 侧会话 ID
	Content        string // agent 最终回复文本
}

// ohLLMConfig 构建每请求必填的 LLM 配置。
// 真实契约：agent.llm 为必填字段，容器环境变量不会作为默认值，
// 因此 api_key 从服务环境变量 LLM_API_KEY 读取，不落库。
// temperature 必须下传（取 DB agent.LLMTemperature，默认 0.0）：
// 否则模型按默认随机采样运行，同一 query 每次回复不同，
// 检索抽取的文件路径/命中集合随之抖动（反馈详情"一会有内容一会没内容"）。
func ohLLMConfig(agent *OpenHandsAgent) (map[string]interface{}, error) {
	apiKey := strings.TrimSpace(os.Getenv("LLM_API_KEY"))
	if apiKey == "" {
		return nil, fmt.Errorf("环境变量 LLM_API_KEY 未配置，无法调用 OpenHands Agent")
	}

	model := strings.TrimSpace(os.Getenv("LLM_MODEL"))
	if model == "" && agent != nil && agent.LLMModel != "" {
		model = agent.LLMModel
	}
	if model == "" {
		model = "deepseek/deepseek-chat"
	}

	temperature := 0.0
	if agent != nil {
		temperature = agent.LLMTemperature
	}

	llm := map[string]interface{}{
		"model":       model,
		"api_key":     apiKey,
		"temperature": temperature,
	}
	if baseURL := strings.TrimSpace(os.Getenv("LLM_BASE_URL")); baseURL != "" {
		llm["base_url"] = baseURL
	}
	return llm, nil
}

// openHandsEnabled 读取 OPENHANDS_ENABLED 总开关，未配置时默认开启。
func openHandsEnabled() bool {
	value := strings.TrimSpace(os.Getenv("OPENHANDS_ENABLED"))
	if value == "" {
		return true
	}
	return !strings.EqualFold(value, "false") && value != "0"
}

// ohWorkspaceDir OpenHands 容器内客户代码挂载目录
func ohWorkspaceDir() string {
	if dir := strings.TrimSpace(os.Getenv("OH_WORKSPACE_DIR")); dir != "" {
		return dir
	}
	return "/projects"
}

// ohMaxIterations agent 循环上限
func ohMaxIterations(agent *OpenHandsAgent) int {
	if agent != nil && agent.MaxIterations > 0 {
		return agent.MaxIterations
	}
	return 20
}

// ohDefaultRequestTimeout 单次 HTTP 请求默认超时（轮询/查询类调用）。
const ohDefaultRequestTimeout = 30 * time.Second

// ohAgentTimeout Agent 整体超时：以 DB 配置的 agent.TimeoutMs 为准。
func ohAgentTimeout(agent *OpenHandsAgent) time.Duration {
	if agent != nil && agent.TimeoutMs > 0 {
		return time.Duration(agent.TimeoutMs) * time.Millisecond
	}
	return 120 * time.Second
}

// ohRequest 发送 JSON HTTP 请求并返回状态码与响应体。
// timeout<=0 时使用 ohDefaultRequestTimeout；创建会话/续发消息应传 ohAgentTimeout(agent)，
// 避免长任务被固定 30s 客户端超时切断。
func ohRequest(method, url, apiKey string, payload interface{}, timeout time.Duration) (int, []byte, error) {
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			return 0, nil, fmt.Errorf("序列化请求失败: %w", err)
		}
		body = bytes.NewReader(data)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return 0, nil, fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("X-Session-API-Key", apiKey)
	}

	if timeout <= 0 {
		timeout = ohDefaultRequestTimeout
	}
	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("请求 %s %s 失败: %w", method, url, err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, nil, fmt.Errorf("读取响应失败: %w", err)
	}
	return resp.StatusCode, data, nil
}

// ohCreateConversation 创建 OpenHands 会话（真实契约必填 workspace/initial_message/agent）
func ohCreateConversation(agent *OpenHandsAgent, query string) (string, error) {
	llm, err := ohLLMConfig(agent)
	if err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"workspace": map[string]interface{}{
			"kind":        "LocalWorkspace",
			"working_dir": ohWorkspaceDir(),
		},
		"initial_message": map[string]interface{}{
			"role":    "user",
			"content": []map[string]string{{"text": query}},
		},
		"agent": map[string]interface{}{
			"kind": "Agent",
			"llm":  llm,
			"tools": []map[string]interface{}{
				{"name": "terminal", "params": map[string]interface{}{}},
				{"name": "file_editor", "params": map[string]interface{}{}},
			},
		},
		"max_iterations": ohMaxIterations(agent),
	}

	status, data, err := ohRequest("POST", agent.URL+"/api/conversations", agent.APIKey, payload, ohAgentTimeout(agent))
	if err != nil {
		return "", err
	}
	if status != http.StatusOK && status != http.StatusCreated {
		return "", fmt.Errorf("创建 OpenHands 会话失败: HTTP %d: %s", status, truncateStr(string(data), 300))
	}

	var resp struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &resp); err != nil || resp.ID == "" {
		return "", fmt.Errorf("解析 OpenHands 会话 ID 失败: %s", truncateStr(string(data), 300))
	}
	return resp.ID, nil
}

// ohSendMessage 在已有会话中续发用户消息并触发执行
func ohSendMessage(agent *OpenHandsAgent, conversationID, query string) error {
	payload := map[string]interface{}{
		"role":    "user",
		"content": []map[string]string{{"text": query}},
		"run":     true,
	}

	status, data, err := ohRequest("POST", agent.URL+"/api/conversations/"+conversationID+"/events", agent.APIKey, payload, ohAgentTimeout(agent))
	if err != nil {
		return err
	}
	if status == http.StatusNotFound {
		return fmt.Errorf("会话不存在或已清理")
	}
	if status != http.StatusOK && status != http.StatusCreated && status != http.StatusAccepted {
		return fmt.Errorf("发送消息失败: HTTP %d: %s", status, truncateStr(string(data), 300))
	}
	return nil
}

// agentVisionEnabled 控制是否向 Agent 传递图片（多模态）。
// 默认关闭：纯文本模型不传图，避免 OpenHands 侧不支持 image content 时报错。
// 切换到支持 vision 的多模态模型后，置 AGENT_VISION_ENABLED=true 即可让 Agent 真实看图。
func agentVisionEnabled() bool {
	v := strings.TrimSpace(os.Getenv("AGENT_VISION_ENABLED"))
	return v == "true" || v == "1" || strings.EqualFold(v, "yes")
}

// ohSendMessageWithImages 在已有会话续发带图片的用户消息（多模态预留）。
// content 数组按 OpenAI 多模态格式：text part + image_url part。
// 仅当 agentVisionEnabled() 为真时调用；否则应回退到 ohSendMessage（纯文本）。
func ohSendMessageWithImages(agent *OpenHandsAgent, conversationID, query string, imageUrls []string) error {
	content := []map[string]interface{}{{"type": "text", "text": query}}
	for _, u := range imageUrls {
		if strings.TrimSpace(u) == "" {
			continue
		}
		content = append(content, map[string]interface{}{
			"type":      "image_url",
			"image_url": map[string]string{"url": u},
		})
	}
	payload := map[string]interface{}{
		"role":    "user",
		"content": content,
		"run":     true,
	}

	status, data, err := ohRequest("POST", agent.URL+"/api/conversations/"+conversationID+"/events", agent.APIKey, payload, ohAgentTimeout(agent))
	if err != nil {
		return err
	}
	if status == http.StatusNotFound {
		return fmt.Errorf("会话不存在或已清理")
	}
	if status != http.StatusOK && status != http.StatusCreated && status != http.StatusAccepted {
		return fmt.Errorf("发送消息失败: HTTP %d: %s", status, truncateStr(string(data), 300))
	}
	return nil
}

// ohEnsureRunning 新建会话未自动执行时显式触发 run
func ohEnsureRunning(agent *OpenHandsAgent, conversationID string) {
	status, data, err := ohRequest("GET", agent.URL+"/api/conversations/"+conversationID, agent.APIKey, nil, 0)
	if err != nil || status != http.StatusOK {
		return
	}
	var resp struct {
		ExecutionStatus string `json:"execution_status"`
	}
	if json.Unmarshal(data, &resp) != nil {
		return
	}
	if resp.ExecutionStatus == "idle" {
		_, _, _ = ohRequest("POST", agent.URL+"/api/conversations/"+conversationID+"/run", agent.APIKey, map[string]interface{}{}, 0)
	}
}

// ohWaitFinished 轮询会话直至执行结束
func ohWaitFinished(agent *OpenHandsAgent, conversationID string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		status, data, err := ohRequest("GET", agent.URL+"/api/conversations/"+conversationID, agent.APIKey, nil, 0)
		if err == nil && status == http.StatusOK {
			var resp struct {
				ExecutionStatus string `json:"execution_status"`
			}
			if json.Unmarshal(data, &resp) == nil {
				switch resp.ExecutionStatus {
				case "finished", "idle":
					return nil
				case "error":
					return fmt.Errorf("OpenHands 执行出错")
				}
			}
		}
		time.Sleep(2 * time.Second)
	}
	return fmt.Errorf("等待 OpenHands 执行超时（%s）", timeout)
}

// ohFetchAgentReply 从 MessageEvent 中提取最后一条 agent 回复文本
func ohFetchAgentReply(agent *OpenHandsAgent, conversationID string) (string, error) {
	url := agent.URL + "/api/conversations/" + conversationID + "/events/search?query=" + url.QueryEscape("MessageEvent")
	status, data, err := ohRequest("GET", url, agent.APIKey, nil, 0)
	if err != nil {
		return "", err
	}
	if status != http.StatusOK {
		return "", fmt.Errorf("查询事件失败: HTTP %d: %s", status, truncateStr(string(data), 300))
	}

	var resp struct {
		Items []struct {
			ID     string `json:"id"`
			Source string `json:"source"`
			LLMMessage *struct {
				Content []struct {
					Text string `json:"text"`
				} `json:"content"`
			} `json:"llm_message"`
		} `json:"items"`
	}
	if err := json.Unmarshal(data, &resp); err != nil {
		return "", fmt.Errorf("解析事件失败: %w", err)
	}

	for i := len(resp.Items) - 1; i >= 0; i-- {
		item := resp.Items[i]
		if item.Source == "agent" && item.LLMMessage != nil {
			var sb strings.Builder
			for _, part := range item.LLMMessage.Content {
				sb.WriteString(part.Text)
			}
			if text := strings.TrimSpace(sb.String()); text != "" {
				return text, nil
			}
		}
	}
	return "", fmt.Errorf("未找到 agent 回复")
}

// callOpenHandsAgentSync 同步调用 OpenHands Agent Server（真实契约）。
// ohConversationID 为空时新建会话；非空时续发消息，会话失效则自动重建。
// 返回 OpenHands 侧会话 ID 与 agent 最终回复。
func callOpenHandsAgentSync(agent *OpenHandsAgent, query, ohConversationID string, imageUrls []string) (*OpenHandsSyncResult, error) {
	timeout := ohAgentTimeout(agent)

	convID := ""
	if strings.TrimSpace(ohConversationID) != "" {
		sendErr := ohSendMessage(agent, ohConversationID, query)
		if sendErr == nil {
			convID = ohConversationID
		} else if agentVisionEnabled() && len(imageUrls) > 0 {
			// 纯文本续发失败时，若启用多模态且有图片，尝试带图续发
			if imgErr := ohSendMessageWithImages(agent, ohConversationID, query, imageUrls); imgErr == nil {
				convID = ohConversationID
			}
		}
		// 续发失败（会话已清理）时降级为新建
	}
	if convID == "" {
		id, err := ohCreateConversation(agent, query)
		if err != nil {
			return nil, err
		}
		convID = id
		ohEnsureRunning(agent, convID)
	}

	if err := ohWaitFinished(agent, convID, timeout); err != nil {
		return nil, err
	}

	content, err := ohFetchAgentReply(agent, convID)
	if err != nil {
		return nil, err
	}
	return &OpenHandsSyncResult{ConversationID: convID, Content: content}, nil
}

// truncateStr 截断字符串用于日志与错误信息
func truncateStr(s string, n int) string {
	runes := []rune(strings.TrimSpace(s))
	if len(runes) <= n {
		return string(runes)
	}
	return string(runes[:n]) + "..."
}
