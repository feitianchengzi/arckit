import { ProjectMembersPageClient } from './ProjectMembersPageClient'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export default function ProjectMembersPage() {
  return <ProjectMembersPageClient />
}
