import { ProjectDetailPageClient } from './ProjectDetailPageClient'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export default function ProjectDetailPage() {
  return <ProjectDetailPageClient />
}
