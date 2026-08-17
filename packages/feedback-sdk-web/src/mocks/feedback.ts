export type FeedbackStatus = 'submitted' | 'analyzing' | 'reviewing' | 'developing' | 'released'

export const feedbackStatusFlow: FeedbackStatus[] = ['submitted', 'analyzing', 'reviewing', 'developing', 'released']

export interface FeedbackItem {
  id: string
  title: string
  summary: string
  createdAt: string
  etaText: string
  status: FeedbackStatus
  timeline: TimelineNode[]
}

export interface AIUnderstanding {
  painPoint: string
  expectation: string
  scenario: string
  confidence: number
}

export interface TimelineNode {
  status: FeedbackStatus
  title: string
  at: string
  note: string
}

export const mockUnderstanding: AIUnderstanding = {
  painPoint: '搜索历史记录平均需要 5-10 秒，频繁使用时会明显打断工作流程。',
  expectation: '搜索结果在 1 秒内返回，并保持当前结果准确性。',
  scenario: '用户每天会触发几十次搜索，在高频场景下体感延迟非常明显。',
  confidence: 0.88,
}

const coreFeedbackList: FeedbackItem[] = [
  {
    id: 'fb-20260201-01',
    title: '搜索速度优化',
    summary: '历史记录搜索过慢，用户在连续检索时效率下降。',
    createdAt: '2026-02-01 09:30',
    etaText: '预计本周上线',
    status: 'developing',
    timeline: [
      { status: 'submitted', title: '已提交', at: '2026-02-01 09:30', note: '用户提交反馈并附带截图。' },
      { status: 'analyzing', title: 'AI 分析中', at: '2026-02-01 09:31', note: 'AI 完成痛点、场景与期望提取。' },
      { status: 'reviewing', title: '开发评估中', at: '2026-02-01 10:05', note: '确认优先级为 P1，并进入实施队列。' },
      { status: 'developing', title: '开发中', at: '2026-02-02 15:10', note: '正在进行索引优化和缓存策略调整。' },
    ],
  },
  {
    id: 'fb-20260128-02',
    title: '添加暗黑模式',
    summary: '希望提供可切换的深色主题以降低夜间使用疲劳。',
    createdAt: '2026-01-28 14:10',
    etaText: '等待开发者审核',
    status: 'reviewing',
    timeline: [
      { status: 'submitted', title: '已提交', at: '2026-01-28 14:10', note: '用户提交主题切换建议。' },
      { status: 'analyzing', title: 'AI 分析中', at: '2026-01-28 14:11', note: 'AI 判断为中等复杂度，影响全局样式。' },
      { status: 'reviewing', title: '开发评估中', at: '2026-01-29 09:20', note: '产品与设计侧正在评估实现窗口。' },
    ],
  },
  {
    id: 'fb-20260120-03',
    title: '支持 PDF 导出',
    summary: '需要将当前页面一键导出为 PDF 用于对外分享。',
    createdAt: '2026-01-20 08:55',
    etaText: '已于 2026-01-25 上线',
    status: 'released',
    timeline: [
      { status: 'submitted', title: '已提交', at: '2026-01-20 08:55', note: '反馈包含导出模板示例。' },
      { status: 'analyzing', title: 'AI 分析中', at: '2026-01-20 08:57', note: '判断为高价值功能，建议优先处理。' },
      { status: 'reviewing', title: '开发评估中', at: '2026-01-20 10:30', note: '确认不影响核心流程，进入开发排期。' },
      { status: 'developing', title: '开发中', at: '2026-01-22 11:40', note: '完成导出布局与分页策略开发。' },
      { status: 'released', title: '已上线', at: '2026-01-25 16:20', note: '功能上线并通知反馈用户。' },
    ],
  },
]

const statusTitle: Record<FeedbackStatus, string> = {
  submitted: '已提交',
  analyzing: 'AI 分析中',
  reviewing: '开发评估中',
  developing: '开发中',
  released: '已上线',
}

const statusNote: Record<FeedbackStatus, string> = {
  submitted: '反馈已写入系统，等待 AI 解析。',
  analyzing: 'AI 正在提取痛点、场景与需求目标。',
  reviewing: '产品和开发正在评估优先级与排期。',
  developing: '功能已进入开发阶段，正在实现中。',
  released: '功能已上线，相关用户将收到通知。',
}

