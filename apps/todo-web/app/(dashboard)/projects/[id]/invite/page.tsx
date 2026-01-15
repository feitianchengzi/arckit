import { InviteMemberPageClient } from './InviteMemberPageClient'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export default function InviteMemberPage() {
  return <InviteMemberPageClient />
}
