/**
 * 导出待办对话框组件
 */

import { useState, useMemo, useEffect } from 'react'
import { Dialog, Button } from '@/components/ui'
import { DateRangeFilter, type DateRange } from './DateRangeFilter'
import type { Todo, ProjectMember, TodoStatus } from '@/types'
import ReactMarkdown from 'react-markdown'
import { useTagStore } from '@/store/tagStore'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import clsx from 'clsx'

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

// 筛选待办列表
function filterTodos(
  todos: Todo[],
  members: ProjectMember[],
  currentUserId: number | null,
  filters: {
    statusFilter: TodoStatus | 'ALL'
    creatorFilter: number | 'ME' | null
    executorFilter: number | 'ME' | 'UNASSIGNED' | null
    tagFilter: number | null
    priorityFilter: number | null | 'ALL' | 'NONE'
    dateRange: DateRange
  },
  projectTags: Array<{ id: number; displayName: string }>
): Todo[] {
  if (!todos || todos.length === 0) return []

  return todos.filter(todo => {
    // 状态筛选
    if (filters.statusFilter !== 'ALL' && todo.status !== filters.statusFilter) {
      return false
    }

    // 创建人筛选
    if (filters.creatorFilter !== null) {
      if (filters.creatorFilter === 'ME') {
        if (!currentUserId || todo.creatorId !== currentUserId) {
          return false
        }
      } else {
        if (todo.creatorId !== filters.creatorFilter) {
          return false
        }
      }
    }

    // 执行人筛选
    if (filters.executorFilter !== null) {
      if (filters.executorFilter === 'ME') {
        if (!currentUserId || todo.assigneeId !== currentUserId) {
          return false
        }
      } else if (filters.executorFilter === 'UNASSIGNED') {
        if (todo.assigneeId !== undefined && todo.assigneeId !== null) {
          return false
        }
      } else {
        if (todo.assigneeId !== filters.executorFilter) {
          return false
        }
      }
    }

    // 标签筛选
    if (filters.tagFilter !== null) {
      const taskTagIds = parseTaskTags(todo.tags)
      if (!taskTagIds.includes(filters.tagFilter)) {
        return false
      }
    }

    // 优先级筛选
    if (filters.priorityFilter !== null) {
      if (filters.priorityFilter === 'ALL') {
        // 'ALL' 表示筛选"有优先级"（任意优先级）
        if (todo.priority === null || todo.priority === undefined) {
          return false
        }
      } else if (filters.priorityFilter === 'NONE') {
        // 'NONE' 表示筛选"无优先级"
        if (todo.priority !== null && todo.priority !== undefined) {
          return false
        }
      } else {
        // 数字表示筛选特定优先级
        if (todo.priority !== filters.priorityFilter) {
          return false
        }
      }
    }

    // 日期范围筛选（基于创建时间）
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      const taskDate = new Date(todo.createdAt)
      taskDate.setHours(0, 0, 0, 0)
      
      if (filters.dateRange.startDate) {
        const startDate = new Date(filters.dateRange.startDate)
        startDate.setHours(0, 0, 0, 0)
        if (taskDate < startDate) return false
      }
      
      if (filters.dateRange.endDate) {
        const endDate = new Date(filters.dateRange.endDate)
        endDate.setHours(23, 59, 59, 999)
        if (taskDate > endDate) return false
      }
    }

    return true
  })
}

