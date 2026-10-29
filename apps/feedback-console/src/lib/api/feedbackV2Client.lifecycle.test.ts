import { beforeEach, describe, expect, it, vi } from 'vitest'
const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('./client', () => ({ apiClient: { get, post } }))
vi.mock('./interceptors/response', () => ({ handleResponse: (r: {data:{data:unknown}}) => r.data.data }))
import { feedbackV2Client } from './feedbackV2Client'
beforeEach(() => { get.mockReset(); post.mockReset() })
describe('feedback lifecycle API', () => {
 it('reads all unified conversation pages rather than truncating original consultation', async () => {
  get.mockResolvedValueOnce({data:{data:[{id:1,source:'agent'}],meta:{total:2}}}).mockResolvedValueOnce({data:{data:[{id:2,source:'feedback'}],meta:{total:2}}})
  const result=await feedbackV2Client.getConversationMessages(42)
  expect(result).toHaveLength(2)
  expect(get.mock.calls[0][0]).toMatch(/\/user\/feedbacks\/42\/conversation-messages$/)
  expect(get.mock.calls[1][1].params.page).toBe(2)
 })
 it('preserves the actual lifecycle wire shape including separate customer responses', async () => {
  const dto={feedback:{id:42},events:[{id:'submitted:42',type:'submitted',title:'已收到反馈',created_at:'2026-10-29T00:00:00Z'}],conclusions:[{id:7,feedback_id:42,project_id:1,version:2,kind:'delivery',title:'修复已交付',body:'请重新验证',version_label:'2.8',published_by:1,created_at:'2026-10-29T01:00:00Z'}],responses:[{id:8,feedback_id:42,conclusion_id:7,response:'needs_review',content:'问题仍存在',client_message_id:'c-8',created_at:'2026-10-29T02:00:00Z'}]}
  get.mockResolvedValue({data:{data:dto}})
  expect(await feedbackV2Client.getDetail(42)).toEqual(dto)
  expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/user\/feedbacks\/42\/detail$/))
 })
 it('sends conversation search and half-open date bounds to the server with pagination', async () => {
  get.mockResolvedValue({data:{data:[],meta:{page:2,page_size:24,total:30}}})
  const result=await feedbackV2Client.listByProject(1,{page:2,pageSize:24,q:'仍然失败',status:'pending',dateFrom:'2026-10-28T16:00:00Z',dateTo:'2026-10-29T16:00:00Z',dateField:'updated'})
  expect(get.mock.calls[0][1].params).toEqual({project_id:1,page:2,page_size:24,q:'仍然失败',status:'pending',date_from:'2026-10-28T16:00:00Z',date_to:'2026-10-29T16:00:00Z',date_field:'updated'})
  expect(result.total).toBe(30)
 })
 it('publishes versioned conclusions through the member endpoint', async () => {
  post.mockResolvedValue({data:{data:{id:7,version:2}}})
  await feedbackV2Client.publishConclusion(42,{kind:'delivery',title:'处理结果',body:'已修复',expected_version:1})
  expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/user\/feedbacks\/42\/conclusions$/),{kind:'delivery',title:'处理结果',body:'已修复',expected_version:1})
 })
})
