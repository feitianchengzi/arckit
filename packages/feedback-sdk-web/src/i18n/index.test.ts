import { describe, it, expect, beforeEach } from 'vitest'
import { setLocale, getLocale, t, resetLocale } from '@/i18n'

describe('i18n 轻量国际化', () => {
  beforeEach(() => {
    resetLocale()
  })

  it('默认 locale 为 zh-CN', () => {
    expect(getLocale()).toBe('zh-CN')
  })

  it('切换到 en-US 后返回英文文案', () => {
    setLocale('en-US')
    expect(t('agent.title')).toBe('Smart Assistant')
  })

  it('zh-CN 返回中文文案', () => {
    setLocale('zh-CN')
    expect(t('agent.title')).toBe('智能助手')
  })

  it('缺失 key 回退到 key 本身（便于发现遗漏）', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('支持带参数的文案插值', () => {
    setLocale('zh-CN')
    expect(t('conversation.unread_count', { count: 3 })).toBe('3 条未读')
    setLocale('en-US')
    expect(t('conversation.unread_count', { count: 3 })).toBe('3 unread')
  })
})
