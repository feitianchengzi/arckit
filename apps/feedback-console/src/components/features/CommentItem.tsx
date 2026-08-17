/**
 * CommentItem - 单个评论项组件
 * 格式约定：[] 仅类型。[name](username)→@提及，[link](url) / [link](url|显示名)→可点击链接。
 */

import { useState, useMemo } from 'react'
import { ImageGallery } from './ImageGallery'
import { decodeUrlForDisplay } from '@/lib/utils/urlDisplay'

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function normalizeHttpUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

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
      const name = parts[1]?.trim()
      const displayText = name || (url ? decodeUrlForDisplay(url) : '')
      if (url) {
        out += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="comment-link">${escapeHtml(displayText)}</a>`
      } else {
        out += escapeHtml(m[0])
      }
    } else if (/^https?:\/\//i.test(p)) {
      const rawLabel = typ || p
      const displayLabel = /^https?:\/\//i.test(rawLabel) ? decodeUrlForDisplay(rawLabel) : rawLabel
      out += `<a href="${escapeHtml(p)}" target="_blank" rel="noopener noreferrer" class="comment-link">${escapeHtml(displayLabel)}</a>`
    } else {
      out += escapeHtml(m[0])
    }
  }
  out += escapeHtml(text.slice(last))
  out = out.replace(
    /(^|>|\s)(https?:\/\/[^\s<>"]+)/g,
    (_, prefix: string, url: string) => `${prefix}<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="comment-link">${escapeHtml(decodeUrlForDisplay(url))}</a>`
  )
  return out.replace(/\n/g, '<br/>')
}

import { Avatar, ConfirmDialog, ImagePreview } from '@/components/ui'
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
import { CommentEditor } from './CommentEditor'
import type { TaskComment } from '@/lib/api/endpoints/comments'
import { uploadApi } from '@/lib/api/endpoints/upload'
import { getSignedUrl } from '@/lib/oss/upload/getSignedUrl'
import { formatRelativeTime } from '@/lib/utils/dateUtils'
import { OssResourceManager } from '@/lib/oss/OssResourceManager'
import { feedbackV2Client } from '@/lib/api/feedbackV2Client'

type ContentPart = 
  | { type: 'text', content: string }
  | { type: 'image', key: string }
  | { type: 'file', key: string }

function parseContentToParts(text: string): ContentPart[] {
  const parts: ContentPart[] = []
  const regex = /\[(image|file)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: match[1] as 'image' | 'file', key: match[2] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

function isFeedbackV2ObjectKey(objectKey: string) {
  return /(^|\/)feedbacks\/v2\//.test(objectKey)
}

async function resolveTaskAttachmentObjectUrl(taskAttachmentId: number, objectKey: string) {
  if (!isFeedbackV2ObjectKey(objectKey)) {
    return OssResourceManager.resolve(objectKey)
  }
  const credentials = await feedbackV2Client.getTaskAttachmentCredentials(taskAttachmentId, objectKey)
  return getSignedUrl(objectKey, credentials, 900)
}

function CommentFile({ taskAttachmentId, objectKey }: { taskAttachmentId: number; objectKey: string }) {
  const [loading, setLoading] = useState(false)
  const fileName = objectKey.split('/').pop() || '附件'
  
  const handleDownload = async () => {
    if (loading) return
    setLoading(true)
    try {
      const url = isFeedbackV2ObjectKey(objectKey)
        ? await resolveTaskAttachmentObjectUrl(taskAttachmentId, objectKey)
        : await getSignedUrl(objectKey, await uploadApi.getSTSToken(), 3600, true)
      window.open(url, '_blank')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-surface-active rounded-md my-1 inline-flex border border-border max-w-full">
      <svg className="w-5 h-5 text-foreground-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="text-blue-600 hover:text-blue-700 underline truncate text-left disabled:opacity-50"
      >
        {loading ? '生成链接中...' : fileName}
      </button>
    </div>
  )
}

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
  isDeleting?: boolean
}

export function CommentItem({
  comment,
  creatorInfo,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  isDeleting = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewImages, setPreviewImages] = useState<{ url: string; key: string }[]>([])

  const handleFileDownload = async (objectKey: string) => {
    setIsGeneratingUrl(true)
    try {
      const signedUrl = isFeedbackV2ObjectKey(objectKey)
        ? await resolveTaskAttachmentObjectUrl(comment.id, objectKey)
        : await getSignedUrl(objectKey, await uploadApi.getSTSToken(), 3600, true)
      window.open(signedUrl, '_blank')
    } catch (error) {
      console.error('生成文件下载链接失败:', error)
      alert('生成下载链接失败，请稍后重试')
    } finally {
      setIsGeneratingUrl(false)
    }
  }

  const handleImageClick = async (objectKey: string, allImageKeys: string[]) => {
    const imagePromises = allImageKeys.map(async (key) => {
      const url = await resolveTaskAttachmentObjectUrl(comment.id, key)
      return { url: url || '', key }
    })
    const images = await Promise.all(imagePromises)
    const currentIndex = allImageKeys.indexOf(objectKey)
    setPreviewImages(images)
    setPreviewIndex(currentIndex >= 0 ? currentIndex : 0)
    setPreviewOpen(true)
  }

  const handleEdit = async (data: { content: string; imageKeys: string[]; fileKeys: string[] }) => {
    setIsSaving(true)
    try {
      await onEdit(comment.id, data.content)
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

  const contentParts = useMemo(() => {
    if (comment.type === 'text') {
      const rawContent = comment.content
      try {
        const json = JSON.parse(rawContent)
        if (json && typeof json.text === 'string') {
          const parts: ContentPart[] = []
          if (Array.isArray(json.imageKeys)) {
            json.imageKeys.forEach((k: string) => parts.push({ type: 'image', key: k }))
          }
          if (Array.isArray(json.fileKeys)) {
            json.fileKeys.forEach((k: string) => parts.push({ type: 'file', key: k }))
          }
          if (json.text) {
            parts.push({ type: 'text', content: json.text })
          }
          return parts
        }
      } catch {}

      return parseContentToParts(rawContent)
    }
    return []
  }, [comment.content, comment.type])

  const imageKeys = useMemo(() => {
    return contentParts.filter(p => p.type === 'image').map(p => p.key)
  }, [contentParts])

  const fileKeys = useMemo(() => {
    return contentParts.filter(p => p.type === 'file').map(p => p.key)
  }, [contentParts])

  const urlContentHref = useMemo(
    () => (comment.type === 'url' ? normalizeHttpUrl(comment.content) : ''),
    [comment.content, comment.type]
  )

  const urlContentDisplay = useMemo(
    () => (urlContentHref ? decodeUrlForDisplay(urlContentHref) : comment.content),
    [comment.content, urlContentHref]
  )

  const [showFiles, setShowFiles] = useState(false)

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
                  href={urlContentHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline break-all"
                  onClick={(e) => {
                    // Ensure external links are always opened by the browser in a new tab.
                    if (urlContentHref && /^https?:\/\//i.test(urlContentHref)) {
                      e.preventDefault()
                      window.open(urlContentHref, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  {urlContentDisplay}
                </a>
              ) : (
                <div className="space-y-2">
                  {/* 图片画廊 */}
                  {imageKeys.length > 0 && (
                    <ImageGallery 
                      images={imageKeys.map(key => ({ key }))} 
                      onImageClick={(key) => handleImageClick(key, imageKeys)} 
                      resolveImage={(key) => resolveTaskAttachmentObjectUrl(comment.id, key)}
                    />
                  )}
                  
                  {/* 文本内容 */}
                  {contentParts.map((part, i) => {
                    if (part.type === 'image') return null // 图片已经在画廊中显示
                    if (part.type === 'file') return null // 附件已经在附件区域显示
                    if (!part.content.trim()) return null
                    return (
                      <div
                        key={i}
                        className="comment-body text-foreground [&_.comment-link]:text-blue-600 [&_.comment-link]:underline [&_.comment-link]:hover:text-blue-700 [&_.comment-link]:cursor-pointer"
                        dangerouslySetInnerHTML={{
                          __html: commentTextToSafeHtml(part.content),
                        }}
                        onClick={(e) => {
                          const a = (e.target as HTMLElement).closest('a.comment-link')
                          if (a && a.getAttribute('href') && /^https?:\/\//i.test(a.getAttribute('href') ?? '')) {
                            e.preventDefault()
                            window.open(a.getAttribute('href')!, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      />
                    )
                  })}
                  
                  {/* 附件显示 - 永远在最底部 */}
                  {fileKeys.length > 0 && (
                    <div className="mt-2">
                      {/* 附件标题和展开按钮 - 定位到右下侧 */}
                      <div 
                        className="flex items-center gap-1 p-1.5 bg-surface-active rounded-md cursor-pointer hover:bg-surface-hover transition-colors inline-block float-right"
                        onClick={() => setShowFiles(!showFiles)}
                      >
                        {/* 曲别针图标 */}
                        <svg className="w-4 h-4 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {fileKeys.length > 1 && (
                          <span className="text-xs text-foreground-secondary">{fileKeys.length}</span>
                        )}
                        <svg className={`w-3 h-3 text-foreground-secondary transition-transform ${showFiles ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      {/* 附件列表 - 从右往左展示 */}
                      {showFiles && (
                        <div className="clear-right mt-1 overflow-x-auto pb-2">
                          <div className="flex gap-2 min-w-max flex-row-reverse">
                            {fileKeys.map((key, index) => (
                              <div key={index} className="w-48 flex-shrink-0">
                                <CommentFile taskAttachmentId={comment.id} objectKey={key} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
      
      {/* 图片预览对话框 */}
      <ImagePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={previewImages}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
      />
    </div>
  )
}
