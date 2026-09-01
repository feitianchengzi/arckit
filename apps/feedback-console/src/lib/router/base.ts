function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  if (trimmed === '/') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function splitPathSuffix(path: string): { pathname: string; suffix: string } {
  const hashIndex = path.indexOf('#')
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const searchIndex = withoutHash.indexOf('?')
  const search = searchIndex >= 0 ? withoutHash.slice(searchIndex) : ''
  const pathname = searchIndex >= 0 ? withoutHash.slice(0, searchIndex) : withoutHash

  return {
    pathname: pathname || '/',
    suffix: `${search}${hash}`,
  }
}

function stripBase(pathname: string, base: string): string {
  if (base === '/') return pathname
  if (pathname === base) return '/'
  if (pathname.startsWith(`${base}/`)) {
    const stripped = pathname.slice(base.length)
    return stripped || '/'
  }
  return pathname
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

export function normalizeInAppPath(rawPath?: string | null, fallbackPath = '/'): string {
  const fallback = normalizePath(fallbackPath)
  const raw = (rawPath || '').trim()

  if (!raw) return fallback

  let candidate = raw
  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(raw, window.location.origin)
      if (parsed.origin !== window.location.origin) return fallback
      candidate = `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      // Ignore parse errors and continue with raw input.
    }
  }

  const { pathname, suffix } = splitPathSuffix(candidate)
  const normalizedPathname = normalizePath(pathname)
  const base = resolveRouterBase()
  const inAppPathname = stripBase(normalizedPathname, base)

  return `${inAppPathname}${suffix}`
}
