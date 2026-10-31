/** Browser-local calendar dates become a UTC half-open range (DST-safe). */
export function feedbackDateBoundary(day: string, endExclusive = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined
  const [year, month, date] = day.split('-').map(Number)
  const value = new Date(year, month - 1, date)
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== date) return undefined
  if (endExclusive) value.setDate(value.getDate() + 1)
  return value.toISOString()
}
export function feedbackSearchOptions(q: string, status: string, from: string, to: string, dateField: 'created' | 'updated') {
  return { q: q.trim() || undefined, status: status === 'all' ? undefined : status,
    dateFrom: feedbackDateBoundary(from), dateTo: feedbackDateBoundary(to, true), dateField }
}
