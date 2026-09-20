package handler

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"todo/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AgentTool 定义 Agent 可调用的工具
type AgentTool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// ToolCall 工具调用请求
type ToolCall struct {
	Tool   string                 `json:"tool"`
	Params map[string]interface{} `json:"params"`
}

// ToolResult 工具调用结果
type ToolResult struct {
	Tool    string `json:"tool"`
	Content string `json:"content"`
	Success bool   `json:"success"`
}

// GetAgentTools 获取 Agent 可用的工具列表
func GetAgentTools(projectID uint, db *gorm.DB) []AgentTool {
	return []AgentTool{
		{
			Name:        "search_customer_code",
			Description: "搜索客户代码仓库中的代码和文档，查找相关函数、类、模块的实现或文档说明。适用于代码和文档相关问题。",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "搜索关键词或问题描述",
					},
					"limit": map[string]interface{}{
						"type":        "integer",
						"description": "返回结果数量，默认5",
						"default":     5,
					},
				},
				"required": []string{"query"},
			},
		},
		{
			Name:        "search_customer_docs",
			Description: "搜索代码仓库中的文档文件（.md/.txt/.json），包括spec、设计文档、README、FAQ。适用于需求和设计相关问题。",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "搜索关键词或问题描述",
					},
					"limit": map[string]interface{}{
						"type":        "integer",
						"description": "返回结果数量，默认5",
						"default":     5,
					},
				},
				"required": []string{"query"},
			},
		},
		{
			Name:        "search_product_knowledge",
			Description: "搜索代码仓库中的知识文档，包括arckit facts、FAQ、配置说明。适用于产品使用和常见问题。",
			Parameters: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "搜索关键词或问题描述",
					},
					"limit": map[string]interface{}{
						"type":        "integer",
						"description": "返回结果数量，默认5",
						"default":     5,
					},
				},
				"required": []string{"query"},
			},
		},
	}
}

// ExecuteTool 执行工具调用
func ExecuteTool(c *gin.Context, projectID uint, toolCall ToolCall) ToolResult {
	db := middleware.GetDB(c)
	if db == nil {
		return ToolResult{
			Tool:    toolCall.Tool,
			Content: "数据库连接未初始化",
			Success: false,
		}
	}

	query := getStringParam(toolCall.Params, "query", "")
	limit := getIntParam(toolCall.Params, "limit", 5)

	if query == "" {
		return ToolResult{
			Tool:    toolCall.Tool,
			Content: "搜索关键词不能为空",
			Success: false,
		}
	}

	switch toolCall.Tool {
	case "search_customer_code":
		return searchCustomerCodeTool(db, projectID, query, limit)
	case "search_customer_docs":
		return searchCustomerDocsTool(db, projectID, query, limit)
	case "search_product_knowledge":
		return searchProductKnowledgeTool(db, projectID, query, limit)
	default:
		return ToolResult{
			Tool:    toolCall.Tool,
			Content: fmt.Sprintf("未知工具: %s", toolCall.Tool),
			Success: false,
		}
	}
}

// searchCustomerCodeTool 搜索客户代码仓库
func searchCustomerCodeTool(db *gorm.DB, projectID uint, query string, limit int) ToolResult {
	results := searchCodeChunksBySQL(db, projectID, query, limit)

	if len(results) == 0 {
		return ToolResult{
			Tool:    "search_customer_code",
			Content: "未找到相关代码",
			Success: true,
		}
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("找到 %d 个相关代码片段：\n\n", len(results)))

	for i, r := range results {
		sb.WriteString(fmt.Sprintf("%d. **%s** (%s)\n", i+1, r.FilePath, r.SymbolName))
		sb.WriteString(fmt.Sprintf("   位置: %d-%d行\n", r.StartLine, r.EndLine))
		sb.WriteString(fmt.Sprintf("   代码:\n```%s\n```\n\n", r.Snippet))
	}

	return ToolResult{
		Tool:    "search_customer_code",
		Content: sb.String(),
		Success: true,
	}
}

