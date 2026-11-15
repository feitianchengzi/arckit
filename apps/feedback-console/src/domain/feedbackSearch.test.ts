import { expect, it } from 'vitest'
import { feedbackDateBoundary, feedbackSearchOptions } from './feedbackSearch'
it('converts whole local days into half-open UTC bounds and rejects invalid dates', () => {
 expect(feedbackDateBoundary('2026-10-29')).toBe(new Date(2026,9,29).toISOString())
 expect(feedbackDateBoundary('2026-10-29',true)).toBe(new Date(2026,9,30).toISOString())
 expect(feedbackDateBoundary('2026-02-31')).toBeUndefined()
})
it('composes service filters without treating all as a status', () => {
 expect(feedbackSearchOptions('  对话中的错误  ','all','','','updated')).toEqual({q:'对话中的错误',status:undefined,dateFrom:undefined,dateTo:undefined,dateField:'updated'})
})
