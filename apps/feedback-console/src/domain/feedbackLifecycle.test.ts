import { describe, expect, it } from 'vitest'
import { publicationError, publicationRequest } from './feedbackLifecycle'
describe('customer-visible conclusion publication', () => {
 it('rejects empty conclusions and unsafe artifact links', () => {
  expect(publicationError({ kind:'delivery', title:'处理结果',body:'  ', artifactUrl:'' })).toBeTruthy()
  expect(publicationError({ kind:'delivery', title:'处理结果',body:'修复完成', artifactUrl:'javascript:alert(1)' })).toBeTruthy()
  expect(publicationError({ kind:'not_planned', title:'处理结果',body:'暂不采纳，原因及替代方案', artifactUrl:'' })).toBe('')
 })
 it('publishes a new version with optimistic concurrency and explicit customer-visible content', () => {
  expect(publicationRequest({kind:'delivery',title:'处理结果',body:' 已交付 ',artifactUrl:'https://example.com/release', versionLabel:' 2.8 '},3)).toEqual({kind:'delivery',title:'处理结果',body:'已交付',artifact_url:'https://example.com/release',version_label:'2.8',expected_version:3})
 })
})