// searchCustomerDocsTool 搜索项目文档（代码仓库中的 .md/.txt 文件）
func searchCustomerDocsTool(db *gorm.DB, projectID uint, query string, limit int) ToolResult {
	// 直接搜索代码仓库中的文档文件（.md/.txt/.json 等）
	results := searchCodeChunksBySQL(db, projectID, query, limit)

	if len(results) == 0 {
		return ToolResult{
			Tool:    "search_customer_docs",
			Content: "未找到相关文档",
			Success: true,
		}
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("找到 %d 个相关文档片段：\n\n", len(results)))

	for i, r := range results {
		sb.WriteString(fmt.Sprintf("%d. **%s** (%s)\n", i+1, r.FilePath, r.SymbolName))
		sb.WriteString(fmt.Sprintf("   位置: %d-%d行\n", r.StartLine, r.EndLine))
		sb.WriteString(fmt.Sprintf("   内容:\n```\n%s\n```\n\n", r.Snippet))
	}

	return ToolResult{
		Tool:    "search_customer_docs",
		Content: sb.String(),
		Success: true,
	}
}

// searchProductKnowledgeTool 搜索产品知识库（代码仓库中的文档）
func searchProductKnowledgeTool(db *gorm.DB, projectID uint, query string, limit int) ToolResult {
	// 搜索代码仓库中的知识文档（FAQ、README、配置说明等）
	results := searchCodeChunksBySQL(db, projectID, query, limit)

	if len(results) == 0 {
		return ToolResult{
			Tool:    "search_product_knowledge",
			Content: "未找到相关产品知识",
			Success: true,
		}
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("找到 %d 个相关知识片段：\n\n", len(results)))

	for i, r := range results {
		sb.WriteString(fmt.Sprintf("%d. **%s** (%s)\n", i+1, r.FilePath, r.SymbolName))
		sb.WriteString(fmt.Sprintf("   位置: %d-%d行\n", r.StartLine, r.EndLine))
		sb.WriteString(fmt.Sprintf("   内容:\n```\n%s\n```\n\n", r.Snippet))
	}

	return ToolResult{
		Tool:    "search_product_knowledge",
		Content: sb.String(),
		Success: true,
	}
}

// ParseToolCalls 解析 LLM 响应中的工具调用
func ParseToolCalls(content string) []ToolCall {
	// 尝试从内容中提取 JSON 格式的工具调用
	var toolCalls []ToolCall
	
	// 查找 ```json ... ``` 块
	jsonBlocks := extractJSONBlocks(content)
	for _, block := range jsonBlocks {
		var tc ToolCall
		if err := json.Unmarshal([]byte(block), &tc); err == nil && tc.Tool != "" {
			toolCalls = append(toolCalls, tc)
		}
	}

	return toolCalls
}

// extractJSONBlocks 从文本中提取 JSON 块
func extractJSONBlocks(text string) []string {
	var blocks []string
	lines := strings.Split(text, "\n")
	
	inJSON := false
	var currentBlock strings.Builder
	
	for _, line := range lines {
		if strings.Contains(line, "```json") || strings.Contains(line, "```JSON") {
			inJSON = true
			currentBlock.Reset()
			continue
		}
		if strings.Contains(line, "```") && inJSON {
			inJSON = false
			blocks = append(blocks, currentBlock.String())
			continue
		}
		if inJSON {
			currentBlock.WriteString(line)
			currentBlock.WriteString("\n")
		}
	}
	
	return blocks
}

// ToolCallsToContent 将工具调用结果转换为 LLM 可读内容
func ToolCallsToContent(results []ToolResult) string {
	if len(results) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("工具调用结果：\n\n")

	for _, r := range results {
		sb.WriteString(fmt.Sprintf("## %s\n", r.Tool))
		if r.Success {
			sb.WriteString(r.Content)
		} else {
			sb.WriteString(fmt.Sprintf("调用失败: %s", r.Content))
		}
		sb.WriteString("\n\n")
	}

	return sb.String()
}

// SortToolResults 按工具名排序结果
func SortToolResults(results []ToolResult) {
	sort.Slice(results, func(i, j int) bool {
		return results[i].Tool < results[j].Tool
	})
}

// 辅助函数
func getStringParam(params map[string]interface{}, key, defaultVal string) string {
	if val, ok := params[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultVal
}

func getIntParam(params map[string]interface{}, key string, defaultVal int) int {
	if val, ok := params[key]; ok {
		switch v := val.(type) {
		case float64:
			return int(v)
		case int:
			return v
		case json.Number:
			if i, err := v.Int64(); err == nil {
				return int(i)
			}
		}
	}
	return defaultVal
}
