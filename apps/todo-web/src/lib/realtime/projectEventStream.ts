export interface CursorEvent {
  id?: number
}

export interface ProjectEventIdentity extends CursorEvent {
  event?: string
  schema_version?: number
  data?: unknown
}

export interface CursorAcknowledgement {
  id: number
  complete: boolean
}

export type ProjectRealtimeHandshake =
  | { mode: 'legacy'; latestEventId: 0 }
  | { mode: 'resumable'; latestEventId: number }

export type ProjectRealtimeRecoveryStart =
  | { mode: 'legacy'; action: 'legacy_snapshot'; latestEventId: 0; cursor: 0 }
  | { mode: 'resumable'; action: 'initial_snapshot' | 'cursor_ahead' | 'replay'; latestEventId: number; cursor: number }

export function classifyProjectRealtimeHandshake(payload: ProjectEventIdentity): ProjectRealtimeHandshake {
  const data = payload?.data
  const hasData = data !== null && typeof data === 'object'
  const hasLatest = hasData && Object.prototype.hasOwnProperty.call(data, 'latest_event_id')
  const latest = Number(hasData ? (data as { latest_event_id?: unknown }).latest_event_id : undefined)

  if (payload?.schema_version === 1 && hasLatest && Number.isSafeInteger(latest) && latest >= 0) {
    return { mode: 'resumable', latestEventId: latest }
  }
  if ((payload?.schema_version === undefined || payload?.schema_version === null) && !hasLatest) {
    return { mode: 'legacy', latestEventId: 0 }
  }
  throw new Error(`Unsupported Workshop realtime handshake: ${String(payload?.schema_version)}`)
}

export function planProjectRealtimeRecovery(
  payload: ProjectEventIdentity,
  readPersistedCursor: () => number,
): ProjectRealtimeRecoveryStart {
  const handshake = classifyProjectRealtimeHandshake(payload)
  if (handshake.mode === 'legacy') {
    return { mode: 'legacy', action: 'legacy_snapshot', latestEventId: 0, cursor: 0 }
  }

  const value = Number(readPersistedCursor())
  const cursor = Number.isSafeInteger(value) && value > 0 ? value : 0
  const action = cursor === 0
    ? 'initial_snapshot'
    : cursor > handshake.latestEventId
      ? 'cursor_ahead'
      : 'replay'
  return { ...handshake, action, cursor }
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
