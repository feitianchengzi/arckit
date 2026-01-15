import { NewTaskPageClient } from './NewTaskPageClient'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export default function NewTaskPage() {
  return <NewTaskPageClient />
}
