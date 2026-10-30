// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { activeConsultation, clearConsultationDraft, migrateConsultationDraft, readConsultationDraft, saveConsultationDraft, setActiveConsultation } from './drafts'
beforeEach(installStorage)
describe('consultation draft isolation', () => {
  it('restores each customer and conversation separately without persisting credentials or signed links', () => {
    saveConsultationDraft('project-1/customer-a', 'one', { composer: { text: '原草稿', attachments: [{ type: 'image', object_key: 'owned/image', url: 'https://signed.invalid/secret', access_path: '/temporary' }] } })
    saveConsultationDraft('project-1/customer-a', 'two', { composer: { text: '第二段', attachments: [] } })
    expect(readConsultationDraft('project-1/customer-a', 'one')?.composer).toEqual({ text: '原草稿', attachments: [{ type: 'image', object_key: 'owned/image' }] })
    expect(readConsultationDraft('project-1/customer-b', 'one')).toBeUndefined()
    expect(readConsultationDraft('project-2/customer-a', 'one')).toBeUndefined()
    expect(readConsultationDraft('project-1/customer-a', 'two')?.composer?.text).toBe('第二段')
  })
  it('keeps customer edits while moving a new draft to its first persisted conversation', () => {
    saveConsultationDraft('scope', '', { structured: { position: '客户修正的位置', phenomenon: '失败', expect: '成功' }, question: '原问题' })
    saveConsultationDraft('scope', '', { composer: { text: '继续补充', attachments: [] } })
    migrateConsultationDraft('scope', '', 'created')
    expect(readConsultationDraft('scope', '')).toBeUndefined()
    expect(readConsultationDraft('scope', 'created')).toMatchObject({ structured: { position: '客户修正的位置' }, composer: { text: '继续补充' } })
    clearConsultationDraft('scope', 'created')
    expect(readConsultationDraft('scope', 'created')).toBeUndefined()
  })
  it('remembers an intentionally new consultation without selecting another remote history', () => {
    setActiveConsultation('scope', '')
    expect(activeConsultation('scope')).toBe('')
    expect(activeConsultation('other')).toBeUndefined()
  })
})

function installStorage() {
  const entries = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', { configurable: true, value: { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key), clear: () => entries.clear() } })
}
