import { describe, expect, it } from 'vitest'
import {
  consumeAcknowledgedPrefix,
  isCursorExpiredCode,
  orderedEventsAfterCursor,
  requiresFullProjectInvalidation,
} from './projectEventStream'

describe('project event recovery', () => {
  it('orders, deduplicates, and ignores events already covered by the cursor', () => {
    const events = orderedEventsAfterCursor(40, [
      { id: 42, event: 'task.created' },
      { id: 39, event: 'task.updated' },
      { id: 41, event: 'task.updated' },
      { id: 42, event: 'task.created' },
    ])

    expect(events.map((event) => event.id)).toEqual([41, 42])
  })

  it('recognizes only the stable replay-expiry code as a full-resync condition', () => {
    expect(isCursorExpiredCode('EVENT_CURSOR_EXPIRED')).toBe(true)
    expect(isCursorExpiredCode('INTERNAL_ERROR')).toBe(false)
    expect(isCursorExpiredCode(undefined)).toBe(false)
  })

  it('does not advance past an earlier invalidation that has not completed', () => {
    const acknowledgements = [
      { id: 41, complete: false },
      { id: 42, complete: true },
    ]
    expect(consumeAcknowledgedPrefix(40, acknowledgements)).toBe(40)
    acknowledgements[0].complete = true
    expect(consumeAcknowledgedPrefix(40, acknowledgements)).toBe(42)
    expect(acknowledgements).toEqual([])
  })

  it('fails closed for unknown durable events and unsupported schemas', () => {
    expect(requiresFullProjectInvalidation({ id: 43, schema_version: 1, event: 'milestone.created' })).toBe(true)
    expect(requiresFullProjectInvalidation({ id: 44, schema_version: 2, event: 'task.updated' })).toBe(true)
    expect(requiresFullProjectInvalidation({ id: 45, schema_version: 1, event: 'task.updated' })).toBe(false)
    expect(requiresFullProjectInvalidation({ event: 'system.connected' })).toBe(false)
  })
})
