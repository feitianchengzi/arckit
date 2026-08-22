export interface CursorEvent {
  id?: number
}

export interface ProjectEventIdentity extends CursorEvent {
  event?: string
  schema_version?: number
}

export interface CursorAcknowledgement {
  id: number
  complete: boolean
}

export function orderedEventsAfterCursor<T extends CursorEvent>(cursor: number, events: T[]): T[] {
  const byId = new Map<number, T>()
  for (const event of events) {
    const id = Number(event?.id)
    if (!Number.isSafeInteger(id) || id <= cursor) continue
    byId.set(id, event)
  }
  return [...byId.entries()].sort(([left], [right]) => left - right).map(([, event]) => event)
}

export function isCursorExpiredCode(value: unknown): boolean {
  return value === 'EVENT_CURSOR_EXPIRED'
}

export function consumeAcknowledgedPrefix(currentCursor: number, acknowledgements: CursorAcknowledgement[]): number {
  let cursor = currentCursor
  while (acknowledgements[0]?.complete) {
    cursor = Math.max(cursor, acknowledgements.shift()!.id)
  }
  return cursor
}

const knownInvalidationPrefixes = [
  'task.',
  'task_attachment.',
  'tag.',
  'project_member.',
  'project_invitation.',
  'project.',
]

export function requiresFullProjectInvalidation(payload: ProjectEventIdentity): boolean {
  if (payload.event === 'system.resync_required') return true
  const id = Number(payload.id)
  if (!Number.isSafeInteger(id) || id <= 0) return false
  if (payload.schema_version !== undefined && payload.schema_version !== 1) return true
  return !knownInvalidationPrefixes.some((prefix) => payload.event?.startsWith(prefix))
}
