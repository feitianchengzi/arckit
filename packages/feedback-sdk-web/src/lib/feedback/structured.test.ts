import { describe, it, expect } from 'vitest'
import { formatStructuredFeedback } from '@/lib/feedback/structured'

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
