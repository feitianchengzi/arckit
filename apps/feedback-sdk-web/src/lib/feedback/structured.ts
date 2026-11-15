import type { AgentStructuredSummary } from './v2'

export const clarificationFields = [
  ['position', '位置 / 功能模块'], ['phenomenon', '实际现象 / 需求描述'], ['expect', '期望结果'],
  ['reproduction_steps', '复现步骤 / 使用场景'], ['environment', '环境 / 版本'],
  ['impact', '影响范围与严重程度'], ['frequency', '发生频率'],
  ['request_type', '问题类型（故障 / 新需求 / 咨询）'], ['business_goal', '业务目标 / 为什么需要'],
  ['workaround', '现有替代办法'], ['target_users', '目标用户 / 使用角色'],
  ['current_workflow', '当前处理流程'], ['pain_points', '当前痛点'],
  ['expected_benefit', '预期收益 / 如何判断有效'], ['constraints', '约束与边界'],
] as const
export type ClarificationField = typeof clarificationFields[number][0]
export const requiredClarificationFields: ClarificationField[] = ['position', 'phenomenon', 'expect', 'reproduction_steps', 'environment', 'impact']
const featureCoreFields: ClarificationField[] = ['position', 'phenomenon', 'expect', 'target_users', 'reproduction_steps', 'business_goal', 'pain_points']
const featureContextFields: ClarificationField[] = ['current_workflow', 'impact', 'frequency', 'expected_benefit', 'workaround', 'constraints']
const placeholders = new Set(['', '未知', '未提供', '待确认', '待补充', '不详', 'unknown', 'N/A', 'null'])
export function isUnknownClarificationAnswer(value: string): boolean {
  return ['不知道', '不清楚', '无法确定', '不确定', '不了解', '无法复现', '无法重现', '不适用'].some((phrase) => value.includes(phrase))
}
export function isFeatureClarification(summary: AgentStructuredSummary): boolean { return summary.request_type === 'feature' }
export function coreClarificationFields(summary: AgentStructuredSummary): ClarificationField[] {
  return isFeatureClarification(summary) ? featureCoreFields : ['position', 'phenomenon', 'expect']
}
export function visibleClarificationFields(summary: AgentStructuredSummary) {
  const feature = isFeatureClarification(summary)
  const featureOnly = new Set(['target_users', 'current_workflow', 'pain_points', 'expected_benefit', 'constraints'])
  return clarificationFields.filter(([key]) => feature ? key !== 'environment' : !featureOnly.has(key)).map(([key, label]) => [key, key === 'reproduction_steps' && feature ? '使用场景 / 何时需要' : label] as const)
}
export function missingClarificationFields(summary: AgentStructuredSummary): ClarificationField[] {
  if (!['bug', 'feature', 'question', 'other'].includes(summary.request_type || '')) return ['request_type']
  const core = coreClarificationFields(summary)
  const required = isFeatureClarification(summary) ? [...featureCoreFields, ...featureContextFields] : requiredClarificationFields
  return required.filter((field) => {
    const value = summary[field]?.trim() || ''
    if (value && !placeholders.has(value) && !isUnknownClarificationAnswer(value)) return false
    return core.includes(field) || !summary.unknown_fields?.includes(field)
  })
}

/** Keep previous evidence when a later model response omits fields. Customer edits take precedence in the review form. */
export function mergeStructuredSummary(previous: AgentStructuredSummary | undefined, incoming: AgentStructuredSummary | undefined): AgentStructuredSummary {
  const merged: AgentStructuredSummary = { position: '', phenomenon: '', expect: '', ...previous }
  if (incoming) {
    merged.evidence = { ...previous?.evidence, ...incoming.evidence }
    for (const [key] of clarificationFields) if (incoming[key]?.trim()) merged[key] = incoming[key]!.trim()
    merged.unknown_fields = [...new Set([...(previous?.unknown_fields || []), ...(incoming.unknown_fields || [])])].filter((field) => {
      if (incoming.unknown_fields?.includes(field)) {
        merged[field as ClarificationField] = ''
        return true
      }
      const newValue = incoming[field as ClarificationField]?.trim() || ''
      return !newValue || placeholders.has(newValue) || isUnknownClarificationAnswer(newValue)
    })
  }
  return merged
}

export function formatStructuredFeedback(summary: AgentStructuredSummary | undefined, fallbackQuestion: string): string {
  const labels: Record<string, string> = { position: '位置', phenomenon: '现象', expect: '期望' }
  const lines = (summary ? visibleClarificationFields(summary) : clarificationFields).flatMap(([key, label]) => {
    const value = summary?.[key]?.trim()
    return value ? [`${labels[key] || label}：${value}`] : []
  })
  if (summary?.unknown_fields?.length) lines.push(`待确认：${summary.unknown_fields.map((key) => clarificationFields.find(([field]) => field === key)?.[1] || key).join('、')}`)
  return lines.length ? lines.join('\n') : fallbackQuestion.trim()
}
