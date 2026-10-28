import { describe, it, expect } from 'vitest'
import { formatStructuredFeedback, mergeStructuredSummary, missingClarificationFields } from '@/lib/feedback/structured'

describe('mergeStructuredSummary', () => {
  it('explicit unknown replaces a previous guess and survives later omitted fields', () => {
    const previous = { position: '订单', phenomenon: '无响应', expect: '下载', environment: 'Chrome 129' }
    const unknown = mergeStructuredSummary(previous, { position: '', phenomenon: '', expect: '', unknown_fields: ['environment'], evidence: { environment: '浏览器版本我不知道' } })
    expect(unknown.environment).toBe('')
    expect(unknown.unknown_fields).toContain('environment')
    expect(missingClarificationFields(unknown)).not.toContain('environment')
    expect(mergeStructuredSummary(unknown, { position: '', phenomenon: '', expect: '' }).unknown_fields).toContain('environment')
    const corrected = mergeStructuredSummary(unknown, { position: '', phenomenon: '', expect: '', environment: 'Chrome 130' })
    expect(corrected.unknown_fields).not.toContain('environment')
  })
})

describe('formatStructuredFeedback', () => {
  it('三字段齐全时拼成位置/现象/期望多行文本', () => {
    expect(
      formatStructuredFeedback(
        { position: '导出页', phenomenon: 'CSV 中文乱码', expect: 'Excel 正常显示中文' },
        '导出乱码',
      ),
    ).toBe('位置：导出页\n现象：CSV 中文乱码\n期望：Excel 正常显示中文')
  })

  it('空字段跳过，不留空占位', () => {
    expect(
      formatStructuredFeedback({ position: '', phenomenon: '点击导出无反应', expect: '  ' }, '导出无反应'),
    ).toBe('现象：点击导出无反应')
  })

  it('字段值裁剪空白', () => {
    expect(
      formatStructuredFeedback({ position: '  登录页  ', phenomenon: '点击无响应', expect: '正常登录' }, 'x'),
    ).toBe('位置：登录页\n现象：点击无响应\n期望：正常登录')
  })

  it('模型未给出总结时退回提问原文', () => {
    expect(formatStructuredFeedback(undefined, '  支付回调收不到  ')).toBe('支付回调收不到')
  })

  it('三字段全空视为无效总结，退回提问原文', () => {
    expect(
      formatStructuredFeedback({ position: ' ', phenomenon: '', expect: '' }, '支付回调收不到'),
    ).toBe('支付回调收不到')
  })

  it('原文也为空时返回空串，交由调用方拦截', () => {
    expect(formatStructuredFeedback(undefined, '   ')).toBe('')
    expect(formatStructuredFeedback({ position: '', phenomenon: '', expect: '' }, '  ')).toBe('')
  })
})


const feature = {
  position: '订单列表', phenomenon: '需要批量修改订单负责人', expect: '筛选后一次修改负责人', request_type: 'feature',
  target_users: '运营主管', reproduction_steps: '每周交接班时处理待跟进订单', business_goal: '减少分派耗时', pain_points: '逐条修改容易遗漏',
  current_workflow: '逐条打开订单修改', impact: '影响三个运营小组', frequency: '每周两次', expected_benefit: '交接从一小时缩短到十分钟', workaround: '目前人工逐条修改', constraints: '保留操作审计且仅主管可用',
}
describe('feature-specific clarification', () => {
  it('requires product context rather than bug environment and reproduction detail', () => {
    expect(missingClarificationFields(feature)).toEqual([])
    expect(missingClarificationFields({ position: '订单', phenomenon: '需要新功能', expect: '提高效率', request_type: 'feature' })).toEqual(expect.arrayContaining(['target_users', 'business_goal', 'pain_points', 'reproduction_steps', 'constraints']))
    expect(missingClarificationFields(feature)).not.toContain('environment')
  })
  it('allows explicit unknown context but never accepts unknown audience or business goal', () => {
    expect(missingClarificationFields({ ...feature, constraints: '不清楚', unknown_fields: ['constraints'] })).toEqual([])
    expect(missingClarificationFields({ ...feature, target_users: '不知道', business_goal: '', unknown_fields: ['target_users', 'business_goal'] })).toEqual(expect.arrayContaining(['target_users', 'business_goal']))
  })
  it('revalidates immediately when switching between feature and bug', () => {
    expect(missingClarificationFields({ ...feature, request_type: 'bug' })).toEqual(['environment'])
    expect(missingClarificationFields({ ...feature, request_type: '' })).toEqual(['request_type'])
  })
  it('preserves explicit unknown text markers until corrected with concrete information', () => {
    const draft = { ...feature, constraints: '', unknown_fields: ['constraints'] }
    const omitted = mergeStructuredSummary(draft, { position: '', phenomenon: '', expect: '', constraints: '不知道' })
    expect(omitted.unknown_fields).toContain('constraints')
    expect(mergeStructuredSummary(omitted, { position: '', phenomenon: '', expect: '', constraints: '仅管理员可使用' }).unknown_fields).not.toContain('constraints')
  })
  it('serializes the feature facts and marks unresolved context for later judgment', () => {
    const text = formatStructuredFeedback({ ...feature, constraints: '', unknown_fields: ['constraints'] }, '')
    expect(text).toContain('目标用户 / 使用角色：运营主管')
    expect(text).toContain('使用场景 / 何时需要：每周交接班时处理待跟进订单')
    expect(text).toContain('待确认：约束与边界')
    expect(text).not.toContain('环境 / 版本：')
  })
})
