/**
 * CommentItem - 单个评论项组件
 */

import { useState } from 'react'
import { Avatar, ConfirmDialog } from '@/components/ui'
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
import ReactMarkdown from 'react-markdown'
import { CommentEditor } from './CommentEditor'
import type { TaskComment } from '@/lib/api/endpoints/comments'
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

  const handleEdit = async (content: string, type: 'text' | 'url' | 'file') => {
    setIsSaving(true)
    try {
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
              initialType={comment.type}
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
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }: { children?: React.ReactNode }) => <p className="text-foreground mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-bold text-foreground mb-2 mt-2 first:mt-0">{children}</h1>,
                      h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-bold text-foreground mb-1 mt-2 first:mt-0">{children}</h2>,
                      h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-bold text-foreground mb-1 mt-2 first:mt-0">{children}</h3>,
                      code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => 
                        inline ? (
                          <code className="bg-surface-active text-foreground px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                        ) : (
                          <code className="block bg-surface-active text-foreground p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</code>
                        ),
                      pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-surface-active text-foreground p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                      ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-foreground">{children}</ul>,
                      ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 text-foreground">{children}</ol>,
                      li: ({ children }: { children?: React.ReactNode }) => <li className="text-foreground">{children}</li>,
                      blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-2 border-border pl-2 italic text-foreground mb-2">{children}</blockquote>,
                      a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
                        // 检查是否是用户提及链接 [name](用户名)
                        // [name]是固定前缀，href中是用户名
                        // ReactMarkdown会将 [name](xxx) 解析为 children="name", href="xxx"
                        const childrenText = typeof children === 'string' ? children : 
                          (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string' ? children[0] : null)
                        
                        if (childrenText === 'name' && href) {
                          // 解码 URL 编码的用户名（ReactMarkdown 可能会对特殊字符进行编码）
                          let decodedUsername = href
                          try {
                            // 尝试解码，如果失败则使用原始值
                            decodedUsername = decodeURIComponent(href)
                          } catch (e) {
                            // 如果解码失败，使用原始值
                            decodedUsername = href
                          }
                          return (
                            <span className="text-blue-600">
                              @{decodedUsername}
                            </span>
                          )
                        }
                        // 普通链接：确保链接有协议，否则添加 https://
                        let finalHref = href || ''
                        if (finalHref && !finalHref.match(/^https?:\/\//i)) {
                          // 如果链接没有协议，添加 https://
                          finalHref = `https://${finalHref}`
                        }
                        return (
                          <a 
                            href={finalHref} 
                            className="text-blue-600 hover:text-blue-700 underline" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              // 确保外部链接在新窗口打开，不被路由拦截
                              if (finalHref && (finalHref.startsWith('http://') || finalHref.startsWith('https://'))) {
                                e.preventDefault()
                                window.open(finalHref, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            {children}
                          </a>
                        )
                      },
                      strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-foreground">{children}</strong>,
                      em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-foreground">{children}</em>,
                      hr: () => <hr className="border-border my-2" />,
                    }}
                  >
                    {comment.content}
                  </ReactMarkdown>
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
    </div>
  )
}
