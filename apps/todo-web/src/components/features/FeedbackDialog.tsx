import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { showGlobalToast } from '@/components/ui/Toast'
import { useCreateFeedback } from '@/hooks/useFeedbacks'

interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
  projectId: number
  projectName?: string
}

export function FeedbackDialog({ open, onClose, projectId, projectName }: FeedbackDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const createFeedback = useCreateFeedback()

  useEffect(() => {
    if (!open) {
      setError('')
    }
  }, [open])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setError('')
  }

  const handleClose = () => {
    if (createFeedback.isPending) return
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!Number.isFinite(projectId)) {
      setError('项目ID无效，无法提交反馈')
      return
    }
    if (!trimmedTitle) {
      setError('请输入反馈标题')
      return
    }
    if (!trimmedContent) {
      setError('请输入反馈内容')
      return
    }

    try {
      await createFeedback.mutateAsync({
        projectId,
        title: trimmedTitle,
        content: trimmedContent,
      })
      showGlobalToast('反馈已提交', 'success', 2000)
      resetForm()
      onClose()
    } catch (err: any) {
      console.error('提交反馈失败:', err)
      setError(err?.message || '提交反馈失败，请稍后重试')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="提交反馈"
      description={projectName ? `关联项目：${projectName}` : '反馈将关联当前项目'}
      maxWidth="md"
      panelClassName="flex flex-col"
      panelStyle={{ height: '80vh', maxHeight: '820px' }}
      bodyClassName="min-h-0 flex flex-1 flex-col p-0"
    >
      <form onSubmit={handleSubmit} id="create-feedback-form" className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <TextField
            label="反馈标题 *"
            placeholder="例如：筛选器交互不直观"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={createFeedback.isPending}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              反馈内容 <span className="text-error">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请描述具体问题、场景或建议..."
              rows={6}
              className={clsx(
                'w-full px-3 py-2 text-base',
                'border border-border rounded-md',
                'bg-surface-elevated text-foreground',
                'focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                'transition-colors',
                'placeholder:text-foreground-tertiary',
                'resize-none'
              )}
              required
              disabled={createFeedback.isPending}
            />
          </div>

          {error && (
            <div className="bg-error-light border border-error rounded-md p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-divider px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createFeedback.isPending}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="create-feedback-form"
            loading={createFeedback.isPending}
            disabled={createFeedback.isPending || !title.trim() || !content.trim()}
          >
            {createFeedback.isPending ? '提交中...' : '提交反馈'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
