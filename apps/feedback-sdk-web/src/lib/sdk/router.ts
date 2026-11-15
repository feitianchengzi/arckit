function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  if (trimmed === '/') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function resolveRouterBase(): string {
  const raw = (import.meta.env.VITE_PUBLIC_BASE || '/').trim()
  if (!raw) return '/'
  if (raw === '/') return '/'
  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

export function buildAppPath(path: string): string {
  const normalizedPath = normalizePath(path)
  const base = resolveRouterBase()
  if (base === '/') return normalizedPath
  if (normalizedPath === '/') return base
  return `${base}${normalizedPath}`
}
