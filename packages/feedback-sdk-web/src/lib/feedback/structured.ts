import type { AgentStructuredSummary } from './v2'

/**
 * 把智能客服的问题总结渲染成可直接提交的反馈正文。
 *
 * 规则：
 * 「位置 / 现象 / 期望」拼成多行文本，空字段跳过，不给客户留空占位。
 * 三字段全空（模型未给出有效总结）时退回提问原文，保证反馈正文永远非空。
 */
export function formatStructuredFeedback(
  summary: AgentStructuredSummary | undefined,
  fallbackQuestion: string,
): string {
  const position = summary?.position?.trim() || ''
  const phenomenon = summary?.phenomenon?.trim() || ''
  const expect = summary?.expect?.trim() || ''

  const lines: string[] = []
  if (position) lines.push(`位置：${position}`)
  if (phenomenon) lines.push(`现象：${phenomenon}`)
  if (expect) lines.push(`期望：${expect}`)

  if (lines.length > 0) return lines.join('\n')
  return fallbackQuestion.trim()
}
