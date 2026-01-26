/**
 * CommentEditor - 评论编辑器组件
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Button, Avatar } from '@/components/ui'
import { LinkIcon, DocumentIcon, PencilIcon } from '@/components/ui'
import { uploadApi } from '@/lib/api/endpoints/upload'
import { uploadAttachmentToOSS } from '@/lib/oss/uploadApi'
import { getSignedUrl } from '@/lib/oss/upload/getSignedUrl'
import clsx from 'clsx'

export type CommentType = 'text' | 'url' | 'file'

export interface CommentEditorProps {
  initialContent?: string
  initialType?: CommentType
  onSubmit: (content: string, type: CommentType) => Promise<void>
  onCancel: () => void
  placeholder?: string
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  members?: any[] // 项目成员列表
  projectId?: string // 项目ID，用于存储最近选择的成员
}

// 本地存储工具函数
const STORAGE_KEY_PREFIX = 'comment_mentions_'

function getRecentMentions(projectId: string): number[] {
  if (!projectId) return []
  try {
    const key = `${STORAGE_KEY_PREFIX}${projectId}`
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('读取最近提及成员失败:', error)
  }
  return []
}

function saveRecentMention(projectId: string, userId: number) {
  if (!projectId) return
  try {
    const key = `${STORAGE_KEY_PREFIX}${projectId}`
    const recent = getRecentMentions(projectId)
    // 移除已存在的，然后添加到最前面
    const filtered = recent.filter(id => id !== userId)
    const updated = [userId, ...filtered].slice(0, 10) // 最多保存10个
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (error) {
    console.error('保存最近提及成员失败:', error)
  }
}

// 从 contenteditable div 提取内容，转换为 [name](xxx) 格式
function extractContentFromEditor(editor: HTMLElement): string {
  let result = ''
  
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      // 检查是否是提及标签
      if (element.classList.contains('mention-tag')) {
        const username = element.getAttribute('data-username') || ''
        result += `[name](${username})`
      } else {
        // 递归处理子节点
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i])
        }
      }
    }
  }
  
  for (let i = 0; i < editor.childNodes.length; i++) {
    walk(editor.childNodes[i])
  }
  
  return result
}

// 将 [name](xxx) 格式的内容转换为 DOM 节点
function renderContentToEditor(editor: HTMLElement, content: string) {
  // 清空编辑器
  editor.innerHTML = ''
  
  if (!content) return
  
  // 解析内容，将 [name](xxx) 转换为 mention-tag
  const parts: (string | { type: 'mention'; username: string })[] = []
  let lastIndex = 0
  const mentionRegex = /\[name\]\(([^)]+)\)/g
  let match
  
  while ((match = mentionRegex.exec(content)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }
    
    // 添加提及
    const username = match[1].trim().replace(/\s+/g, ' ')
    parts.push({ type: 'mention', username })
    
    lastIndex = match.index + match[0].length
  }
  
  // 添加剩余文本
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }
  
  // 构建 DOM
  parts.forEach((part) => {
    if (typeof part === 'string') {
      // 普通文本节点
      if (part) {
        editor.appendChild(document.createTextNode(part))
      }
    } else {
      // 提及标签
      const mentionNode = document.createElement('span')
      mentionNode.className = 'mention-tag'
      mentionNode.contentEditable = 'false'
      mentionNode.textContent = `@${part.username}`
      mentionNode.setAttribute('data-username', part.username)
      mentionNode.style.color = '#2563eb'
      mentionNode.style.fontWeight = '500'
      mentionNode.style.cursor = 'default'
      mentionNode.style.userSelect = 'none'
      mentionNode.style.padding = '0 2px'
      editor.appendChild(mentionNode)
      
      // 添加一个零宽空格，方便后续输入
      editor.appendChild(document.createTextNode('\u200B'))
    }
  })
}

// 插入提及到 contenteditable div
function insertMention(editor: HTMLElement, username: string) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  
  // 查找 @ 符号的位置
  const textNode = range.startContainer
  if (textNode.nodeType === Node.TEXT_NODE) {
    const text = textNode.textContent || ''
    const offset = range.startOffset
    let atIndex = -1
    
    // 向前查找 @ 符号
    for (let i = offset - 1; i >= 0; i--) {
      if (text[i] === '@') {
        atIndex = i
        break
      }
      if (text[i] === ' ' || text[i] === '\n') {
        break
      }
    }
    
    if (atIndex === -1) return
    
    // 删除 @ 符号及其后的文本（直到光标位置或空格/换行）
    let deleteEnd = offset
    while (deleteEnd < text.length && text[deleteEnd] !== ' ' && text[deleteEnd] !== '\n') {
      deleteEnd++
    }
    
    // 创建新的文本节点（删除 @ 及其后的文本）
    const beforeAt = text.substring(0, atIndex)
    const afterDelete = text.substring(deleteEnd)
    
    // 创建提及节点
    const mentionNode = document.createElement('span')
    mentionNode.className = 'mention-tag'
    mentionNode.contentEditable = 'false'
    mentionNode.textContent = `@${username}`
    mentionNode.setAttribute('data-username', username)
    mentionNode.style.color = '#2563eb'
    mentionNode.style.fontWeight = '500'
    mentionNode.style.cursor = 'default'
    mentionNode.style.userSelect = 'none'
    mentionNode.style.padding = '0 2px'
    
    // 替换文本节点
    const parent = textNode.parentNode
    if (!parent) return
    
    // 创建新的文本节点
    if (beforeAt) {
      parent.insertBefore(document.createTextNode(beforeAt), textNode)
    }
    
    // 插入提及节点
    parent.insertBefore(mentionNode, textNode)
    
    // 添加空格
    const space = document.createTextNode(' ')
    parent.insertBefore(space, textNode)
    
    // 添加剩余的文本
    if (afterDelete) {
      parent.insertBefore(document.createTextNode(afterDelete), textNode)
    }
    
    // 删除原始文本节点
    parent.removeChild(textNode)
    
    // 移动光标到空格后
    const newRange = document.createRange()
    newRange.setStartAfter(space)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }
}

export function CommentEditor({
  initialContent = '',
  initialType = 'text',
  onSubmit,
  onCancel,
  placeholder = '添加评论...',
  submitLabel = '提交',
  cancelLabel = '取消',
  isLoading = false,
  members = [],
  projectId,
}: CommentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [type, setType] = useState<CommentType>(initialType)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null) // 改为 contenteditable div
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // 初始化编辑器内容
  useEffect(() => {
    if (editorRef.current && initialContent) {
      renderContentToEditor(editorRef.current, initialContent)
    }
  }, []) // 只在组件挂载时执行一次
  
  // @提及相关状态
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)

  // 检测 @ 符号并显示下拉列表
  const handleMentionDetection = () => {
    if (!editorRef.current || type !== 'text') {
      setShowMentionList(false)
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setShowMentionList(false)
      return
    }

    const range = selection.getRangeAt(0)
    const textNode = range.startContainer
    
    if (textNode.nodeType !== Node.TEXT_NODE) {
      setShowMentionList(false)
      return
    }

    const text = textNode.textContent || ''
    const offset = range.startOffset
    
    // 向前查找 @ 符号
    let atIndex = -1
    for (let i = offset - 1; i >= 0; i--) {
      if (text[i] === '@') {
        atIndex = i
        break
      }
      if (text[i] === ' ' || text[i] === '\n') {
        break
      }
    }

    if (atIndex === -1) {
      setShowMentionList(false)
      return
    }

    // 获取 @ 后的查询文本
    const query = text.substring(atIndex + 1, offset).toLowerCase()
    setMentionQuery(query)

    // 计算下拉列表位置
    const editorRect = editorRef.current.getBoundingClientRect()
    const tempRange = document.createRange()
    tempRange.setStart(textNode, atIndex)
    tempRange.setEnd(textNode, atIndex)
    const atRect = tempRange.getBoundingClientRect()

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dropdownWidth = 300
    const dropdownHeight = 192

    let left = atRect.left
    let top = atRect.bottom + 4

    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 8
    }
    if (left < 8) {
      left = 8
    }
    if (top + dropdownHeight > viewportHeight) {
      top = atRect.top - dropdownHeight - 4
      if (top < 8) {
        top = 8
      }
    }

    const position = {
      top: Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8)),
      left: Math.max(8, Math.min(left, viewportWidth - dropdownWidth - 8)),
    }

    // 检查是否有成员可显示
    const hasMembers = query.trim()
      ? sortedMembers.some((m: any) => {
          const username = (m.username || m.user?.username || '').toLowerCase()
          return username.includes(query)
        })
      : sortedMembers.length > 0

    if (hasMembers) {
      setMentionPosition(position)
      setShowMentionList(true)
      setSelectedMentionIndex(0)
    } else {
      setShowMentionList(false)
      setMentionPosition(null)
    }
  }

  const handleSubmit = async () => {
    if (type === 'file') {
      if (!selectedFile) {
        setError('请选择要上传的文件')
        return
      }
      
      // 文件功能暂时保留UI，但显示提示信息
      setError('当前功能完成中')
      return
      
      // 以下代码暂时禁用，等待功能完成
      /*
      setIsUploading(true)
      setError('')
      try {
        // 获取STS凭证
        const credentials = await uploadApi.getSTSToken()
        
        // 上传文件到OSS
        const uploadResult = await uploadAttachmentToOSS(
          selectedFile,
          credentials,
          (progress) => {
            setUploadProgress(progress)
          }
        )
        
        // 生成签名URL
        const signedUrl = await getSignedUrl(uploadResult.objectKey, credentials)
        
        // 提交时使用objectKey作为content
        await onSubmit(uploadResult.objectKey, 'file')
        setContent('')
        setSelectedFile(null)
        setUploadProgress(0)
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || '文件上传失败，请重试')
      } finally {
        setIsUploading(false)
      }
      */
    } else {
      // 从 contenteditable div 提取内容
      if (!editorRef.current) return
      
      const extractedContent = extractContentFromEditor(editorRef.current)
      
      if (!extractedContent.trim()) {
        setError('评论内容不能为空')
        return
      }

      setError('')
      try {
        await onSubmit(extractedContent.trim(), type)
        // 清空编辑器
        if (editorRef.current) {
          editorRef.current.innerHTML = ''
        }
        setContent('')
        setType('text') // 重置为默认类型
        setSelectedFile(null)
        setUploadProgress(0)
        // 确保编辑器重新聚焦
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus()
          }
        }, 0)
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || '提交失败，请重试')
      }
    }
  }

  const handleCancel = () => {
    setContent(initialContent)
    setType(initialType)
    setError('')
    setSelectedFile(null)
    setUploadProgress(0)
    // 不清空内容，保持编辑器展开状态
    if (onCancel) {
      onCancel()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')
    }
  }

  const handleTypeChange = (newType: CommentType) => {
    setType(newType)
    setError('')
    setShowMentionList(false)
    if (newType !== 'file') {
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 获取排序后的成员列表（最近选择的排在最上）
  const sortedMembers = useMemo(() => {
    if (!projectId || !members || members.length === 0) {
      console.log('@提及：成员列表为空', { projectId, membersLength: members?.length })
      return []
    }
    
    const recentMentionIds = getRecentMentions(projectId)
    const memberMap = new Map(members.map((m: any) => [m.user_id, m]))
    
    // 先添加最近提及的成员
    const recentMembers = recentMentionIds
      .map(id => memberMap.get(id))
      .filter(Boolean)
    
    // 再添加其他成员（排除已添加的）
    const otherMembers = members.filter((m: any) => !recentMentionIds.includes(m.user_id))
    
    const sorted = [...recentMembers, ...otherMembers]
    console.log('@提及：排序后的成员列表', { total: sorted.length, recent: recentMembers.length })
    return sorted
  }, [members, projectId])

  // 过滤成员列表（根据输入查询）
  const filteredMembers = useMemo(() => {
    if (!mentionQuery.trim()) {
      console.log('@提及：无查询文本，返回所有成员', sortedMembers.length)
      return sortedMembers
    }
    
    const query = mentionQuery.toLowerCase()
    const filtered = sortedMembers.filter((member: any) => {
      const username = (member.username || member.user?.username || '').toLowerCase()
      return username.includes(query)
    })
    console.log('@提及：过滤成员', { query, total: sortedMembers.length, filtered: filtered.length })
    return filtered
  }, [sortedMembers, mentionQuery])

  // 处理点击事件，检测是否点击在 [name](xxx) 上，如果是则重新打开下拉列表
  const handleTextClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (type !== 'text' || !textareaRef.current) return
    
    // 使用 setTimeout 确保 selectionStart 已更新
    setTimeout(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      
      const cursorPosition = textarea.selectionStart
      const text = content
      const textBeforeCursor = text.substring(0, cursorPosition)
      
      // 查找光标前的 [name](xxx) 格式
      const mentionRegex = /\[name\]\([^)]+\)/g
      let match
      while ((match = mentionRegex.exec(textBeforeCursor)) !== null) {
        const startPos = match.index
        const endPos = match.index + match[0].length
        
        // 如果光标在提及范围内，重新打开下拉列表
        if (cursorPosition >= startPos && cursorPosition <= endPos) {
          // 找到@符号的位置（应该在 [name](xxx) 之前）
          const beforeMention = text.substring(0, startPos)
          const atIndex = beforeMention.lastIndexOf('@')
          
          if (atIndex !== -1) {
            // 删除旧的提及，保留@符号
            const beforeAt = text.substring(0, atIndex)
            const afterMention = text.substring(endPos)
            const newContent = `${beforeAt}@${afterMention}`
            setContent(newContent)
            
            // 将光标移动到@符号后，并触发下拉列表
            setTimeout(() => {
              if (textareaRef.current) {
                const newCursorPos = atIndex + 1
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
                textareaRef.current.focus()
                
                // 手动触发文本变化以显示下拉列表
                const event = new Event('input', { bubbles: true })
                Object.defineProperty(event, 'target', { 
                  value: textareaRef.current, 
                  enumerable: true 
                })
                Object.defineProperty(textareaRef.current, 'value', { 
                  value: newContent, 
                  writable: true,
                  configurable: true
                })
                textareaRef.current.dispatchEvent(event)
                
                // 也调用 handleTextChange
                const fakeEvent = {
                  target: textareaRef.current,
                  currentTarget: textareaRef.current,
                } as React.ChangeEvent<HTMLTextAreaElement>
                handleTextChange(fakeEvent)
              }
            }, 10)
          }
          break
        }
      }
    }, 0)
  }

  // 处理文本输入变化，检测@符号
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setError('')
    
    if (type !== 'text') {
      setShowMentionList(false)
      return
    }

    const textarea = e.target
    const cursorPosition = textarea.selectionStart
    
    // 查找光标前的@符号或 [name](xxx) 格式
    const textBeforeCursor = newContent.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    // 检查是否在 [name](xxx) 格式内
    const mentionRegex = /\[name\]\([^)]+\)/g
    let inMention = false
    let mentionStart = -1
    let match
    while ((match = mentionRegex.exec(textBeforeCursor)) !== null) {
      if (cursorPosition >= match.index && cursorPosition <= match.index + match[0].length) {
        inMention = true
        mentionStart = match.index
        break
      }
    }
    
    // 如果在提及内，查找提及前的@符号
    let searchIndex = lastAtIndex
    if (inMention && mentionStart !== -1) {
      // 查找提及前的@符号
      const beforeMention = textBeforeCursor.substring(0, mentionStart)
      const atBeforeMention = beforeMention.lastIndexOf('@')
      if (atBeforeMention !== -1) {
        searchIndex = atBeforeMention
      }
    }
    
    if (searchIndex !== -1) {
      // 检查@后面是否有空格或换行（如果有，说明@已经结束）
      const textAfterAt = textBeforeCursor.substring(searchIndex + 1)
      // 检查是否是已完成的提及格式 [name](用户名)
      if (textAfterAt.match(/^\[name\]\([^)]+\)/)) {
        // 如果光标在提及内，允许重新选择（在handleTextClick中处理）
        if (!inMention) {
          console.log('@提及：已是完成的提及格式，关闭')
          setShowMentionList(false)
          setMentionPosition(null)
          return
        }
        // 如果在提及内，继续处理以显示下拉列表
      }
      
      // 检查@后面是否有空格或换行
      const actualTextAfterAt = textBeforeCursor.substring(searchIndex + 1)
      if (actualTextAfterAt.includes(' ') || actualTextAfterAt.includes('\n')) {
        // 检查是否在提及内
        if (!inMention) {
          console.log('@提及：@后已有空格或换行，关闭')
          setShowMentionList(false)
          setMentionPosition(null)
          return
        }
      }
      
      console.log('@提及：检测到@符号', { searchIndex, actualTextAfterAt, inMention, type, membersLength: members.length })
      
      // 获取@后面的查询文本（排除已完成的提及）
      const queryText = actualTextAfterAt.replace(/^\[name\]\([^)]+\)/, '').toLowerCase()
      setMentionQuery(queryText)
      
      // 计算位置（同步计算，避免延迟）
      if (!textareaRef.current) {
        setShowMentionList(false)
        return
      }
      
      const textarea = textareaRef.current
      const textareaRect = textarea.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(textarea)
      
      // 创建一个临时元素来计算@符号在textarea中的位置
      const measureDiv = document.createElement('div')
      
      // 复制textarea的所有相关样式，确保测量准确
      measureDiv.style.position = 'absolute'
      measureDiv.style.visibility = 'hidden'
      measureDiv.style.whiteSpace = 'pre-wrap'
      measureDiv.style.wordWrap = 'break-word'
      measureDiv.style.font = computedStyle.font
      measureDiv.style.fontSize = computedStyle.fontSize
      measureDiv.style.fontFamily = computedStyle.fontFamily
      measureDiv.style.lineHeight = computedStyle.lineHeight
      measureDiv.style.width = `${textarea.offsetWidth}px`
      measureDiv.style.padding = computedStyle.padding
      measureDiv.style.border = computedStyle.border
      measureDiv.style.boxSizing = computedStyle.boxSizing
      measureDiv.style.overflow = 'hidden'
      measureDiv.style.margin = '0'
      measureDiv.style.wordBreak = 'break-word'
      measureDiv.style.left = `${textareaRect.left}px`
      measureDiv.style.top = `${textareaRect.top}px`
        // 将 [name](xxx) 转换为 @xxx 用于位置计算
        const textForMeasure = textBeforeCursor.replace(/\[name\]\(([^)]+)\)/g, '@$1')
        measureDiv.textContent = textForMeasure
      
      document.body.appendChild(measureDiv)
      
        // 计算@符号的位置（使用转换后的文本位置）
        const textNode = measureDiv.firstChild
        if (textNode) {
          const range = document.createRange()
          // 计算转换后的@位置
          const convertedIndex = textForMeasure.length - (textBeforeCursor.length - searchIndex)
          range.setStart(textNode, 0)
          range.setEnd(textNode, Math.max(0, convertedIndex))
        const atRect = range.getBoundingClientRect()
        
        // 使用fixed定位，基于视口坐标
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const dropdownWidth = 300 // maxWidth
        const dropdownHeight = 192 // max-h-48 = 192px
        
        // @符号的位置（已经是视口坐标）
        let left = atRect.left
        let top = atRect.bottom + 4 // @符号下方4px
        
        // 确保下拉框不会超出视口右侧
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 8
        }
        // 确保下拉框不会超出视口左侧
        if (left < 8) {
          left = 8
        }
        
        // 如果下方空间不够，显示在上方
        if (top + dropdownHeight > viewportHeight) {
          top = atRect.top - dropdownHeight - 4
          if (top < 8) {
            top = 8
          }
        }
        
        const position = {
          top: Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8)),
          left: Math.max(8, Math.min(left, viewportWidth - dropdownWidth - 8)),
        }
        
        // 检查是否有成员可显示
        const query = textAfterAt.toLowerCase()
        const hasMembers = query.trim() 
          ? sortedMembers.some((m: any) => {
              const username = (m.username || m.user?.username || '').toLowerCase()
              return username.includes(query)
            })
          : sortedMembers.length > 0
        
        console.log('@提及位置计算:', {
          textareaRect: { left: textareaRect.left, top: textareaRect.top, width: textareaRect.width, height: textareaRect.height },
          atRect: { left: atRect.left, top: atRect.top, bottom: atRect.bottom, right: atRect.right },
          position,
          viewportWidth,
          viewportHeight,
          query,
          sortedMembersCount: sortedMembers.length,
          hasMembers,
          textBeforeCursor: textBeforeCursor.substring(Math.max(0, lastAtIndex - 10), lastAtIndex + 10)
        })
        
        if (hasMembers) {
          setMentionPosition(position)
          setShowMentionList(true)
          setSelectedMentionIndex(0)
          
          console.log('@提及：设置显示状态', {
            position,
            showMentionList: true
          })
        } else {
          console.log('@提及：无成员可显示，关闭')
          setShowMentionList(false)
          setMentionPosition(null)
        }
      } else {
        console.log('@提及：textNode不存在')
        setShowMentionList(false)
        setMentionPosition(null)
      }
      
      document.body.removeChild(measureDiv)
    } else {
      setShowMentionList(false)
      setMentionPosition(null)
    }
  }

  // 选择成员
  const handleSelectMention = (member: any) => {
    if (!editorRef.current) return
    
    // 确保用户名去除首尾空格和制表符
    const username = (member.username || member.user?.username || '未知').trim().replace(/\s+/g, ' ')
    
    // 使用 DOM 操作插入提及
    insertMention(editorRef.current, username)
    
    // 更新 content 状态（用于其他逻辑）
    const extractedContent = extractContentFromEditor(editorRef.current)
    setContent(extractedContent)
    
    setShowMentionList(false)
    setMentionQuery('')
    
    // 保存到最近提及
    if (projectId && member.user_id) {
      saveRecentMention(projectId, member.user_id)
    }
    
    // 聚焦编辑器
    editorRef.current.focus()
  }

  // 处理键盘事件（用于导航和选择，以及整体删除提及）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPosition = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    
    // 处理 Backspace 和 Delete，使 [name](xxx) 作为整体删除
    if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPosition === selectionEnd) {
      const text = content
      const textBeforeCursor = text.substring(0, cursorPosition)
      const textAfterCursor = text.substring(cursorPosition)
      
      // 查找光标前或后的 [name](xxx) 格式
      const mentionRegex = /\[name\]\([^)]+\)/g
      let match
      
      if (e.key === 'Backspace') {
        // Backspace: 查找光标前的提及
        while ((match = mentionRegex.exec(textBeforeCursor)) !== null) {
          const startPos = match.index
          const endPos = match.index + match[0].length
          
          // 如果光标紧跟在提及后，删除整个提及
          if (cursorPosition === endPos || (cursorPosition > startPos && cursorPosition <= endPos)) {
            e.preventDefault()
            const beforeMention = text.substring(0, startPos)
            const afterCursor = text.substring(cursorPosition)
            const newContent = `${beforeMention}${afterCursor}`
            setContent(newContent)
            
            // 设置光标位置
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(startPos, startPos)
                textareaRef.current.focus()
              }
            }, 0)
            return
          }
        }
      } else if (e.key === 'Delete') {
        // Delete: 查找光标后的提及
        while ((match = mentionRegex.exec(textAfterCursor)) !== null) {
          const startPos = cursorPosition + match.index
          const endPos = startPos + match[0].length
          
          // 如果光标在提及前，删除整个提及
          if (cursorPosition === startPos || (cursorPosition >= startPos && cursorPosition < endPos)) {
            e.preventDefault()
            const beforeCursor = text.substring(0, cursorPosition)
            const afterMention = text.substring(endPos)
            const newContent = `${beforeCursor}${afterMention}`
            setContent(newContent)
            
            // 光标位置不变
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(cursorPosition, cursorPosition)
                textareaRef.current.focus()
              }
            }, 0)
            return
          }
        }
      }
    }
    
    // 处理下拉列表导航
    if (!showMentionList || filteredMembers.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedMentionIndex(prev => 
        prev < filteredMembers.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredMembers.length - 1
      )
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (filteredMembers[selectedMentionIndex]) {
        handleSelectMention(filteredMembers[selectedMentionIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowMentionList(false)
    }
  }

  // 点击外部关闭下拉框（现在通过遮罩层处理，这个可以移除，但保留作为备用）

  return (
    <div className="flex gap-3">
      {/* 类型选择 - 纵向排列在左侧 */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => handleTypeChange('text')}
          className={clsx(
            'p-1.5 rounded-full transition-colors flex items-center justify-center',
            'focus:outline-none focus:ring-0 border-0',
            type === 'text'
              ? 'bg-primary text-white'
              : 'bg-surface-hover text-foreground-secondary hover:text-foreground hover:bg-surface-active'
          )}
          disabled={isLoading || isUploading}
          title="文本"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('url')}
          className={clsx(
            'p-1.5 rounded-full transition-colors flex items-center justify-center',
            'focus:outline-none focus:ring-0 border-0',
            type === 'url'
              ? 'bg-primary text-white'
              : 'bg-surface-hover text-foreground-secondary hover:text-foreground hover:bg-surface-active'
          )}
          disabled={isLoading || isUploading}
          title="URL"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('file')}
          className={clsx(
            'p-1.5 rounded-full transition-colors flex items-center justify-center',
            'focus:outline-none focus:ring-0 border-0',
            type === 'file'
              ? 'bg-primary text-white'
              : 'bg-surface-hover text-foreground-secondary hover:text-foreground hover:bg-surface-active'
          )}
          disabled={isLoading || isUploading}
          title="文件"
        >
          <DocumentIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 内容输入区域 */}
      <div className="flex-1 flex flex-col gap-3">
      {type === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading || isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="w-full px-3 text-sm border border-border bg-surface-elevated text-foreground rounded-md hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2"
            style={{ height: '100px' }}
          >
            {selectedFile ? (
              <>
                <DocumentIcon className="w-8 h-8 text-foreground-secondary" />
                <span className="text-sm text-foreground">{selectedFile.name}</span>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-foreground-secondary">选择文件</span>
              </>
            )}
          </button>
          {isUploading && (
            <div className="w-full bg-surface-active rounded-md h-2 overflow-hidden mt-2">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress * 100}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div 
          className="relative border border-border bg-surface-elevated rounded-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary"
          style={{ height: '100px' }}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              if (!editorRef.current) return
              const extractedContent = extractContentFromEditor(editorRef.current)
              setContent(extractedContent)
              setError('')
              
              // 检测 @ 符号并显示下拉列表
              if (type === 'text') {
                handleMentionDetection()
              }
            }}
            onKeyDown={(e) => {
              // 处理键盘事件
              if (e.key === 'Backspace' || e.key === 'Delete') {
                // 删除逻辑由 contenteditable="false" 自动处理
              }
              // 处理下拉列表导航
              if (showMentionList && filteredMembers.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedMentionIndex(prev => 
                    prev < filteredMembers.length - 1 ? prev + 1 : 0
                  )
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedMentionIndex(prev => 
                    prev > 0 ? prev - 1 : filteredMembers.length - 1
                  )
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault()
                  if (filteredMembers[selectedMentionIndex]) {
                    handleSelectMention(filteredMembers[selectedMentionIndex])
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  setShowMentionList(false)
                }
              }
            }}
            className="w-full h-full px-3 py-2 text-sm text-foreground outline-none"
            style={{
              lineHeight: '1.5rem',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
            }}
            data-placeholder={type === 'url' ? '输入URL地址...' : placeholder}
            suppressContentEditableWarning
          />
          {/* 占位符样式 */}
          <style>{`
            [contenteditable][data-placeholder]:empty:before {
              content: attr(data-placeholder);
              color: var(--color-foreground-secondary);
              opacity: 0.5;
              pointer-events: none;
            }
            .mention-tag {
              color: #2563eb !important;
              font-weight: 500;
              cursor: default;
              user-select: none;
              padding: 0 2px;
            }
          `}</style>
          
          {/* 成员提及下拉列表 - 使用 Portal 渲染到 body */}
          {showMentionList && type === 'text' && filteredMembers.length > 0 && mentionPosition && createPortal(
            <>
              {/* 遮罩层，点击关闭 */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => {
                  setShowMentionList(false)
                  setMentionPosition(null)
                }}
              />
              {/* 下拉列表 */}
              <div
                data-mention-list
                className="fixed z-[101] bg-surface-elevated border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                style={{
                  top: `${mentionPosition.top}px`,
                  left: `${mentionPosition.left}px`,
                  minWidth: '200px',
                  maxWidth: '300px',
                }}
              >
                {filteredMembers.map((member: any, index: number) => {
                  const username = member.username || member.user?.username || '未知'
                  const avatar = member.avatar || member.user?.avatar
                  const isSelected = index === selectedMentionIndex
                  
                  return (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => handleSelectMention(member)}
                      className={clsx(
                        'w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-surface-hover transition-colors',
                        isSelected && 'bg-surface-hover'
                      )}
                    >
                      <Avatar
                        user={{
                          username,
                          avatar: avatar || undefined,
                        }}
                        size="xs"
                      />
                      <span className="text-sm text-foreground">{username}</span>
                    </button>
                  )
                })}
              </div>
            </>,
            document.body
          )}
        </div>
      )}
      
      {error && (
        <div className="bg-error-light border border-error rounded-md p-2">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}
      
        <div className="flex items-center justify-end gap-2">
          {(() => {
            if (!editorRef.current) return false
            const extractedContent = extractContentFromEditor(editorRef.current)
            return extractedContent.trim().length > 0
          })() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.innerHTML = ''
                }
                setContent('')
                setError('')
                setSelectedFile(null)
                setUploadProgress(0)
                setType('text')
              }}
              disabled={isLoading || isUploading}
            >
              清空
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={isLoading || isUploading}
            disabled={(() => {
              if (!editorRef.current) return type !== 'file'
              const extractedContent = extractContentFromEditor(editorRef.current)
              return !extractedContent.trim() && type !== 'file'
            })()}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
