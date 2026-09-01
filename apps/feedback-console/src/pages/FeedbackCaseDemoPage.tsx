import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkIcon, PaperClipIcon, SearchIcon } from '@/components/ui/icons'

type CaseStage = 'received' | 'accepted' | 'task' | 'building' | 'released'
type EventKind = 'feedback' | 'message' | 'system' | 'task'

interface CaseEvent {
  id: string
  kind: EventKind
  actor?: string
  body: string
  at: string
  attachment?: string
}

interface FeedbackCase {
  id: string
  shortId: string
  title: string
  summary: string
  reporter: string
  platform: string
  priority: 'P1' | 'P2' | 'P3'
  stage: CaseStage
  taskId?: string
  owner?: string
  unread?: boolean
  updatedAt: string
  events: CaseEvent[]
}

const stages: Array<{ id: CaseStage; label: string; description: string }> = [
  { id: 'received', label: '已收到', description: '确认用户反馈已进入队列' },
  { id: 'accepted', label: '已受理', description: '完成初步判断，明确跟进人' },
  { id: 'task', label: '已建任务', description: '已关联到研发计划或待办' },
  { id: 'building', label: '开发中', description: '研发正在处理并同步进展' },
  { id: 'released', label: '已上线', description: '已交付并完成用户回访' },
]

const initialCases: FeedbackCase[] = [
  {
    id: 'case-492',
    shortId: '#FB-492',
    title: '导入 200 张照片后页面明显卡顿',
    summary: '相册导入完成后，滚动和筛选都会停顿约 2–3 秒。',
    reporter: '林科院资源所 · iForest 客户端',
    platform: 'macOS 15.5 · v2.8.0',
    priority: 'P1',
    stage: 'building',
    taskId: 'TODO-482',
    owner: 'Wang',
    unread: true,
    updatedAt: '12 分钟前',
    events: [
      {
        id: 'feedback-1',
        kind: 'feedback',
        actor: '林科院资源所',
        body: '导入 200 张照片后，在相册列表滚动和切换筛选条件时都会停顿 2–3 秒。M2 Max 和 M1 Air 都能复现，预期是可以连续滚动。',
        at: '今天 10:18',
        attachment: 'screen-recording.mov · 8.4 MB',
      },
      {
        id: 'system-1',
        kind: 'system',
        body: '案件已受理，由 Wang 负责跟进',
        at: '今天 10:32',
      },
      {
        id: 'task-1',
        kind: 'task',
        body: '已关联研发任务 TODO-482：优化大批量照片列表的虚拟滚动',
        at: '今天 11:05',
      },
      {
        id: 'message-1',
        kind: 'message',
        actor: 'Wang · 研发',
        body: '我们已经定位到缩略图预加载会阻塞主线程，正在将列表切换为分段渲染。本周会给你一个可验证的测试版本。',
        at: '今天 14:26',
      },
    ],
  },
  {
    id: 'case-487',
    shortId: '#FB-487',
    title: '桌面端窗口拖动后圆角出现白边',
    summary: '外接显示器上拖动窗口，顶部偶发一圈白色边缘。',
    reporter: '飞天橙 · 个人项目',
    platform: 'Windows 11 · v2.8.0',
    priority: 'P2',
    stage: 'accepted',
    owner: 'Lydia',
    updatedAt: '1 小时前',
    events: [
      {
        id: 'feedback-2',
        kind: 'feedback',
        actor: '飞天橙',
        body: '窗口从主屏拖到外接显示器后，顶部圆角附近会闪一下白边；最大化再恢复有时能消失。',
        at: '今天 09:47',
        attachment: 'window-edge.png · 326 KB',
      },
      {
        id: 'system-2',
        kind: 'system',
        body: '案件已受理，等待复现结论',
        at: '今天 10:03',
      },
    ],
  },
  {
    id: 'case-476',
    shortId: '#FB-476',
    title: '希望任务列表支持批量移动',
    summary: '选中多条任务后，想一次性移动到另一个项目或清单。',
    reporter: '星图工作室',
    platform: 'Web · Chrome 138',
    priority: 'P3',
    stage: 'released',
    taskId: 'TODO-451',
    owner: 'Mika',
    updatedAt: '昨天',
    events: [
      {
        id: 'feedback-3',
        kind: 'feedback',
        actor: '星图工作室',
        body: '整理项目时需要把十几条任务一起移到新清单，现在只能一条一条操作，容易漏掉。',
        at: '7 月 24 日 16:40',
      },
      {
        id: 'task-3',
        kind: 'task',
        body: '已关联研发任务 TODO-451：任务多选与批量移动',
        at: '7 月 25 日 09:10',
      },
      {
        id: 'message-3',
        kind: 'message',
        actor: 'Mika · 产品',
        body: '批量移动已经上线到 Web 端。你可以在列表里按住 Shift 多选，再从底部操作栏选择目标清单。',
        at: '昨天 15:18',
      },
      {
        id: 'system-3',
        kind: 'system',
        body: '案件已上线，等待用户回访',
        at: '昨天 15:18',
      },
    ],
  },
]

