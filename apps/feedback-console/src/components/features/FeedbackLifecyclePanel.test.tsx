import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
const { getDetail, publishConclusion } = vi.hoisted(() => ({ getDetail:vi.fn(), publishConclusion:vi.fn() }))
vi.mock('@/lib/api/feedbackV2Client', () => ({feedbackV2Client:{getDetail,publishConclusion}}))
import { FeedbackLifecyclePanel } from './FeedbackLifecyclePanel'
const detail={feedback:{id:42},events:[{id:'1',type:'submitted',title:'客户确认并提交',created_at:'2026-10-28T10:00:00Z'}],conclusions:[{id:7,version:1,kind:'delivery',title:'处理结果',body:'旧版交付',created_at:'2026-10-28T11:00:00Z'}],responses:[{id:9,conclusion_id:7,response:'needs_review',content:'仍然失败',created_at:'2026-10-28T12:00:00Z'}]}
beforeEach(()=>{ getDetail.mockReset();publishConclusion.mockReset();getDetail.mockResolvedValue(detail) })
it('shows public flow, conclusion versions and customer review request', async()=>{
 render(<FeedbackLifecyclePanel feedbackId={42} />)
 expect(await screen.findByText('客户确认并提交')).toBeInTheDocument()
 expect(screen.getByText('旧版交付')).toBeInTheDocument()
 expect(screen.getByText('仍然失败')).toBeInTheDocument()
})
it('requires explicit publication confirmation and sends expected version',async()=>{
 publishConclusion.mockResolvedValue({id:8,version:2})
 render(<FeedbackLifecyclePanel feedbackId={42} />)
 await screen.findByText('旧版交付')
 fireEvent.change(screen.getByLabelText('结论标题'),{target:{value:'处理结果'}})
 fireEvent.change(screen.getByLabelText('客户可见结论'),{target:{value:'已修复并交付'}})
 expect(screen.getByRole('button',{name:'发布新版本结论'})).toBeDisabled()
 fireEvent.click(screen.getByLabelText('确认将该结论发布给客户'))
 fireEvent.click(screen.getByRole('button',{name:'发布新版本结论'}))
 await waitFor(()=>expect(publishConclusion).toHaveBeenCalledWith(42,expect.objectContaining({title:'处理结果',body:'已修复并交付',expected_version:1})))
})
