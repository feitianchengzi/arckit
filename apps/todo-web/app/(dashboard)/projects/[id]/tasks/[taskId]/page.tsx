import { TaskDetailPageClient } from './TaskDetailPageClient'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export default function TaskDetailPage() {
  return <TaskDetailPageClient />
}
