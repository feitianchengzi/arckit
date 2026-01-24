/**
 * 导出待办对话框组件
 */

import { useState, useMemo } from 'react'
import { Dialog, Button } from '@/components/ui'
import { DateRangeFilter, type DateRange } from './DateRangeFilter'
import type { Todo, ProjectMember } from '@/types'
import ReactMarkdown from 'react-markdown'

export interface ExportTodosDialogProps {
  open: boolean
  onClose: () => void
  todos: Todo[]
  members: ProjectMember[]
  currentUserId: number | null
  projectId: number
  projectName: string
}

// 判断内容是否是markdown格式（简单判断）
function isMarkdownContent(content: string): boolean {
  // 检查是否包含markdown语法
  const markdownPatterns = [
    /^#{1,6}\s/, // 标题
    /\*\*.*\*\*/, // 粗体
    /\*.*\*/, // 斜体
    /\[.*\]\(.*\)/, // 链接
    /```[\s\S]*```/, // 代码块
    /^\s*[-*+]\s/, // 列表
    /^\s*\d+\.\s/, // 有序列表
    />\s/, // 引用
  ]
  return markdownPatterns.some(pattern => pattern.test(content))
}

// 截断文本到指定长度，保留A4宽度（约80字符）
function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// 生成待办详情页URL
function getTaskDetailUrl(projectId: number, taskId: number): string {
  return `${window.location.origin}/projects/${projectId}/tasks/${taskId}`
}

// 导出为Markdown格式
function exportToMarkdown(
  todos: Todo[],
  members: ProjectMember[],
  currentUserId: number | null,
  projectId: number,
  projectName: string,
  dateRange: DateRange
): string {
  if (!todos || todos.length === 0) {
    return `# ${projectName} - 待办事项\n\n暂无待办事项\n`
  }

  // 创建成员映射
  const memberMap = new Map<number, ProjectMember>()
  members.forEach(m => {
    if (m.user_id) {
      memberMap.set(m.user_id, m)
    }
  })

  // 筛选与自己相关的待办（创建人或执行人）
  const relatedTodos = todos.filter(todo => {
    if (!currentUserId) return false
    return todo.creatorId === currentUserId || todo.assigneeId === currentUserId
  })

  // 按日期范围筛选
  const filteredTodos = relatedTodos.filter(todo => {
    if (!dateRange.startDate && !dateRange.endDate) return true
    
    const taskDate = new Date(todo.createdAt)
    taskDate.setHours(0, 0, 0, 0)
    
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (taskDate < startDate) return false
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (taskDate > endDate) return false
    }
    
    return true
  })

  if (filteredTodos.length === 0) {
    const dateRangeText = dateRange.startDate || dateRange.endDate
      ? ` (${dateRange.startDate || '开始'} - ${dateRange.endDate || '结束'})`
      : ''
    return `# ${projectName} - 待办事项${dateRangeText}\n\n在选定日期范围内没有找到相关的待办事项\n`
  }

  // 构建待办树（只包含筛选后的待办）
  const todoMap = new Map<number, Todo>()
  filteredTodos.forEach(todo => {
    todoMap.set(todo.id, { ...todo, children: [] })
  })

  // 构建父子关系
  const rootTodos: Todo[] = []
  filteredTodos.forEach(todo => {
    const todoInMap = todoMap.get(todo.id)!
    if (todo.parentId && todoMap.has(todo.parentId)) {
      // 父待办也在筛选结果中，作为子待办
      const parent = todoMap.get(todo.parentId)!
      if (!parent.children) parent.children = []
      parent.children.push(todoInMap)
    } else {
      // 根待办
      rootTodos.push(todoInMap)
    }
  })

  // 生成Markdown内容
  let md = `# ${projectName} - 待办事项\n\n`
  
  if (dateRange.startDate || dateRange.endDate) {
    md += `**日期范围**: ${dateRange.startDate || '开始'} - ${dateRange.endDate || '结束'}\n\n`
  }
  
  md += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n\n`
  md += `---\n\n`

  // 递归生成待办列表
  function generateTodoMarkdown(todo: Todo, indent: number = 0): string {
    const indentStr = '  '.repeat(indent)
    const isCompleted = todo.status === 'COMPLETED'
    const checkbox = isCompleted ? '- [x]' : '- [ ]'
    
    // 获取创建人和执行人信息
    const creator = memberMap.get(todo.creatorId)
    const executor = todo.assigneeId ? memberMap.get(todo.assigneeId) : null
    const creatorName = creator?.username || creator?.user?.username || `用户${todo.creatorId}`
    const executorName = executor?.username || executor?.user?.username || (todo.assigneeId ? `用户${todo.assigneeId}` : '')

    // 判断内容是否是markdown格式
    const isMarkdown = isMarkdownContent(todo.content)
    
    let content = todo.content
    let linkSuffix = ''
    
    if (isMarkdown) {
      // 如果是markdown格式，使用代码块多行样式
      content = `\n\`\`\`\n${todo.content}\n\`\`\``
    } else {
      // 普通文本，需要截断
      // A4宽度约80字符，预留空间：缩进 + checkbox + 空格 + 创建人/执行人 + 链接
      const baseLength = indentStr.length + checkbox.length + 1 // 缩进 + checkbox + 空格
      const suffixLength = (creatorName ? ` #${creatorName}`.length : 0) + 
                           (executorName ? ` @${executorName}`.length : 0)
      const linkLength = 20 // 链接大概长度 [🔗](url)
      const maxContentLength = 80 - baseLength - suffixLength - linkLength - 3 // 预留3个字符给省略号
      
      if (content.length > maxContentLength) {
        content = truncateText(content, maxContentLength)
        linkSuffix = ` [🔗](${getTaskDetailUrl(projectId, todo.id)})`
      }
    }

    // 构建行内容：checkbox + 内容 + 创建人 + 执行人
    let line = `${indentStr}${checkbox} ${content}`
    
    // 添加创建人和执行人信息
    if (creatorName) {
      line += ` #${creatorName}`
    }
    if (executorName) {
      line += ` @${executorName}`
    }
    
    // 添加链接（如果有）
    if (linkSuffix) {
      line += linkSuffix
    }
    
    line += '\n'
    
    // 处理子待办
    if (todo.children && todo.children.length > 0) {
      todo.children.forEach(child => {
        line += generateTodoMarkdown(child, indent + 1)
      })
    }
    
    return line
  }

  // 生成所有待办的markdown
  rootTodos.forEach(todo => {
    md += generateTodoMarkdown(todo)
  })

  return md
}

