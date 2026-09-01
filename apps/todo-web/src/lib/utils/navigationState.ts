export interface RouteFromState {
  from: string
}

export function buildRouteFromState(path: string): RouteFromState {
  return { from: path }
}

export function getRouteFromState(state: unknown): string | null {
  if (!state || typeof state !== 'object') {
    return null
  }

  const from = (state as { from?: unknown }).from
  if (typeof from !== 'string' || !from.startsWith('/')) {
    return null
  }

  return from
}
