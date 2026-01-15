/**
 * 任务详情页面（服务端组件包装器）
 * 用于静态导出：导出 generateStaticParams
 */

import { TaskDetailPageClient } from './TaskDetailPageClient'

// 允许动态参数（即使构建时不存在该 ID，也允许访问）
export const dynamicParams = true

// 返回空数组 = 不预生成任何路径，依赖客户端渲染 + OSS 404 重定向
export function generateStaticParams() {
  return []
}

export default function TaskDetailPage() {
  return <TaskDetailPageClient />
}