export function ExportTodosDialog({
  open,
  onClose,
  todos,
  members,
  currentUserId,
  projectId,
  projectName,
}: ExportTodosDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  })
  const [showPreview, setShowPreview] = useState(false)

  // 计算可导出的待办数量和预览内容
  const { exportableCount, previewMarkdown } = useMemo(() => {
    if (!todos || !currentUserId) {
      return { exportableCount: 0, previewMarkdown: '' }
    }
    
    const relatedTodos = todos.filter(todo => {
      return todo.creatorId === currentUserId || todo.assigneeId === currentUserId
    })

    let filteredTodos = relatedTodos
    if (dateRange.startDate || dateRange.endDate) {
      filteredTodos = relatedTodos.filter(todo => {
        const taskDate = new Date(todo.createdAt)
        taskDate.setHours(0, 0, 0, 0)
        
        if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate)
          startDate.setHours(0, 0, 0, 0)
          if (taskDate < startDate) return false
        }
        
        if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate)
          endDate.setHours(23, 59, 59, 999)
          if (taskDate > endDate) return false
        }
        
        return true
      })
    }

    const previewMd = exportToMarkdown(
      todos,
      members,
      currentUserId,
      projectId,
      projectName,
      dateRange
    )

    return {
      exportableCount: filteredTodos.length,
      previewMarkdown: previewMd,
    }
  }, [todos, members, currentUserId, projectId, projectName, dateRange])

  const handleExport = () => {
    const markdown = exportToMarkdown(
      todos,
      members,
      currentUserId,
      projectId,
      projectName,
      dateRange
    )

    // 创建Blob并下载
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 生成文件名
    const dateStr = dateRange.startDate || dateRange.endDate
      ? `_${dateRange.startDate || ''}_${dateRange.endDate || ''}`
      : ''
    const timestamp = new Date().toISOString().split('T')[0]
    link.download = `${projectName}_待办事项${dateStr}_${timestamp}.md`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="导出待办事项"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {!showPreview ? (
          <>
            <p className="text-sm text-foreground-secondary">
              选择日期范围，导出与您相关的待办事项（您创建的或分配给您的）到Markdown文件。
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                日期范围
              </label>
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
              />
              <p className="mt-1 text-xs text-foreground-tertiary">
                不选择日期范围则导出所有相关待办
              </p>
            </div>

            <div className="rounded-md p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-sm text-foreground">
                可导出待办数量: <span className="font-semibold">{exportableCount}</span>
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPreview(true)}
                disabled={exportableCount === 0}
              >
                预览
              </Button>
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={exportableCount === 0}
              >
                导出
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">预览内容</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                返回设置
              </Button>
            </div>

            <div 
              className="rounded-md border border-border p-4 max-h-[500px] overflow-y-auto"
              style={{ 
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {previewMarkdown ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                >
                  <ReactMarkdown
                    components={{
                      // 自定义链接组件，使其可点击
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          onClick={(e) => {
                            e.preventDefault()
                            if (props.href) {
                              window.open(props.href, '_blank')
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      // 自定义代码块样式
                      code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                          return (
                            <code 
                              className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" 
                              {...props} 
                            />
                          )
                        }
                        return (
                          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto my-2">
                            <code {...props} />
                          </pre>
                        )
                      },
                      // 自定义列表样式
                      li: ({ node, ...props }: any) => (
                        <li className="my-1" {...props} />
                      ),
                      // 自定义段落样式
                      p: ({ node, ...props }: any) => (
                        <p className="my-2" {...props} />
                      ),
                    }}
                  >
                    {previewMarkdown}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-foreground-secondary">暂无内容</p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowPreview(false)}
              >
                返回
              </Button>
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={exportableCount === 0}
              >
                导出
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}

