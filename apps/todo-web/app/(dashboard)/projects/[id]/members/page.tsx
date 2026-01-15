/**
 * 项目成员管理页面（服务端组件包装器）
 * 
 * 注意：此页面使用客户端渲染（CSR），不预生成静态 HTML
 * 原因：项目 ID 是动态生成的，构建时无法知道所有 ID
 */

import { ProjectMembersPageClient } from './ProjectMembersPageClient'

// 允许动态参数（即使构建时不存在该 ID，也允许访问）
export const dynamicParams = true

// 返回空数组 = 不预生成任何路径，依赖客户端渲染 + OSS 404 重定向
export function generateStaticParams() {
  return []
}

export default function ProjectMembersPage() {
  return <ProjectMembersPageClient />
}