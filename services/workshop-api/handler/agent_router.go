package handler

import (
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"
)

// IntentType 消息意图类型
type IntentType string

const (
	IntentConversational IntentType = "conversational" // 闲聊、问候、感谢等
	IntentAction         IntentType = "action"         // 提交 bug、建议等操作类
	IntentCodeQuery      IntentType = "code_query"     // 代码、架构、功能等需要检索的问题
	IntentUnknown        IntentType = "unknown"        // 未命中本地白名单，放行 Agent
)

// 分流原则：本地只做正向白名单命中（高把握规则显式匹配后本地回复）。
// 未命中任何规则一律返回 IntentUnknown / nil，放行 OpenHands/LLM。
// 禁止用长度、关键词缺失等负向启发式把消息截胡成固定兜底文案。

// localReplyRule 本地回复规则：patterns 显式命中后由 reply 生成回复。
// 分类与回复共用同一份 patterns，单一事实来源，避免两处正则漂移。
type localReplyRule struct {
	patterns []*regexp.Regexp
	reply    func(normalized string) *AgentResponse
}

// conversationalRules 闲聊/社交白名单（正向锚定匹配）
var conversationalRules = []localReplyRule{
	{
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`^(你好|hi|hello|hey|嗨|哈喽|在吗|在不在)`),
		},
		reply: replyGreeting,
	},
	{
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`(谢谢|感谢|thanks|thx|多谢|辛苦了)`),
		},
		reply: func(string) *AgentResponse {
			return &AgentResponse{Content: "不客气！如果有其他问题，随时告诉我。", Confidence: 0.95}
		},
	},
	{
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`(再见|拜拜|bye|see you|晚安|早安)`),
		},
		reply: func(string) *AgentResponse {
			return &AgentResponse{Content: "再见！有需要随时找我。", Confidence: 0.95}
		},
	},
	{
		// 自指身份咨询（主语必须是"你"，不含产品/平台主语）
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`^(你是谁|你叫什么|自我介绍|你是人还是机器人|你能做什么|你会什么|能帮我干嘛)`),
		},
		reply: replyCapabilityIntro,
	},
	{
		// 整句能力/用法咨询（礼貌前缀可选，句末锚定）：
		// 只有"怎么用/有什么功能"这类裸问走本地；"arcorbit能做什么/这个功能怎么用"
		// 带产品或对象主语，必须放行 Agent，禁止用宽正则截胡换速度。
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`^(请问|请|我想问|想问)?(有什么功能|有什么用|介绍一下功能|怎么用|如何使用|能做什么|会什么|能干什么)[?？!！。.~～\s]*$`),
		},
		reply: replyCapabilityIntro,
	},
	{
		// 确认类：整句锚定，避免"嗯，这个bug怎么修"这类提问被截胡
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`^(好的|好吧|ok|okay|知道了|了解|明白|收到|嗯+|好的好的|没问题)[!！。.~～\s]*$`),
		},
		reply: func(string) *AgentResponse {
			return &AgentResponse{Content: "好的，如果还有其他问题，随时告诉我。", Confidence: 0.95}
		},
	},
}

// actionRules 操作类白名单：仅显式提交/反馈请求命中，未命中具体子类不设默认文案。
var actionRules = []localReplyRule{
	{
		patterns: []*regexp.Regexp{
			regexp.MustCompile(`(帮我|请|麻烦).*(提交|报|反馈|记录).*(bug|问题|缺陷|建议)`),
			regexp.MustCompile(`(提|报|反馈|提交).*(一个|个|这个)?(bug|问题|缺陷|建议)`),
			regexp.MustCompile(`(我想|我要)(提交|报|反馈|提|新建|创建|开个|提个)`),
			regexp.MustCompile(`(提交工单|创建工单|新建工单|提交issue|创建issue)`),
			regexp.MustCompile(`(如何|怎么|怎样).*(提交|报|反馈).*(bug|问题)`),
		},
		reply: func(normalized string) *AgentResponse {
			return respondAction(normalized)
		},
	},
}

