package handler

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// OpenHandsSyncResult OpenHands Agent Server 同步调用结果
type OpenHandsSyncResult struct {
	ConversationID string // OpenHands 侧会话 ID
	Content        string // agent 最终回复文本
}

// ohLLMConfig 构建每请求必填的 LLM 配置。
// 真实契约：agent.llm 为必填字段，容器环境变量不会作为默认值。
// 项目密钥优先；没有项目密钥时才使用服务环境变量 LLM_API_KEY。
// temperature 必须下传（取 DB agent.LLMTemperature，默认 0.0）：
// 否则模型按默认随机采样运行，同一 query 每次回复不同，
// 检索抽取的文件路径/命中集合随之抖动（反馈详情"一会有内容一会没内容"）。
func ohLLMConfig(agent *OpenHandsAgent) (map[string]interface{}, error) {
	apiKey := ""
	if agent != nil && strings.TrimSpace(agent.LLMAPIKeyEncrypted) != "" {
		decrypted, err := decryptOpenHandsLLMAPIKey(agent.ProjectID, agent.LLMAPIKeyEncrypted)
		if err != nil {
			return nil, fmt.Errorf("读取项目模型 Key 失败: %w", err)
		}
		apiKey = strings.TrimSpace(decrypted)
	} else {
		apiKey = configuredServerLLMAPIKey()
	}
	if apiKey == "" {
		return nil, fmt.Errorf("项目和服务器均未配置模型 API Key，无法调用 OpenHands Agent")
	}

	model := ""
	if agent != nil && agent.LLMModel != "" {
		model = agent.LLMModel
	}
	if model == "" {
		model = strings.TrimSpace(os.Getenv("LLM_MODEL"))
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
	baseURL := ""
	if agent != nil {
		baseURL = strings.TrimSpace(agent.LLMBaseURL)
	}
	if baseURL == "" {
		baseURL = strings.TrimSpace(os.Getenv("LLM_BASE_URL"))
	}
	if baseURL != "" {
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

// ohRepoRoot 每项目代码副本的存放根目录（部署方案 A：每项目一份 clone）。
// 容器需把该目录挂进 OpenHands 容器并保证可写，Agent 才能在其下工作。
func ohRepoRoot() string {
	if dir := strings.TrimSpace(os.Getenv("OH_REPO_ROOT")); dir != "" {
		return dir
	}
	return "/workspace/customer-repos"
}

// ohClonedRepoDir 某项目 clone 代码副本的落点：{ohRepoRoot}/{projectID}
func ohClonedRepoDir(projectID uint) string {
	return filepath.Join(ohRepoRoot(), strconv.FormatUint(uint64(projectID), 10))
}

// resolveProjectWorkspaceDir fails closed when project repository coverage is unavailable.
// Multiple repositories are exposed beneath a project-only, content-addressed directory.
// This narrows repository discovery; process/container filesystem isolation is still an operator responsibility.
func resolveProjectWorkspaceDir(db *gorm.DB, projectID uint) string {
	if db == nil || projectID == 0 {
		return ""
	}
	var repos []CustomerCodeRepo
	if err := db.Where("project_id = ?", projectID).Order("id ASC").Find(&repos).Error; err != nil {
		return ""
	}
	path, err := projectRepositoryWorkspace(projectID, repos)
	if err != nil {
		return ""
	}
	return path
}

func projectRepositoryWorkspace(projectID uint, repos []CustomerCodeRepo) (string, error) {
	if projectID == 0 || len(repos) == 0 {
		return "", fmt.Errorf("项目尚未配置可用仓库")
	}
	paths := make([]string, 0, len(repos))
	for _, repo := range repos {
		if repo.ProjectID != projectID || repo.Status != "ready" {
			return "", fmt.Errorf("项目仓库尚未全部准备好，请完成同步后重试")
		}
		path := strings.TrimSpace(repo.RepoPath)
		if len(repos) == 1 && (path == "" || !dirExists(path)) {
			path = ohClonedRepoDir(projectID)
		}
		canonical, err := filepath.EvalSymlinks(path)
		if err != nil || !dirExists(canonical) {
			return "", fmt.Errorf("项目仓库目录不可用")
		}
		canonical, err = filepath.Abs(canonical)
		if err != nil {
			return "", err
		}
		for _, root := range []string{ohWorkspaceDir(), ohRepoRoot(), string(filepath.Separator)} {
			resolved, _ := filepath.EvalSymlinks(root)
			if canonical == filepath.Clean(root) || (resolved != "" && canonical == resolved) {
				return "", fmt.Errorf("项目仓库不得指向共享根目录")
			}
		}
		paths = append(paths, canonical)
	}
	if len(paths) == 1 {
		return paths[0], nil
	}
	identity := make([]string, len(paths))
	for index, path := range paths {
		identity[index] = fmt.Sprintf("%d:%s", repos[index].ID, path)
	}
	digest := sha256.Sum256([]byte(strings.Join(identity, "\x00")))
	root := filepath.Join(ohRepoRoot(), ".agent-workspaces", strconv.FormatUint(uint64(projectID), 10), fmt.Sprintf("%x", digest[:12]))
	if err := os.MkdirAll(root, 0700); err != nil {
		return "", err
	}
	for index, path := range paths {
		link := filepath.Join(root, fmt.Sprintf("repo-%d", repos[index].ID))
		if current, err := os.Readlink(link); err == nil {
			if current != path {
				return "", fmt.Errorf("项目工作区仓库映射不匹配")
			}
			continue
		}
		if err := os.Symlink(path, link); err != nil {
			return "", err
		}
	}
	return root, nil
}

// dirExists 判断路径是否存在且为目录。
func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
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
// ohCreateConversation 创建 OpenHands 会话。
// workingDir 必须是按项目隔离的工作区（见 resolveProjectWorkspaceDir），
// 未提供项目工作区时拒绝调用，不允许回退到共享目录。
func ohCreateConversation(agent *OpenHandsAgent, query, workingDir string) (string, error) {
	return ohCreateConversationWithImages(agent, query, workingDir, nil)
}

func ohCreateConversationWithImages(agent *OpenHandsAgent, query, workingDir string, imageURLs []string) (string, error) {
	llm, err := ohLLMConfig(agent)
	if err != nil {
		return "", err
	}

	dir := strings.TrimSpace(workingDir)
	if dir == "" {
		return "", fmt.Errorf("项目知识工作区暂不可用，请完成项目仓库同步后重试")
	}

	payload := map[string]interface{}{
		"workspace": map[string]interface{}{
			"kind":        "LocalWorkspace",
			"working_dir": dir,
		},
		"initial_message": map[string]interface{}{
			"role":    "user",
			"content": ohMessageContent(query, imageURLs),
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

	status, data, err := ohRequest("POST", agent.URL+"/api/conversations", resolveOpenHandsSessionAPIKey(agent), payload, ohAgentTimeout(agent))
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

	status, data, err := ohRequest("POST", agent.URL+"/api/conversations/"+conversationID+"/events", resolveOpenHandsSessionAPIKey(agent), payload, ohAgentTimeout(agent))
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

	status, data, err := ohRequest("POST", agent.URL+"/api/conversations/"+conversationID+"/events", resolveOpenHandsSessionAPIKey(agent), payload, ohAgentTimeout(agent))
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
	status, data, err := ohRequest("GET", agent.URL+"/api/conversations/"+conversationID, resolveOpenHandsSessionAPIKey(agent), nil, 0)
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
		_, _, _ = ohRequest("POST", agent.URL+"/api/conversations/"+conversationID+"/run", resolveOpenHandsSessionAPIKey(agent), map[string]interface{}{}, 0)
	}
}

// ohWaitFinished 轮询会话直至执行结束
func ohWaitFinished(agent *OpenHandsAgent, conversationID string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		status, data, err := ohRequest("GET", agent.URL+"/api/conversations/"+conversationID, resolveOpenHandsSessionAPIKey(agent), nil, 0)
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
	status, data, err := ohRequest("GET", url, resolveOpenHandsSessionAPIKey(agent), nil, 0)
	if err != nil {
		return "", err
	}
	if status != http.StatusOK {
		return "", fmt.Errorf("查询事件失败: HTTP %d: %s", status, truncateStr(string(data), 300))
	}

	var resp struct {
		Items []struct {
			ID         string `json:"id"`
			Source     string `json:"source"`
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
func callOpenHandsAgentSync(agent *OpenHandsAgent, query, ohConversationID string, imageUrls []string, workingDir string) (*OpenHandsSyncResult, error) {
	if strings.TrimSpace(workingDir) == "" {
		return nil, fmt.Errorf("项目知识工作区暂不可用，请完成项目仓库同步后重试")
	}
	if len(imageUrls) > 0 && !agentVisionEnabled() {
		return nil, fmt.Errorf("当前服务未启用图片理解，图片尚未被模型读取")
	}
	timeout := ohAgentTimeout(agent)

	convID := ""
	if strings.TrimSpace(ohConversationID) != "" {
		var sendErr error
		if len(imageUrls) > 0 {
			sendErr = ohSendMessageWithImages(agent, ohConversationID, query, imageUrls)
		} else {
			sendErr = ohSendMessage(agent, ohConversationID, query)
		}
		if sendErr == nil {
			convID = ohConversationID
		}

		// 续发失败（会话已清理）时降级为新建
	}
	if convID == "" {
		id, err := ohCreateConversationWithImages(agent, query, workingDir, imageUrls)
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

// ohMessageContent uses one content constructor for initial and resumed turns.
func ohMessageContent(query string, images []string) []map[string]interface{} {
	content := []map[string]interface{}{{"type": "text", "text": query}}
	for _, u := range images {
		content = append(content, map[string]interface{}{"type": "image_url", "image_url": map[string]string{"url": u}})
	}
	return content
}