const phaseOrder: FeedbackStatus[] = ['submitted', 'analyzing', 'reviewing', 'developing', 'released']

function buildTimeline(status: FeedbackStatus, createdAt: string): TimelineNode[] {
  const endIndex = phaseOrder.indexOf(status)
  return phaseOrder.slice(0, endIndex + 1).map((phase, index) => ({
    status: phase,
    title: statusTitle[phase],
    at: index === 0 ? createdAt : `${createdAt} +${index}h`,
    note: statusNote[phase],
  }))
}

const extraFeedbackSeeds: Array<Omit<FeedbackItem, 'timeline'>> = [
  {
    id: 'fb-20260203-04',
    title: '优化移动端筛选交互',
    summary: '筛选面板在手机端展开层级较深，单手操作成本高。',
    createdAt: '2026-02-03 11:20',
    etaText: '预计下周上线',
    status: 'developing',
  },
  {
    id: 'fb-20260202-05',
    title: '增加反馈提交成功提示',
    summary: '提交后无明显提示，用户不确定反馈是否成功送达。',
    createdAt: '2026-02-02 16:40',
    etaText: '开发中',
    status: 'developing',
  },
  {
    id: 'fb-20260202-06',
    title: '支持附件预览',
    summary: '上传截图后希望直接在反馈卡片中预览缩略图。',
    createdAt: '2026-02-02 09:05',
    etaText: '等待设计确认',
    status: 'reviewing',
  },
  {
    id: 'fb-20260201-07',
    title: '新增多语言文案切换',
    summary: '海外用户希望能在英文和中文之间快速切换。',
    createdAt: '2026-02-01 18:10',
    etaText: '等待评估',
    status: 'reviewing',
  },
  {
    id: 'fb-20260131-08',
    title: '反馈详情支持复制链接',
    summary: '希望把某条反馈状态页链接分享给同事查看。',
    createdAt: '2026-01-31 13:50',
    etaText: 'AI 分析中',
    status: 'analyzing',
  },
  {
    id: 'fb-20260131-09',
    title: '缩短上传图片压缩时间',
    summary: '大图上传时等待时间较长，影响提交节奏。',
    createdAt: '2026-01-31 10:15',
    etaText: 'AI 分析中',
    status: 'analyzing',
  },
  {
    id: 'fb-20260130-10',
    title: '支持反馈内容草稿自动保存',
    summary: '输入中意外退出会导致内容丢失，希望自动保存草稿。',
    createdAt: '2026-01-30 21:30',
    etaText: '已提交，待分析',
    status: 'submitted',
  },
  {
    id: 'fb-20260130-11',
    title: '改进状态标签颜色对比度',
    summary: '部分状态色在强光环境下可读性不足。',
    createdAt: '2026-01-30 15:45',
    etaText: '已提交，待分析',
    status: 'submitted',
  },
  {
    id: 'fb-20260129-12',
    title: '支持按时间范围筛选反馈',
    summary: '希望在状态页按近 7 天、30 天快速筛选反馈记录。',
    createdAt: '2026-01-29 12:00',
    etaText: '开发评估中',
    status: 'reviewing',
  },
  {
    id: 'fb-20260128-13',
    title: '已上线反馈增加高亮',
    summary: '希望已上线项更明显，便于快速识别落地成果。',
    createdAt: '2026-01-28 08:35',
    etaText: '已于 2026-02-01 上线',
    status: 'released',
  },
  {
    id: 'fb-20260127-14',
    title: '优化卡片密度',
    summary: '状态列表卡片在大屏幕下信息密度偏低，滚动较多。',
    createdAt: '2026-01-27 20:10',
    etaText: '已于 2026-01-31 上线',
    status: 'released',
  },
  {
    id: 'fb-20260127-15',
    title: '反馈详情补充预计上线时间字段',
    summary: '希望详情页能显示预计上线时间，方便预期管理。',
    createdAt: '2026-01-27 09:25',
    etaText: '预计本周五上线',
    status: 'developing',
  },
]

const extraFeedbackList: FeedbackItem[] = extraFeedbackSeeds.map((seed) => ({
  ...seed,
  timeline: buildTimeline(seed.status, seed.createdAt),
}))

export const mockFeedbackList: FeedbackItem[] = [...coreFeedbackList, ...extraFeedbackList]