// 导出为Markdown格式
function exportToMarkdown(
  todos: Todo[],
  members: ProjectMember[],
  projectId: number,
  projectName: string,
  filters: {
    statusFilter: TodoStatus | 'ALL'
    creatorFilter: number | 'ME' | null
    executorFilter: number | 'ME' | 'UNASSIGNED' | null
    tagFilter: number | null
    priorityFilter: number | null | 'ALL' | 'NONE'
    dateRange: DateRange
  }
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

  if (todos.length === 0) {
    return `# ${projectName} - 待办事项\n\n没有找到符合条件的待办事项\n`
  }

  // 构建待办树（只包含筛选后的待办）
  const todoMap = new Map<number, Todo>()
  todos.forEach(todo => {
    todoMap.set(todo.id, { ...todo, children: [] })
  })

  // 构建父子关系
  const rootTodos: Todo[] = []
  todos.forEach(todo => {
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
  
  // 添加筛选条件说明
  const filterDescriptions: string[] = []
  if (filters.statusFilter !== 'ALL') {
    const statusLabels: Record<TodoStatus, string> = {
      'PENDING_REVIEW': '待评审',
      'PENDING': '待办',
      'IN_PROGRESS': '进行中',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消',
      'BLOCKED': '已阻塞',
    }
    filterDescriptions.push(`状态: ${statusLabels[filters.statusFilter]}`)
  }
  if (filters.dateRange.startDate || filters.dateRange.endDate) {
    filterDescriptions.push(`日期: ${filters.dateRange.startDate || '开始'} - ${filters.dateRange.endDate || '结束'}`)
  }
  if (filterDescriptions.length > 0) {
    md += `**筛选条件**: ${filterDescriptions.join(', ')}\n\n`
  }
  
  md += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n\n`
  md += `---\n\n`

  // 递归生成待办列表
  function generateTodoMarkdown(todo: Todo, indent: number = 0, index: number = 0): string {
    const indentStr = '  '.repeat(indent)
    const isCompleted = todo.status === 'COMPLETED'
    const checkbox = isCompleted ? '[x]' : '[ ]'
    // 使用 1. 格式（注意点后面有空格）
    const numberPrefix = indent === 0 ? `${index + 1}. ` : ''
    
    // 获取创建人和执行人信息
    const creator = memberMap.get(todo.creatorId)
    const executor = todo.assigneeId ? memberMap.get(todo.assigneeId) : null
    const creatorName = creator?.username || creator?.user?.username || `用户${todo.creatorId}`
    const executorName = executor?.username || executor?.user?.username || (todo.assigneeId ? `用户${todo.assigneeId}` : '')

    // 所有内容统一显示一行，遇到换行直接截断
    let content = todo.content
    // 如果内容包含换行符，只取第一行
    if (content.includes('\n')) {
      content = content.split('\n')[0]
    }
    
    // A4宽度约80字符，预留空间：缩进 + 编号 + checkbox + 空格 + 创建人/执行人 + 链接
    const baseLength = indentStr.length + numberPrefix.length + checkbox.length + 1 // 缩进 + 编号 + checkbox + 空格
    const suffixLength = (creatorName ? ` #${creatorName}`.length : 0) + 
                         (executorName ? ` @${executorName}`.length : 0)
    const linkLength = 20 // 链接大概长度 [🔗](url)
    const maxContentLength = 80 - baseLength - suffixLength - linkLength - 3 // 预留3个字符给省略号
    
    // 如果内容超过最大长度，截断并添加省略号
    const needsLink = content.length > maxContentLength || todo.content.includes('\n')
    if (content.length > maxContentLength) {
      content = truncateText(content, maxContentLength)
    }
    
    // 如果内容需要链接，将内容部分包装为链接
    const taskUrl = getTaskDetailUrl(projectId, todo.id)
    let contentWithLink = content
    if (needsLink) {
      contentWithLink = `[${content} 🔗](${taskUrl})`
    }
    
    // 构建行内容：编号 + checkbox + 内容（可能带链接）+ 创建人 + 执行人
    let line = `${indentStr}${numberPrefix}${checkbox} ${contentWithLink}`
    
    // 添加创建人和执行人信息（使用反引号包裹以显示颜色）
    if (creatorName) {
      line += ` \`#${creatorName}\``
    }
    if (executorName) {
      line += ` \`@${executorName}\``
    }
    
    // 确保每行末尾都有换行符
    line += '\n'
    
    // 处理子待办
    if (todo.children && todo.children.length > 0) {
      todo.children.forEach((child, childIndex) => {
        line += generateTodoMarkdown(child, indent + 1, childIndex)
      })
    }
    
    return line
  }

  // 生成所有待办的markdown
  rootTodos.forEach((todo, index) => {
    md += generateTodoMarkdown(todo, 0, index)
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
  // 筛选器状态
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>('ALL')
  const [creatorFilter, setCreatorFilter] = useState<number | 'ME' | null>('ME') // 默认"我"
  const [executorFilter, setExecutorFilter] = useState<number | 'ME' | 'UNASSIGNED' | null>('ME') // 默认"我"
  const [tagFilter, setTagFilter] = useState<number | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<number | null | 'ALL' | 'NONE'>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  })
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'rendered' | 'source'>('rendered')

  // 加载项目标签
  const { loadProjectTags, getProjectTags } = useTagStore()
  useEffect(() => {
    if (projectId) {
      loadProjectTags(String(projectId)).catch(console.error)
    }
  }, [projectId, loadProjectTags])
  const projectTags = getProjectTags(String(projectId))

  // 筛选待办并计算数量
  const filteredTodos = useMemo(() => {
    if (!todos || !currentUserId) return []
    
    return filterTodos(
      todos,
      members,
      currentUserId,
      {
        statusFilter,
        creatorFilter,
        executorFilter,
        tagFilter,
        priorityFilter,
        dateRange,
      },
      projectTags
    )
  }, [todos, members, currentUserId, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange, projectTags])

  // 生成预览内容
  const previewMarkdown = useMemo(() => {
    return exportToMarkdown(
      filteredTodos,
      members,
      projectId,
      projectName,
      {
        statusFilter,
        creatorFilter,
        executorFilter,
        tagFilter,
        priorityFilter,
        dateRange,
      }
    )
  }, [filteredTodos, members, projectId, projectName, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange])

  const handleExport = () => {
    const markdown = exportToMarkdown(
      filteredTodos,
      members,
      projectId,
      projectName,
      {
        statusFilter,
        creatorFilter,
        executorFilter,
        tagFilter,
        priorityFilter,
        dateRange,
      }
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
              设置筛选条件，导出符合条件的待办事项到Markdown文件。
            </p>

            <div className="space-y-4">
              {/* 状态筛选 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  状态
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TodoStatus | 'ALL')}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="ALL">全部</option>
                  <option value="PENDING_REVIEW">待评审</option>
                  <option value="PENDING">待办</option>
                  <option value="IN_PROGRESS">进行中</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                  <option value="BLOCKED">已阻塞</option>
                </select>
              </div>

              {/* 创建人筛选 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  创建人
                </label>
                <select
                  value={creatorFilter === null ? '' : creatorFilter === 'ME' ? 'ME' : String(creatorFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setCreatorFilter(null)
                    } else if (value === 'ME') {
                      setCreatorFilter('ME')
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setCreatorFilter(numValue)
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">全部</option>
                  {currentUserId && (
                    <option value="ME">我</option>
                  )}
                  {members?.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username || member.user?.username || `用户${member.user_id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 执行人筛选 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  执行人
                </label>
                <select
                  value={executorFilter === null ? '' : executorFilter === 'ME' ? 'ME' : executorFilter === 'UNASSIGNED' ? 'UNASSIGNED' : String(executorFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setExecutorFilter(null)
                    } else if (value === 'ME') {
                      setExecutorFilter('ME')
                    } else if (value === 'UNASSIGNED') {
                      setExecutorFilter('UNASSIGNED')
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setExecutorFilter(numValue)
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">全部</option>
                  <option value="UNASSIGNED">未分配</option>
                  {currentUserId && (
                    <option value="ME">我</option>
                  )}
                  {members?.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username || member.user?.username || `用户${member.user_id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 标签筛选 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  标签
                </label>
                <select
                  value={tagFilter === null ? '' : String(tagFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setTagFilter(null)
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setTagFilter(numValue)
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">全部</option>
                  {projectTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 优先级筛选 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  优先级
                </label>
                <select
                  value={priorityFilter === null ? '' : priorityFilter === 'ALL' ? 'ALL' : priorityFilter === 'NONE' ? 'NONE' : String(priorityFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setPriorityFilter(null)
                    } else if (value === 'ALL') {
                      setPriorityFilter('ALL')
                    } else if (value === 'NONE') {
                      setPriorityFilter('NONE')
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setPriorityFilter(numValue)
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">全部</option>
                  <option value="ALL">有优先级</option>
                  <option value="0">🔴 最高</option>
                  <option value="1">🟠 高</option>
                  <option value="2">🟡 中</option>
                  <option value="3">🟢 低</option>
                  <option value="NONE">无优先级</option>
                </select>
              </div>

              {/* 日期范围筛选 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  日期范围
                </label>
                <DateRangeFilter
                  value={dateRange}
                  onChange={setDateRange}
                />
                <p className="mt-1 text-xs text-foreground-tertiary">
                  不选择日期范围则导出所有符合条件的待办
                </p>
              </div>
            </div>

            <div className="rounded-md p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="text-sm text-foreground">
                可导出待办数量: <span className="font-semibold">{filteredTodos.length}</span>
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
                disabled={filteredTodos.length === 0}
              >
                预览
              </Button>
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={filteredTodos.length === 0}
              >
                导出
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">预览内容</h3>
              <div className="flex items-center gap-2">
                {/* 预览模式切换 */}
                <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('rendered')}
                    className={clsx(
                      'px-3 py-1 text-xs font-medium transition-colors',
                      previewMode === 'rendered'
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-foreground-secondary hover:bg-surface-hover'
                    )}
                  >
                    渲染
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('source')}
                    className={clsx(
                      'px-3 py-1 text-xs font-medium transition-colors',
                      previewMode === 'source'
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-foreground-secondary hover:bg-surface-hover'
                    )}
                  >
                    源码
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  返回设置
                </Button>
              </div>
            </div>

            <div 
              className="rounded-md border border-border p-4 max-h-[500px] overflow-y-auto"
              style={{ 
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {previewMarkdown ? (
                previewMode === 'rendered' ? (
                  // 渲染后的Markdown预览
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
                        // 自定义代码块样式，支持 # 和 @ 的颜色
                        code: ({ node, inline, ...props }: any) => {
                          if (inline) {
                            const codeText = typeof props.children === 'string' ? props.children : ''
                            // 检查是否是 #用户名 或 @用户名
                            if (codeText.startsWith('#') || codeText.startsWith('@')) {
                              const colorClass = codeText.startsWith('#')
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-blue-600 dark:text-blue-400'
                              return (
                                <code 
                                  className={clsx('bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-medium', colorClass)} 
                                  {...props} 
                                />
                              )
                            }
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
                        // 自定义列表项，支持checkbox样式
                        li: ({ node, children, ...props }: any) => {
                          // 检查是否是checkbox格式的列表项
                          const textContent = typeof children === 'string' 
                            ? children 
                            : Array.isArray(children) 
                              ? children.map((c: any) => typeof c === 'string' ? c : c?.props?.children || '').join('')
                              : ''
                          
                          // 匹配带编号的格式：1. [ ] 或 1. [x] 或 [ ] 或 [x]
                          // 支持：数字. [x/ ] 或 [x/ ]（注意点后面有空格）
                          const checkboxMatch = textContent.match(/^(\d+\.\s)?\[([ x])\]\s*(.*)$/)
                          
                          if (checkboxMatch) {
                            const numberPrefix = checkboxMatch[1] || '' // 可能是 "1. " 或 ""
                            const isChecked = checkboxMatch[2] === 'x'
                            const content = checkboxMatch[3]
                            
                            // 处理内容中的 # 和 @ 高亮
                            const processContent = (text: string) => {
                              const parts: any[] = []
                              let lastIndex = 0
                              
                              // 匹配 #用户名 或 @用户名（用户名可以是中文、英文、数字、下划线等）
                              const regex = /([#@])([\w\u4e00-\u9fa5]+)/g
                              let match
                              
                              while ((match = regex.exec(text)) !== null) {
                                // 添加匹配前的文本
                                if (match.index > lastIndex) {
                                  parts.push(text.substring(lastIndex, match.index))
                                }
                                
                                // 添加高亮的 # 或 @ 部分
                                const symbol = match[1]
                                const name = match[2]
                                const colorClass = symbol === '#' 
                                  ? 'text-purple-600 dark:text-purple-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                                
                                parts.push(
                                  <span key={match.index} className={colorClass}>
                                    {symbol}{name}
                                  </span>
                                )
                                
                                lastIndex = regex.lastIndex
                              }
                              
                              // 添加剩余的文本
                              if (lastIndex < text.length) {
                                parts.push(text.substring(lastIndex))
                              }
                              
                              return parts.length > 0 ? parts : text
                            }
                            
                            return (
                              <li className="my-1 list-none" {...props}>
                                <div className="flex items-start gap-2">
                                  {numberPrefix && (
                                    <span className="text-foreground-secondary font-medium mt-0.5 flex-shrink-0">
                                      {numberPrefix}
                                    </span>
                                  )}
                                  <span 
                                    className={clsx(
                                      'inline-flex items-center justify-center w-4 h-4 mt-0.5 flex-shrink-0',
                                      'border-2 rounded-sm',
                                      isChecked 
                                        ? 'bg-blue-600 border-blue-600' 
                                        : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500'
                                    )}
                                  >
                                    {isChecked && (
                                      <svg 
                                        className="w-3 h-3 text-white" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor" 
                                        strokeWidth={3}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </span>
                                  <span className="flex-1">{processContent(content)}</span>
                                </div>
                              </li>
                            )
                          }
                          
                          // 普通列表项
                          return <li className="my-1" {...props}>{children}</li>
                        },
                        // 自定义段落样式，支持高亮 # 和 @
                        p: ({ node, children, ...props }: any) => {
                          // 将文本内容转换为带高亮的元素
                          const processText = (text: string) => {
                            if (typeof text !== 'string') return text
                            
                            // 匹配 #用户名 和 @用户名
                            const parts: any[] = []
                            let lastIndex = 0
                            
                            // 匹配 #用户名 或 @用户名（用户名可以是中文、英文、数字、下划线等）
                            const regex = /([#@])([\w\u4e00-\u9fa5]+)/g
                            let match
                            
                            while ((match = regex.exec(text)) !== null) {
                              // 添加匹配前的文本
                              if (match.index > lastIndex) {
                                parts.push(text.substring(lastIndex, match.index))
                              }
                              
                                // 添加高亮的 # 或 @ 部分
                                const symbol = match[1]
                                const name = match[2]
                                const colorClass = symbol === '#' 
                                  ? 'text-purple-600 dark:text-purple-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                                
                                parts.push(
                                  <span key={match.index} className={colorClass}>
                                    {symbol}{name}
                                  </span>
                                )
                              
                              lastIndex = regex.lastIndex
                            }
                            
                            // 添加剩余的文本
                            if (lastIndex < text.length) {
                              parts.push(text.substring(lastIndex))
                            }
                            
                            return parts.length > 0 ? parts : text
                          }
                          
                          // 处理 children，如果是字符串则处理，否则递归处理
                          const processedChildren = typeof children === 'string' 
                            ? processText(children)
                            : Array.isArray(children)
                              ? children.map((child: any, index: number) => {
                                  if (typeof child === 'string') {
                                    return <span key={index}>{processText(child)}</span>
                                  }
                                  return child
                                })
                              : children
                          
                          return <p className="my-2" {...props}>{processedChildren}</p>
                        },
                      }}
                    >
                      {previewMarkdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // 原始Markdown源码预览（带颜色高亮）
                  <div
                    className="text-sm text-foreground whitespace-pre-wrap font-mono"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                      fontSize: '13px',
                      lineHeight: '1.6',
                    }}
                  >
                    {(() => {
                      // 处理源码，高亮显示 # 和 @
                      const processSource = (text: string) => {
                        const parts: any[] = []
                        let lastIndex = 0
                        
                        // 匹配 #用户名 或 @用户名（用户名可以是中文、英文、数字、下划线等）
                        const regex = /([#@])([\w\u4e00-\u9fa5]+)/g
                        let match
                        
                        while ((match = regex.exec(text)) !== null) {
                          // 添加匹配前的文本
                          if (match.index > lastIndex) {
                            parts.push(text.substring(lastIndex, match.index))
                          }
                          
                          // 添加高亮的 # 或 @ 部分
                          const symbol = match[1]
                          const name = match[2]
                          const colorClass = symbol === '#' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-blue-600 dark:text-blue-400'
                          
                          parts.push(
                            <span key={match.index} className={colorClass}>
                              {symbol}{name}
                            </span>
                          )
                          
                          lastIndex = regex.lastIndex
                        }
                        
                        // 添加剩余的文本
                        if (lastIndex < text.length) {
                          parts.push(text.substring(lastIndex))
                        }
                        
                        return parts.length > 0 ? parts : text
                      }
                      
                      return processSource(previewMarkdown)
                    })()}
                  </div>
                )
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
                disabled={filteredTodos.length === 0}
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
