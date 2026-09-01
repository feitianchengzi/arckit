export interface TaskDateRange {
  startDate: string | null
  endDate: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_TASK_RANGE_DAYS = 30
const MAX_TASK_TREE_RANGE_DAYS = 100

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(dateString: string): Date | null {
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function calendarDayDiff(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((endUtc - startUtc) / DAY_MS)
}

function toUtcBoundary(dateString: string, endOfDay = false): string {
  return `${dateString}T${endOfDay ? '23:59:59' : '00:00:00'}Z`
}

export function getDefaultTaskDateRange(now = new Date()): TaskDateRange {
  const end = new Date(now)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)

  const start = addLocalDays(end, -DEFAULT_TASK_RANGE_DAYS)

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  }
}

export function normalizeTaskDateRange(range?: TaskDateRange | null): TaskDateRange {
  const fallback = getDefaultTaskDateRange()
  if (!range?.startDate && !range?.endDate) return fallback

  let start = range.startDate ? parseLocalDate(range.startDate) : null
  let end = range.endDate ? parseLocalDate(range.endDate) : null

  if (!start && !end) return fallback
  if (start && !end) {
    end = addLocalDays(start, DEFAULT_TASK_RANGE_DAYS)
  }
  if (!start && end) {
    start = addLocalDays(end, -DEFAULT_TASK_RANGE_DAYS)
  }
  if (!start || !end) return fallback

  if (start.getTime() > end.getTime()) {
    const previousStart = start
    start = end
    end = previousStart
  }

  if (calendarDayDiff(start, end) > MAX_TASK_TREE_RANGE_DAYS) {
    start = addLocalDays(end, -MAX_TASK_TREE_RANGE_DAYS)
  }

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
  }
}

export function taskDateRangeToTimeFilters(range?: TaskDateRange | null) {
  const normalized = normalizeTaskDateRange(range)

  return {
    dateRange: normalized,
    startTime: toUtcBoundary(normalized.startDate!, false),
    endTime: toUtcBoundary(normalized.endDate!, true),
  }
}

export function getDefaultTaskTimeFilters() {
  return taskDateRangeToTimeFilters(getDefaultTaskDateRange())
}

export function isSameTaskDateRange(left: TaskDateRange, right: TaskDateRange): boolean {
  return left.startDate === right.startDate && left.endDate === right.endDate
}