const stageStyles: Record<CaseStage, string> = {
  received: 'bg-foreground-secondary/10 text-foreground-secondary',
  accepted: 'bg-warning-lighter text-warning',
  task: 'bg-primary-lighter text-primary',
  building: 'bg-primary-lighter text-primary',
  released: 'bg-success-lighter text-success',
}

function nextStageLabel(stage: CaseStage) {
  const nextIndex = stages.findIndex((item) => item.id === stage) + 1
  const next = stages[nextIndex]
  return next ? `推进为「${next.label}」` : '已完成闭环'
}

function nowLabel() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

export default function FeedbackCaseDemoPage() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<FeedbackCase[]>(initialCases)
  const [selectedId, setSelectedId] = useState(initialCases[0].id)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')

  const visibleCases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return cases
    return cases.filter((item) =>
      [item.title, item.shortId, item.summary, item.reporter].join(' ').toLowerCase().includes(normalizedQuery),
    )
  }, [cases, query])

  const selectedCase = cases.find((item) => item.id === selectedId) ?? cases[0]
  const currentStageIndex = stages.findIndex((item) => item.id === selectedCase.stage)
  const canAdvance = currentStageIndex < stages.length - 1

  const updateSelectedCase = (updater: (item: FeedbackCase) => FeedbackCase) => {
    setCases((current) => current.map((item) => (item.id === selectedId ? updater(item) : item)))
  }

  const handleAdvance = () => {
    if (!canAdvance) return
    const next = stages[currentStageIndex + 1]

    updateSelectedCase((item) => ({
      ...item,
      stage: next.id,
      taskId: next.id === 'task' && !item.taskId ? 'TODO-493' : item.taskId,
      owner: item.owner ?? 'Mika',
      unread: false,
      updatedAt: '刚刚',
      events: [
        ...item.events,
        {
          id: `system-${Date.now()}`,
          kind: 'system',
          body:
            next.id === 'task' && !item.taskId
              ? `案件已建立研发任务 TODO-493，并推进为「${next.label}」`
              : `案件已推进为「${next.label}」`,
          at: `今天 ${nowLabel()}`,
        },
      ],
    }))
  }

  const handleSend = () => {
    const content = draft.trim()
    if (!content) return

    updateSelectedCase((item) => ({
      ...item,
      unread: false,
      updatedAt: '刚刚',
      events: [
        ...item.events,
        {
          id: `message-${Date.now()}`,
          kind: 'message',
          actor: '你 · 反馈负责人',
          body: content,
          at: `今天 ${nowLabel()}`,
        },
      ],
    }))
    setDraft('')
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-3 lg:h-[calc(100vh-4.5rem)] lg:min-h-0 lg:overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-divider pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground-tertiary">
            <span>反馈案件</span>
            <span className="rounded bg-primary-lighter px-1.5 py-0.5 font-semibold tracking-[0.12em] text-primary">DEMO</span>
            <span className="text-divider">/</span>
            <span className="truncate">iForest 客户端</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">从反馈到交付，一条线看清楚</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-foreground-secondary">3 个开放案件</span>
          <button
            type="button"
            onClick={() => navigate('/feedbacks')}
            className="rounded-lg border border-divider px-3 py-1.5 font-medium text-foreground-secondary transition-colors hover:border-primary/40 hover:text-primary"
          >
            返回管理台
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden border border-divider bg-surface lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-divider bg-surface-elevated lg:border-b-0 lg:border-r">
          <div className="border-b border-divider p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">案件队列</span>
              <span className="text-xs text-foreground-tertiary">按最近更新</span>
            </div>
            <label className="flex h-9 items-center gap-2 rounded-md border border-divider bg-surface px-2.5 text-foreground-secondary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索反馈、编号或客户"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-tertiary"
              />
            </label>
          </div>

          <div className="max-h-[292px] divide-y divide-divider overflow-y-auto lg:max-h-none lg:flex-1">
            {visibleCases.map((item) => {
              const isSelected = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full border-l-2 px-3 py-3 text-left transition-colors ${
                    isSelected ? 'border-primary bg-primary-lighter/40' : 'border-transparent hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.unread ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground-tertiary">{item.shortId}</span>
                        <span className="shrink-0 text-xs text-foreground-tertiary">{item.updatedAt}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground">{item.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-foreground-secondary">{item.reporter}</span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${stageStyles[item.stage]}`}>
                          {stages.find((stage) => stage.id === item.stage)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            {visibleCases.length === 0 && <div className="px-3 py-8 text-center text-sm text-foreground-tertiary">没有匹配的案件</div>}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-surface">
          <div className="border-b border-divider px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-primary">{selectedCase.shortId}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${stageStyles[selectedCase.stage]}`}>
                    {stages[currentStageIndex].label}
                  </span>
                  <span className="rounded bg-foreground-secondary/10 px-1.5 py-0.5 text-xs font-medium text-foreground-secondary">{selectedCase.priority}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{selectedCase.title}</h2>
                <p className="mt-1 text-sm text-foreground-secondary">{selectedCase.summary}</p>
              </div>
              <button
                type="button"
                disabled={!canAdvance}
                onClick={handleAdvance}
                className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-foreground-tertiary/30"
              >
                {nextStageLabel(selectedCase.stage)}
              </button>
            </div>

            <div className="mt-4 grid gap-3 border-t border-divider pt-3 text-xs text-foreground-secondary sm:grid-cols-3">
              <div>
                <span className="block text-foreground-tertiary">反馈来源</span>
                <span className="mt-1 block font-medium text-foreground">{selectedCase.reporter}</span>
              </div>
              <div>
                <span className="block text-foreground-tertiary">运行环境</span>
                <span className="mt-1 block font-medium text-foreground">{selectedCase.platform}</span>
              </div>
              <div>
                <span className="block text-foreground-tertiary">跟进人</span>
                <span className="mt-1 block font-medium text-foreground">{selectedCase.owner ?? '待分配'}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-divider px-4 py-3 sm:px-5">
            <div className="grid grid-cols-5 gap-1">
              {stages.map((stage, index) => {
                const completed = index <= currentStageIndex
                const active = index === currentStageIndex
                return (
                  <div key={stage.id} className="min-w-0">
                    <div className="flex items-center">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${completed ? 'bg-primary text-white' : 'bg-foreground-secondary/10 text-foreground-tertiary'}`}>
                        {completed ? '✓' : index + 1}
                      </span>
                      {index < stages.length - 1 && <span className={`h-px flex-1 ${index < currentStageIndex ? 'bg-primary' : 'bg-divider'}`} />}
                    </div>
                    <p className={`mt-1.5 truncate text-[11px] font-medium ${active ? 'text-primary' : 'text-foreground-tertiary'}`}>{stage.label}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-foreground-secondary">
              当前阶段：<span className="font-medium text-foreground">{stages[currentStageIndex].label}</span>
              <span className="mx-1.5 text-divider">·</span>
              {stages[currentStageIndex].description}
              {selectedCase.taskId && (
                <span className="ml-2 inline-flex items-center gap-1 font-medium text-primary">
                  <LinkIcon className="h-3.5 w-3.5" />
                  {selectedCase.taskId}
                </span>
              )}
            </p>
          </div>

          <div className="min-h-[360px] flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <div className="mx-auto max-w-3xl space-y-4">
              {selectedCase.events.map((event) => {
                if (event.kind === 'system' || event.kind === 'task') {
                  return (
                    <div key={event.id} className="flex items-center gap-3 py-1">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${event.kind === 'task' ? 'bg-primary' : 'bg-foreground-tertiary'}`} />
                      <div className="h-px flex-1 bg-divider" />
                      <p className="shrink-0 text-xs text-foreground-secondary">{event.body}</p>
                      <span className="shrink-0 text-xs text-foreground-tertiary">{event.at}</span>
                    </div>
                  )
                }

                const isFeedback = event.kind === 'feedback'
                return (
                  <article key={event.id} className={`border-l-2 px-4 py-3 ${isFeedback ? 'border-primary bg-primary-lighter/35' : 'border-divider bg-surface-elevated'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{event.actor}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${isFeedback ? 'bg-primary-lighter text-primary' : 'bg-foreground-secondary/10 text-foreground-secondary'}`}>
                          {isFeedback ? '用户原始反馈' : '跟进回复'}
                        </span>
                      </div>
                      <time className="shrink-0 text-xs text-foreground-tertiary">{event.at}</time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground-secondary">{event.body}</p>
                    {event.attachment && (
                      <div className="mt-3 inline-flex items-center gap-2 border border-divider bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground-secondary">
                        <PaperClipIcon className="h-3.5 w-3.5 text-primary" />
                        {event.attachment}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>

          <form
            className="border-t border-divider bg-surface-elevated px-4 py-3 sm:px-5"
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
          >
            <div className="mx-auto flex max-w-3xl gap-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault()
                    handleSend()
                  }
                }}
                rows={2}
                placeholder="同步给客户或团队的最新进展…"
                className="min-h-[64px] flex-1 resize-none border border-divider bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <div className="flex flex-col justify-between">
                <button type="button" className="flex h-8 w-8 items-center justify-center text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-primary" title="Demo 中未连接附件上传">
                  <PaperClipIcon className="h-4 w-4" />
                </button>
                <button type="submit" disabled={!draft.trim()} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-foreground-tertiary/30">
                  发送
                </button>
              </div>
            </div>
            <p className="mx-auto mt-1 max-w-3xl text-[11px] text-foreground-tertiary">⌘ / Ctrl + Enter 发送 · 此页面仅为交互 Demo，不会写入真实反馈数据</p>
          </form>
        </section>
      </div>
    </div>
  )
}