// codeQueryPatterns 代码/技术问题正则（命中后无本地答案，放行 OpenHands）
var codeQueryPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(代码|源码|源代码|code|实现|逻辑|算法)`),
	regexp.MustCompile(`(函数|方法|类|接口|api|endpoint|路由|handler)`),
	regexp.MustCompile(`(架构|设计|模块|组件|服务|微服务|database|数据库)`),
	regexp.MustCompile(`(bug|缺陷|报错|错误|异常|error|exception|panic)`),
	regexp.MustCompile(`(性能|优化|慢|内存|泄漏|并发|线程|goroutine)`),
	regexp.MustCompile(`(部署|上线|发布|docker|k8s|kubernetes|ci/cd)`),
	regexp.MustCompile(`(测试|test|单测|集成测试|mock)`),
	regexp.MustCompile(`(安全|漏洞|权限|认证|鉴权|auth)`),
	regexp.MustCompile(`(鉴权|认证|token|jwt|session|cookie)`),
	regexp.MustCompile(`(配置|环境变量|env|config|设置)`),
	regexp.MustCompile(`(这个|那个|某).*(功能|特性|feature|module|接口|api)`),
}

// conversationalRulePatterns 收集闲聊白名单全部正则（分类与测试共用）。
func conversationalRulePatterns() []*regexp.Regexp {
	return collectRulePatterns(conversationalRules)
}

func actionRulePatterns() []*regexp.Regexp {
	return collectRulePatterns(actionRules)
}

func collectRulePatterns(rules []localReplyRule) []*regexp.Regexp {
	var out []*regexp.Regexp
	for _, r := range rules {
		out = append(out, r.patterns...)
	}
	return out
}

// classifyIntent 本地意图分类：仅正向白名单匹配。
// 未命中任何规则返回 IntentUnknown，由调用方放行 OpenHands/LLM。
func classifyIntent(query string) IntentType {
	normalized := strings.TrimSpace(strings.ToLower(query))
	if normalized == "" {
		return IntentUnknown
	}
	if matchesAny(normalized, conversationalRulePatterns()) {
		return IntentConversational
	}
	if matchesAny(normalized, actionRulePatterns()) {
		return IntentAction
	}
	if matchesAny(normalized, codeQueryPatterns) {
		return IntentCodeQuery
	}
	return IntentUnknown
}

// classifyAndRespond 本地分类并回复白名单消息。
// 返回 (nil, intent) 表示未命中本地白名单，需要走 OpenHands/LLM。
func classifyAndRespond(query string) (*AgentResponse, IntentType) {
	intent := classifyIntent(query)
	normalized := strings.TrimSpace(strings.ToLower(query))
	if normalized == "" {
		return nil, IntentUnknown
	}

	var resp *AgentResponse
	switch intent {
	case IntentConversational:
		resp = matchRuleReply(normalized, conversationalRules)
	case IntentAction:
		resp = matchRuleReply(normalized, actionRules)
	default:
		resp = nil
	}

	log.Printf("[agent-router] intent=%s local_reply=%v query=%q", intent, resp != nil, truncateStr(query, 80))
	return resp, intent
}

// matchRuleReply 按序匹配规则并生成回复；未命中返回 nil（放行 Agent）。
func matchRuleReply(normalized string, rules []localReplyRule) *AgentResponse {
	for _, rule := range rules {
		if matchesAny(normalized, rule.patterns) {
			return rule.reply(normalized)
		}
	}
	return nil
}

// replyCapabilityIntro 自指能力咨询的本地介绍（含姓名身份）。
func replyCapabilityIntro(string) *AgentResponse {
	return &AgentResponse{
		Content:    "我是" + arcOrbitAgentName + "，可以帮您解答产品使用问题、查看代码实现、排查技术故障等。请问有什么可以帮您？",
		Confidence: 0.95,
	}
}

// replyGreeting 按时间段问候
func replyGreeting(string) *AgentResponse {
	hour := time.Now().Hour()
	greeting := "你好"
	switch {
	case hour < 6:
		greeting = "夜深了，你好"
	case hour < 12:
		greeting = "早上好"
	case hour < 14:
		greeting = "中午好"
	case hour < 18:
		greeting = "下午好"
	default:
		greeting = "晚上好"
	}
	return &AgentResponse{
		Content:    fmt.Sprintf("%s！我是%s，有什么可以帮您的？", greeting, arcOrbitAgentName),
		Confidence: 0.95,
	}
}

// respondAction 操作类本地回复（仅具体子类有本地答案，否则返回 nil 放行）
func respondAction(normalized string) *AgentResponse {
	// Bug/问题提交类
	if matchesAny(normalized, []*regexp.Regexp{
		regexp.MustCompile(`(bug|缺陷|报错|错误|异常)`),
	}) {
			return &AgentResponse{
				Content: "收到，我是" + arcOrbitAgentName + "，已记录您的问题。为了更好地帮助您，请补充以下信息：\n\n" +
					"1. **问题描述**：具体出现了什么现象？\n" +
					"2. **复现步骤**：如何操作会触发这个问题？\n" +
					"3. **期望行为**：正常情况下应该是什么样的？\n\n" +
					"您可以直接回复补充信息，我会帮您整理记录。",
				Confidence: 0.88,
			}
	}

	// 建议类
	if matchesAny(normalized, []*regexp.Regexp{
		regexp.MustCompile(`(建议|改进|优化|新功能|需求)`),
	}) {
		return &AgentResponse{
			Content: "感谢您的建议！我已经记录下来了。请描述一下您期望的功能或改进方案，" +
				"我会帮您整理成需求卡片，方便团队评估。",
			Confidence: 0.88,
		}
	}

	// 无具体子类答案：放行 Agent，禁止默认文案截胡
	return nil
}

// matchesAny 检查文本是否匹配任一正则
func matchesAny(text string, patterns []*regexp.Regexp) bool {
	for _, p := range patterns {
		if p.MatchString(text) {
			return true
		}
	}
	return false
}
