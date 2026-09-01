/**
 * CommentEditor - 评论编辑器组件（Tiptap）
 * 单输入框 + @ 提及（Mention）+ 链接（Link，含识别与插入）+ 图片区 + 附件区
 * 插入能力：插入图片、插入文件、插入链接。@ 存为 [name](xxx)，链接存为 [link](url) 或 [link](url|显示名)，显示名可选。
 */

import { useState, useRef, useEffect, useMemo, type ClipboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import Link from '@tiptap/extension-link'
import type { SuggestionProps } from '@tiptap/suggestion'
import { Button, Avatar } from '@/components/ui'
import { ImageIcon, PaperClipIcon, LinkIcon } from '@/components/ui/icons'
import { uploadApi } from '@/lib/api/endpoints/upload'
import { parseTextCommentContentPayload, rawUrlsToLinkFormat } from '@/lib/api/endpoints/comments'
import { OssResourceManager, OssUploadPurpose } from '@/lib/oss/OssResourceManager'
import { normalizeObjectKey } from '@/lib/oss/sdk'
import { UPLOAD_LIMITS } from '@/lib/constants/uploadLimits'
import { compressImageDataUrl, dataURLtoFile, readFileAsDataUrl } from '@/lib/utils/imageCompress'
import { formatFileSize } from '@/lib/utils/validators'
import clsx from 'clsx'

/** 提交内容：正文 HTML + 图片 key 列表 + 附件 key 列表 */
export interface CommentSubmitData {
  content: string
  imageKeys: string[]
  fileKeys: string[]
}

export interface CommentEditorProps {
  initialContent?: string
  onSubmit: (data: CommentSubmitData) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  members?: any[]
  projectId?: string
}

/** 解析 initialContent：与接口 content 格式一致，支持 JSON { text, imageKeys, fileKeys } 或纯文本 */
function parseInitialContent(raw: string): { text: string; imageKeys: string[]; fileKeys: string[] } {
  const p = parseTextCommentContentPayload(raw ?? '')
  return p ?? { text: raw ?? '', imageKeys: [], fileKeys: [] }
}

/** 把正文转为 Tiptap HTML：[] 仅类型。[name](id)→提及，[link](url) / [link](url|显示名)→<a> */
function mentionTextToHtml(text: string): string {
  if (!text || !text.trim()) return '<p></p>'
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const lineToHtml = (line: string) => {
    let out = line
    out = out.replace(/\[name\]\(([^)]*)\)/g, (_, id) => {
      const e = escapeHtml(String(id).trim())
      return `<span data-type="mention" data-id="${e}" data-label="${e}">@${e}</span>`
    })
    out = out.replace(/\[link\]\(([^)]*)\)/g, (_, params) => {
      const parts = String(params).trim().split('|')
      const u = escapeHtml(parts[0]?.trim() || '')
      const t = escapeHtml(parts[1]?.trim() || u)
      return `<a href="${u}">${t}</a>`
    })
    out = out.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, txt, url) => {
      const u = escapeHtml(String(url).trim())
      if (!/^https?:\/\//i.test(u)) return escapeHtml(`[${txt}](${url})`)
      const t = escapeHtml(String(txt).trim() || url)
      return `<a href="${u}">${t}</a>`
    })
    return escapeHtml(out)
  }
  const lines = text.replace(/\r\n/g, '\n').split(/\n/)
  return lines.map((line) => `<p>${lineToHtml(line)}</p>`).join('') || '<p></p>'
}

/** 把 Tiptap 的 HTML 转回正文（[name](xxx) @提及 + [link](url) / [link](url|显示名) 链接），供存盘 */
function htmlToMentionText(html: string): string {
  let s = html || ''
  s = s.replace(/<span[^>]*data-type="mention"[^>]*data-id="([^"]*)"[^>]*>@?[^<]*<\/span>/gi, (_, id) => `[name](${id})`)
  s = s.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, inner: string) => {
    const name = inner.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()
    const u = (href || '').trim()
    if (name && name !== u) return `[link](${u}|${name})`
    return `[link](${u})`
  })
  s = s.replace(/<p[^>]*>/gi, '\n')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<[^>]+>/g, '')
  s = s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  return s.replace(/\n+/g, '\n').trim()
}

