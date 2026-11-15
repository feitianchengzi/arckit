import type { AgentStructuredSummary, FeedbackV2Attachment } from './v2'

export interface ComposerDraft { text: string; attachments: FeedbackV2Attachment[]; pendingFiles?: boolean }
export interface ConsultationDraft { composer?: ComposerDraft; structured?: AgentStructuredSummary; question?: string; answered?: boolean }
const prefix = 'feedback-consultation-draft-v1:'
const maxAge = 30 * 24 * 60 * 60 * 1000
function key(scope: string, conversation: string) { return prefix + encodeURIComponent(scope) + ':' + encodeURIComponent(conversation || 'new') }
export function readConsultationDraft(scope: string, conversation: string): ConsultationDraft | undefined {
  if (!scope) return
  try {
    const raw = window.localStorage.getItem(key(scope, conversation))
    if (!raw) return
    const value = JSON.parse(raw)
    if (!value || typeof value.savedAt !== 'number' || Date.now() - value.savedAt > maxAge) { window.localStorage.removeItem(key(scope, conversation)); return }
    if (!value.draft || typeof value.draft !== 'object') return
    const draft = value.draft as ConsultationDraft
    if (draft.composer && (typeof draft.composer.text !== 'string' || !Array.isArray(draft.composer.attachments))) return
    if (draft.composer) draft.composer.attachments = draft.composer.attachments.filter(a => a && typeof a.object_key === 'string' && ['image', 'file'].includes(a.type))
    if (draft.structured && (typeof draft.structured.phenomenon !== 'string' || typeof draft.structured.expect !== 'string')) delete draft.structured
    return draft
  } catch { return }
}
export function saveConsultationDraft(scope: string, conversation: string, patch: Partial<ConsultationDraft>): boolean {
  if (!scope) return true
  try {
    const previous = readConsultationDraft(scope, conversation) || {}
    // Object keys remain durable; expiring signed URLs and blob URLs must never be persisted.
    const draft = { ...previous, ...patch }
    if (draft.composer) draft.composer = { ...draft.composer, attachments: draft.composer.attachments.filter(a => Boolean(a.object_key)).map(({ url: _url, access_path: _access, ...a }) => a) }
    window.localStorage.setItem(key(scope, conversation), JSON.stringify({ savedAt: Date.now(), draft }))
    return true
  } catch { return false }
}
export function clearConsultationDraft(scope: string, conversation: string) {
  if (!scope) return
  try { window.localStorage.removeItem(key(scope, conversation)) } catch { /* Storage may be disabled by host policy. */ }
}
export function migrateConsultationDraft(scope: string, from: string, to: string) {
  const draft = readConsultationDraft(scope, from)
  if (draft && saveConsultationDraft(scope, to, draft)) clearConsultationDraft(scope, from)
}
export function activeConsultation(scope: string): string | undefined {
  if (!scope) return
  try { return window.localStorage.getItem(prefix + encodeURIComponent(scope) + ':active') ?? undefined } catch { return }
}
export function setActiveConsultation(scope: string, conversation: string) {
  if (!scope) return
  try { window.localStorage.setItem(prefix + encodeURIComponent(scope) + ':active', conversation) } catch { /* Draft save reports failures separately. */ }
}
