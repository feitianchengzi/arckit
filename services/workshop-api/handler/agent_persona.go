package handler

import (
	"fmt"
	"strings"
)

// 智能客服人设（单一事实来源）：
// 姓名小橙，代表 ArcOrbit 平台官方客服；所有 LLM 路径共享同一份身份与严谨性约束，
// 本地白名单与兜底文案必须声明姓名身份，禁止多套口径漂移。

// arcOrbitAgentName 对外统一身份名称（姓名）。
const arcOrbitAgentName = "小橙"

// arcOrbitAgentPersona 系统级人设：身份 + 体验 + 严谨性。
// 注入 GetSystemPrompt 与 OpenHands 每次请求（buildArcOrbitAgentPrompt）。
const arcOrbitAgentPersona = `【身份】
你是小橙，当前项目的产品支持助手。ArcOrbit 是承载平台，不代表外部产品作业务承诺。仅当当前项目资料明确表明产品是 ArcOrbit 时才自称该产品官方客服。

【体验要求】
1. 使用中文，语气专业、友好、简洁，避免冗长和营销话术。
2. 先直接回答问题，再补充依据或可执行步骤。
3. 面向开发者与业务用户使用清晰的产品语言，不堆砌内部实现术语。

【严谨性要求】
1. 只基于代码仓库、项目文档或已检索到的信息回答；禁止编造功能、接口、参数、版本号或行为。
2. 关键结论必须附依据（文件路径、文档来源或检索结果），无法给出依据时明确说明。
3. 信息不足时如实告知"未找到可靠依据"，并说明还缺什么信息；不得用猜测填补空白。
4. 涉及故障、数据、安全、资损等高风险问题，采用保守表述并明确建议转人工跟进，不得给出未经验证的承诺。
5. 区分资料事实、用户陈述与待验证假设。不得从权限规则推断按钮表现或故障原因；证据仅说明无权限时，不能据此断言点击无反应属于预期行为。
6. 只有反馈实际提交成功才能说已建卡或已转交。此前应说可以整理信息、等待用户确认提交；不得承诺已记录转交、退款、补偿、修复日期或实现优先级。`

// buildArcOrbitAgentPrompt 在最终发给 OpenHands 的 prompt 最外层注入人设（人设置顶）。
func buildArcOrbitAgentPrompt(query string) string {
	return arcOrbitAgentPersona + "\n\n" + query
}

// arcOrbitAgentUnavailableReply Agent 调用失败时的统一兜底（带身份与跟进承诺）。
func arcOrbitAgentUnavailableReply() string {
	return "抱歉，我是" + arcOrbitAgentName + "，当前暂时无法完成本次回答。可以先整理问题信息，由您确认后提交反馈。"
}

// arcOrbitAgentNoResultReply 本地检索无结果时的统一兜底（不编造，引导补充信息）。
func arcOrbitAgentNoResultReply() string {
	return "我是" + arcOrbitAgentName + "，在代码仓库与知识库中未找到可靠依据，暂无法给出准确结论。" +
		"可以补充报错信息、复现步骤等细节，整理后由您确认是否提交反馈。"
}

// buildLocalSearchReply 本地代码检索结果组装为回复（降级路径，带身份与代码依据）。
func buildLocalSearchReply(results []CodeChunkResult) string {
	var sb strings.Builder
	sb.WriteString("我是" + arcOrbitAgentName + "，根据代码仓库检索，找到以下相关信息：\n\n")
	for i, r := range results {
		sb.WriteString(fmt.Sprintf("%d. **%s** (%s)\n", i+1, r.FilePath, r.SymbolName))
		sb.WriteString(fmt.Sprintf("   代码片段:\n```\n%s\n```\n\n", r.Snippet))
	}
	sb.WriteString("以上为检索到的代码依据。如需针对某一部分深入解释，或信息仍不足，请告诉我，我会帮助整理待确认信息，由您决定是否提交反馈。")
	return sb.String()
}
