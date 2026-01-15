/**
 * 项目详情页面（服务端组件包装器）
 * 
 * 注意：此页面使用客户端渲染（CSR），不预生成静态 HTML
 * 原因：项目 ID 是动态生成的，构建时无法知道所有 ID
 * 
 * 工作流程：
 * 1. 用户访问 /projects/123
 * 2. OSS 找不到对应 HTML（因为没预生成）
 * 3. OSS 404 重定向到 index.html（需要在 OSS 配置）
 * 4. Next.js 客户端路由接管，渲染 ProjectDetailPageClient
 * 5. 组件调用 API 获取项目数据
 */

import { ProjectDetailPageClient } from './ProjectDetailPageClient'

// 允许动态参数（即使构建时不存在该 ID，也允许访问）
export const dynamicParams = true

// 返回空数组 = 不预生成任何路径，依赖客户端渲染 + OSS 404 重定向
export function generateStaticParams() {
  return []
}

export default function ProjectDetailPage() {
  return <ProjectDetailPageClient />
}