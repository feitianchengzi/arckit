// Customer-visible publication rules are independent of React and transport.
export type ConclusionKind = 'answer' | 'delivery' | 'not_planned'
export interface ConclusionDraft {
  kind: ConclusionKind
  title: string
  body: string
  artifactUrl?: string
  versionLabel?: string
}
export function publicationError(draft: ConclusionDraft): string {
  if (!draft.title.trim()) return '请填写结论标题'
  if (!draft.body.trim()) return '请填写客户可见的处理结论及依据'
  if (draft.body.trim().length > 20000) return '处理结论不能超过 20000 字符'
  if (draft.artifactUrl?.trim()) {
    try { const url = new URL(draft.artifactUrl.trim()); if (url.protocol !== 'https:' && url.protocol !== 'http:') return '交付链接必须是 HTTP 或 HTTPS 地址' }
    catch { return '请输入有效的交付链接' }
  }
  return ''
}
export function publicationRequest(draft: ConclusionDraft, expectedVersion: number) {
  return {
    kind: draft.kind,
    title: draft.title.trim(),
    body: draft.body.trim(),
    artifact_url: draft.artifactUrl?.trim() || undefined,
    version_label: draft.versionLabel?.trim() || undefined,
    expected_version: expectedVersion,
  }
}