const STORAGE_KEY_PREFIX = 'comment_mentions_'
function getRecentMentions(projectId: string | undefined): number[] {
  if (!projectId) return []
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}
function saveRecentMention(projectId: string | undefined, userId: number) {
  if (!projectId) return
  try {
    const prev = getRecentMentions(projectId).filter((id) => id !== userId)
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify([userId, ...prev].slice(0, 10)))
  } catch {}
}

function getUsername(m: any): string {
  return m?.username ?? m?.user?.username ?? ''
}

const IMAGE_CELL_SIZE = 64

export function CommentEditor({
  initialContent = '',
  onSubmit,
  onCancel,
  placeholder = '添加评论...',
  submitLabel = '提交',
  cancelLabel = '取消',
  isLoading = false,
  members = [],
  projectId,
}: CommentEditorProps) {
  const parsed = parseInitialContent(initialContent)

  const [hasText, setHasText] = useState(!!parsed.text.trim())
  const [images, setImages] = useState<{ key: string; url: string }[]>([])
  const [files, setFiles] = useState<{ key: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [suggestionProps, setSuggestionProps] = useState<SuggestionProps | null>(null)
  const [suggestionSelectedIndex, setSuggestionSelectedIndex] = useState(0)
  const suggestionPropsRef = useRef<SuggestionProps | null>(null)
  const selectedIndexRef = useRef(0)
  const setSuggestionRef = useRef<(p: SuggestionProps | null) => void>(() => {})
  const setSelectedIndexRef = useRef<(i: number) => void>(() => {})
  const [suggestionRect, setSuggestionRect] = useState<{ top: number; left: number } | null>(null)
  const [linkPopupOpen, setLinkPopupOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  setSuggestionRef.current = (p) => {
    suggestionPropsRef.current = p
    setSuggestionProps(p)
    if (p) {
      try {
        const coords = p.editor.view.coordsAtPos(p.range.from)
        setSuggestionRect({ top: coords.bottom + 4, left: coords.left })
      } catch {
        setSuggestionRect({ top: 0, left: 0 })
      }
      setSuggestionSelectedIndex(0)
    } else {
      setSuggestionRect(null)
    }
  }
  setSelectedIndexRef.current = (i) => {
    selectedIndexRef.current = i
    setSuggestionSelectedIndex(i)
  }
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedMembers = useMemo(() => {
    const list = Array.isArray(members) ? members : []
    if (!projectId || list.length === 0) return list
    const recent = getRecentMentions(projectId)
    const map = new Map(list.map((m: any) => [m.user_id, m]))
    const recentList = recent.map((id) => map.get(id)).filter(Boolean)
    const rest = list.filter((m: any) => !recent.includes(m.user_id))
    return [...recentList, ...rest]
  }, [members, projectId])

  const mentionExt = useMemo(
    () =>
      Mention.configure({
        HTMLAttributes: { class: 'mention-tag' },
        suggestion: {
          char: '@',
          items: ({ query }: { query: string; editor: Editor }) => {
            const q = query.toLowerCase().trim()
            const filtered = q
              ? sortedMembers.filter((m: any) => getUsername(m).toLowerCase().includes(q))
              : sortedMembers
            return filtered.slice(0, 20).map((m: any) => ({
              id: getUsername(m),
              label: getUsername(m),
              userId: m.user_id,
              avatar: m.avatar ?? m.user?.avatar,
            }))
          },
          command: ({ editor: ed, range, props }: { editor: Editor; range: { from: number; to: number }; props: { id: string | null; label?: string | null; userId?: number } }) => {
            if (props.userId != null && projectId) saveRecentMention(projectId, props.userId)
            ed.chain().focus().insertContentAt(range, [
              { type: 'mention', attrs: { id: props.id || '', label: props.label || props.id || '', mentionSuggestionChar: '@' } },
              { type: 'text', text: ' ' },
            ]).run()
          },
          render: () => ({
            onStart: (p) => {
              selectedIndexRef.current = 0
              setSuggestionRef.current(p)
            },
            onUpdate: (p) => {
              selectedIndexRef.current = 0
              setSuggestionRef.current(p)
            },
            onExit: () => setSuggestionRef.current(null),
            onKeyDown: ({ event }) => {
              const p = suggestionPropsRef.current
              if (!p?.items?.length) return false
              const n = p.items.length
              if (event.key === 'ArrowDown') {
                const next = (selectedIndexRef.current + 1) % n
                selectedIndexRef.current = next
                setSelectedIndexRef.current(next)
                return true
              }
              if (event.key === 'ArrowUp') {
                const next = (selectedIndexRef.current - 1 + n) % n
                selectedIndexRef.current = next
                setSelectedIndexRef.current(next)
                return true
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                p.command(p.items[selectedIndexRef.current])
                return true
              }
              if (event.key === 'Escape') {
                setSuggestionRef.current(null)
                return true
              }
              return false
            },
          }),
        },
      }),
    [sortedMembers, projectId]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Placeholder.configure({ placeholder }),
      mentionExt,
      Link.configure({ openOnClick: false }),
    ],
    onUpdate: ({ editor }) => {
      setHasText(!!editor.getText().trim())
    },
    content: mentionTextToHtml(parsed.text) || '<p></p>',
    editorProps: {
      attributes: {
        class: 'min-h-[80px] max-h-[200px] overflow-y-auto px-3 py-2 text-sm text-foreground outline-none',
        style: 'line-height: 1.5rem; word-break: break-word;',
      },
    },
  })

  // 编辑态：用 initialContent 解析结果填充图片/附件，并解析出的 text 已通过 content 传给 useEditor
  useEffect(() => {
    if (!initialContent || !parsed.imageKeys?.length) return
    let cancelled = false
    const load = async () => {
      const next: { key: string; url: string }[] = []
      for (const rawKey of parsed.imageKeys) {
        const key = normalizeObjectKey(rawKey)
        const url = await OssResourceManager.resolve(key)
        if (cancelled) return
        next.push({ key, url: url || '' })
      }
      setImages(next)
    }
    load()
    return () => { cancelled = true }
  }, []) // 仅挂载时用 initial 的 imageKeys 拉一次 url；后续编辑由本地 state 驱动

  useEffect(() => {
    if (parsed.fileKeys?.length) {
      setFiles(parsed.fileKeys.map((rawKey) => {
        const key = normalizeObjectKey(rawKey)
        return { key, name: key.split('/').pop() || '附件' }
      }))
    }
  }, [])

  const uploadImage = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file)
    const compressed = await compressImageDataUrl(dataUrl, {
      maxSizeBytes: UPLOAD_LIMITS.image.maxBytes,
      maxDimension: UPLOAD_LIMITS.image.maxDimension,
      initialQuality: UPLOAD_LIMITS.image.initialQuality,
      minQuality: UPLOAD_LIMITS.image.minQuality,
      qualityStep: UPLOAD_LIMITS.image.qualityStep,
    })

    if (compressed.sizeBytes > UPLOAD_LIMITS.image.maxBytes) {
      throw new Error(`图片过大，压缩后仍超过 ${formatFileSize(UPLOAD_LIMITS.image.maxBytes)}`)
    }

    const compressedFile = dataURLtoFile(compressed.dataUrl, 'comment-image.jpg')
    const credentials = await uploadApi.getSTSToken()
    const { key, url } = await OssResourceManager.upload(compressedFile, {
      purpose: OssUploadPurpose.COMMENT_IMAGE,
      credentials,
    })
    const previewUrl = url || (await OssResourceManager.resolve(key))

    return { key, url: previewUrl }
  }

  const uploadImages = async (imageFiles: File[]) => {
    if (imageFiles.length === 0) return
    setIsUploading(true)
    setError('')
    try {
      const uploaded = await Promise.all(imageFiles.map((file) => uploadImage(file)))
      setImages((prev) => [...prev, ...uploaded])
    } catch (err: any) {
      setError(err?.message || '图片上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageFiles = Array.from(e.target.files ?? []).filter((file) => file.type.startsWith('image/'))
    e.target.value = ''
    await uploadImages(imageFiles)
  }

  const handleEditorPaste = async (event: ClipboardEvent<HTMLDivElement>) => {
    const imageFiles = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => !!file)

    if (imageFiles.length === 0) return

    // 截图/图片粘贴时直接走上传流程，避免把二进制内容插入编辑器
    event.preventDefault()
    await uploadImages(imageFiles)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > UPLOAD_LIMITS.file.maxBytes) {
      setError(`文件过大，最大支持 ${formatFileSize(UPLOAD_LIMITS.file.maxBytes)}`)
      return
    }
    setIsUploading(true)
    setError('')
    try {
      const credentials = await uploadApi.getSTSToken()
      const { key } = await OssResourceManager.upload(file, {
        purpose: OssUploadPurpose.COMMENT_FILE,
        credentials,
      })
      setFiles((prev) => [...prev, { key, name: file.name }])
    } catch (err: any) {
      setError(err?.message || '文件上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const openLinkPopup = () => {
    if (!editor) return
    const attrs = editor.getAttributes('link')
    const { from, to } = editor.state.selection
    const selected = from < to ? editor.state.doc.textBetween(from, to, '') : ''
    setLinkUrl(attrs?.href ?? '')
    setLinkText(selected)
    setLinkPopupOpen(true)
  }

  const applyLink = () => {
    if (!editor) return
    let url = linkUrl.trim()
    if (!url) {
      setError('请输入链接地址')
      return
    }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    const escapeHtml = (s: string) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const { from, to } = editor.state.selection
    const hasSelection = from < to
    if (hasSelection) {
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      const text = linkText.trim() || url
      editor.chain().focus().insertContent(`<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`).run()
    }
    setLinkPopupOpen(false)
    setLinkUrl('')
    setLinkText('')
    setError('')
  }

  const cancelLinkPopup = () => {
    setLinkPopupOpen(false)
    setLinkUrl('')
    setLinkText('')
    setError('')
  }

  const handleSubmit = async () => {
    if (!editor) return
    const raw = htmlToMentionText(editor.getHTML())
    let content = rawUrlsToLinkFormat(raw)
    const textOnly = content.replace(/\[name\]\([^)]*\)/g, ' ').replace(/\[link\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, ' ').trim()
    const hasTags = /\[(name|link)\]\(/.test(content)
    if (!textOnly && !hasTags && images.length === 0 && files.length === 0) {
      setError('请输入内容或添加图片、附件')
      return
    }
    setError('')

    // Prepend images and files as tags
    const imageTags = images.map((img) => `[image](${img.key})`).join(' ')
    const fileTags = files.map((file) => `[file](${file.key})`).join(' ')
    
    let finalContent = content
    if (fileTags) finalContent = finalContent ? `${fileTags} ${finalContent}` : fileTags
    if (imageTags) finalContent = finalContent ? `${imageTags} ${finalContent}` : imageTags

    try {
      await onSubmit({
        content: finalContent,
        imageKeys: [],
        fileKeys: [],
      })
      editor.commands.setContent('<p></p>')
      setImages([])
      setFiles([])
      setHasText(false)
    } catch (err: any) {
      setError(err?.message || '提交失败')
    }
  }
  const hasContent = hasText || images.length > 0 || files.length > 0

  return (
    <div className="flex flex-col gap-3 relative">
      {/* 图片区：置顶，最多 5 个一行，缩略图，悬停显示删除 */}
      {images.length > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(5, ${IMAGE_CELL_SIZE}px)` }}
        >
          {images.map((img, index) => (
            <div
              key={img.key}
              className="group relative rounded-md overflow-hidden border border-border bg-surface-active"
              style={{ width: IMAGE_CELL_SIZE, height: IMAGE_CELL_SIZE }}
            >
              <img
                src={img.url}
                alt=""
                data-oss-key={img.key}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-black/60 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="删除图片"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 附件区 */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, index) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-active text-sm text-foreground border border-border"
            >
              <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="shrink-0 text-foreground-secondary hover:text-foreground"
                aria-label="移除附件"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 统一的编辑器容器 */}
      <div
        className={clsx(
          'flex flex-col rounded-lg border bg-surface transition-all',
          'border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
          (isLoading || isUploading) && 'opacity-70 pointer-events-none'
        )}
      >
        {/* 输入框区域 */}
        <div className="min-h-[80px]">
          <EditorContent editor={editor} onPaste={handleEditorPaste} />
          <style>{`
            .mention-tag { color: var(--color-primary); font-weight: 500; cursor: default; user-select: none; padding: 0 2px; }
            .ProseMirror a { color: var(--color-primary); text-decoration: underline; cursor: pointer; }
          `}</style>
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-2 py-2 border-t border-border/50 bg-surface-muted/30 rounded-b-lg">
          {/* 左侧功能按钮 */}
          <div className="flex items-center gap-1">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={isLoading || isUploading}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading || isUploading}
            />
            
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="p-2 rounded-md hover:bg-surface-hover text-foreground-secondary hover:text-foreground transition-colors"
              title="插入图片"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="p-2 rounded-md hover:bg-surface-hover text-foreground-secondary hover:text-foreground transition-colors"
              title="插入附件"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={openLinkPopup}
              disabled={isLoading || !editor}
              className="p-2 rounded-md hover:bg-surface-hover text-foreground-secondary hover:text-foreground transition-colors"
              title="插入链接"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                disabled={isLoading || isUploading}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isLoading || isUploading}
              disabled={!hasContent}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* 链接弹出框 */}
      {linkPopupOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-3 shadow-lg absolute bottom-full mb-2 left-0 z-10 w-full max-w-md">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="链接地址"
              className="flex-1 min-w-[150px] rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground placeholder:text-foreground-muted"
              onKeyDown={(e) => {
                if (e.key === 'Escape') { cancelLinkPopup(); return }
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); applyLink() }
              }}
              autoFocus
            />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="链接文字"
              className="w-[100px] rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground placeholder:text-foreground-muted"
              onKeyDown={(e) => {
                if (e.key === 'Escape') { cancelLinkPopup(); return }
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); applyLink() }
              }}
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={applyLink}
                className="rounded px-2 py-1.5 text-sm bg-primary text-primary-fg hover:opacity-90 whitespace-nowrap"
              >
                确定
              </button>
              <button
                type="button"
                onClick={cancelLinkPopup}
                className="rounded px-2 py-1.5 text-sm bg-surface-hover text-foreground-secondary hover:text-foreground whitespace-nowrap"
              >
                取消
              </button>
            </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-error bg-error/10 px-2 py-1.5">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {/* @ 提及下拉：Portal 到 body */}
      {suggestionProps && suggestionRect && suggestionProps.items.length > 0 &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              aria-hidden
              onClick={() => setSuggestionRef.current(null)}
            />
            <div
              className="fixed z-[101] bg-surface-elevated border border-border rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[200px] max-w-[300px]"
              style={{ top: suggestionRect.top, left: suggestionRect.left }}
              role="listbox"
            >
              {suggestionProps.items.map((item: any, index: number) => (
                <button
                  key={item.id ?? index}
                  type="button"
                  role="option"
                  aria-selected={index === suggestionSelectedIndex}
                  className={clsx(
                    'w-full px-3 py-2 flex items-center gap-2 text-left text-sm transition-colors',
                    index === suggestionSelectedIndex ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                  )}
                  onClick={() => {
                    suggestionProps.command(item)
                    setSuggestionRef.current(null)
                  }}
                >
                  <Avatar
                    user={{
                      username: item.label ?? item.id,
                      avatar: item.avatar ?? undefined,
                    }}
                    size="xs"
                  />
                  <span className="text-foreground">{item.label ?? item.id}</span>
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
