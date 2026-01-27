/**
 * CommentItem - 单个评论项组件
 * 格式约定：[] 仅类型。[name](username)→@提及，[link](url) / [link](url|显示名)→可点击链接。
 */

import { useState } from 'react'

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** 按约定转安全 HTML：[name](xxx)→@，[link](url) / [link](url|显示名)→<a>，裸 URL→<a>，换行→<br> */
function commentTextToSafeHtml(text: string): string {
  if (!text || typeof text !== 'string') return ''
  let out = ''
  let last = 0
  const re = /\[([^\]]*)\]\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const [, type, params] = m
    const before = text.slice(last, m.index)
    last = m.index + m[0].length
    out += escapeHtml(before)
    const p = (params || '').trim()
    const typ = (type || '').trim()
    if (typ === 'name') {
      try {
        out += `@${escapeHtml(decodeURIComponent(p))}`
      } catch {
        out += `@${escapeHtml(p)}`
      }
    } else if (typ === 'link') {
      const parts = p.split('|')
      const url = parts[0]?.trim() ?? ''
      const name = parts[1]?.trim() || url
      if (url) {
        out += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="comment-link">${escapeHtml(name)}</a>`
      } else {
        out += escapeHtml(m[0])
      }
    } else if (/^https?:\/\//i.test(p)) {
      out += `<a href="${escapeHtml(p)}" target="_blank" rel="noopener noreferrer" class="comment-link">${escapeHtml(typ || p)}</a>`
    } else {
      out += escapeHtml(m[0])
    }
  }
  out += escapeHtml(text.slice(last))
  out = out.replace(
    /(^|>|\s)(https?:\/\/[^\s<>"]+)/g,
    (_, prefix: string, url: string) => `${prefix}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="comment-link">${escapeHtml(url)}</a>`
  )
  return out.replace(/\n/g, '<br/>')
}

import { Avatar, ConfirmDialog } from '@/components/ui'
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
import { CommentEditor } from './CommentEditor'
import { buildTextCommentContent, parseTextCommentContent, type TaskComment } from '@/lib/api/endpoints/comments'
import { uploadApi } from '@/lib/api/endpoints/upload'
import { getSignedUrl } from '@/lib/oss/upload/getSignedUrl'
import { formatRelativeTime } from '@/lib/utils/dateUtils'
import clsx from 'clsx'

export interface CommentItemProps {
  comment: TaskComment
  creatorInfo?: {
    username: string
    avatar?: string | null
  }
  canEdit: boolean
  canDelete: boolean
  onEdit: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
  isEditing?: boolean
  isDeleting?: boolean
}

export function CommentItem({
  comment,
  creatorInfo,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isEditing: externalIsEditing,
  isDeleting = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false)

  const handleFileDownload = async (objectKey: string) => {
    setIsGeneratingUrl(true)
    try {
      // 获取STS凭证
      const credentials = await uploadApi.getSTSToken()
      // 生成签名URL
      const signedUrl = await getSignedUrl(objectKey, credentials)
      // 打开下载链接
      window.open(signedUrl, '_blank')
    } catch (error) {
      console.error('生成文件下载链接失败:', error)
      alert('生成下载链接失败，请稍后重试')
    } finally {
      setIsGeneratingUrl(false)
    }
  }

  const handleEdit = async (data: { content: string; imageKeys: string[]; fileKeys: string[] }) => {
    setIsSaving(true)
    try {
      const content = buildTextCommentContent({
        text: data.content,
        imageKeys: data.imageKeys,
        fileKeys: data.fileKeys,
      })
      await onEdit(comment.id, content)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(comment.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      // 错误处理由父组件处理
    }
  }

  const username = creatorInfo?.username || '未知用户'
  const avatar = creatorInfo?.avatar

  return (
    <div className="py-3 border-b border-divider last:border-b-0">
      <div className="flex items-start gap-3">
        {/* 评论者头像 */}
        <Avatar
          user={{
            username,
            avatar: avatar || undefined,
          }}
          size="sm"
        />
        
        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          {/* 评论者信息和操作 */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{username}</span>
              <span className="text-xs text-foreground-secondary">
                {formatRelativeTime(comment.created_at)}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-foreground-tertiary">（已编辑）</span>
              )}
            </div>
            
            {/* 操作按钮 */}
            {!isEditing && (canEdit || canDelete) && (
              <div className="flex items-center gap-1">
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                    aria-label="编辑评论"
                    title="编辑评论"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="删除评论"
                    title="删除评论"
                  >
                    {isDeleting ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* 评论内容 */}
          {isEditing ? (
            <CommentEditor
              initialContent={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              isLoading={isSaving}
            />
          ) : (
            <div 
              className="text-sm text-foreground"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              {comment.type === 'file' ? (
                <div className="flex items-center gap-2 p-2 bg-surface-active rounded-md">
                  <svg className="w-5 h-5 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <button
                    onClick={() => handleFileDownload(comment.content)}
                    disabled={isGeneratingUrl}
                    className="text-blue-600 hover:text-blue-700 underline flex-1 truncate text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingUrl ? '生成链接中...' : (comment.content.split('/').pop() || '下载文件')}
                  </button>
                </div>
              ) : comment.type === 'url' ? (
                <a
                  href={(() => {
                    let url = comment.content
                    if (url && !url.match(/^https?:\/\//i)) {
                      url = `https://${url}`
                    }
                    return url
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline break-all"
                  onClick={(e) => {
                    // 确保外部链接在新窗口打开，不被路由拦截
                    let url = comment.content
                    if (url && !url.match(/^https?:\/\//i)) {
                      url = `https://${url}`
                    }
                    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                      e.preventDefault()
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  {comment.content}
                </a>
              ) : (
                <div
                  className="comment-body text-foreground [&_.comment-link]:text-blue-600 [&_.comment-link]:underline [&_.comment-link]:hover:text-blue-700 [&_.comment-link]:cursor-pointer"
                  dangerouslySetInnerHTML={{
                    __html: commentTextToSafeHtml(parseTextCommentContent(comment.content)),
                  }}
                  onClick={(e) => {
                    const a = (e.target as HTMLElement).closest('a.comment-link')
                    if (a && a.getAttribute('href') && /^https?:\/\//i.test(a.getAttribute('href') ?? '')) {
                      e.preventDefault()
                      window.open(a.getAttribute('href')!, '_blank', 'noopener,noreferrer')
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除评论"
        message="确定要删除这条评论吗？此操作不可撤销。"
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
