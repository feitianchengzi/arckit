import Hashids from 'hashids'

const PROJECT_ID_SALT = 'todo-web-project'
const PROJECT_HASHIDS = new Hashids(PROJECT_ID_SALT, 6)

const isNumericId = (value: string): boolean => /^\d+$/.test(value)

export const encodeProjectId = (value: number | string): string => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return String(value)
  }
  return PROJECT_HASHIDS.encode(numeric)
}

export const decodeProjectId = (value: string): string | null => {
  if (!value) return null
  if (isNumericId(value)) return value
  const decoded = PROJECT_HASHIDS.decode(value)
  if (decoded.length === 1) {
    return String(decoded[0])
  }
  return null
}

export const buildProjectPath = (projectId: number | string, suffix = ''): string => {
  const slug = encodeProjectId(projectId)
  if (!suffix) return `/projects/${slug}`
  return `/projects/${slug}${suffix.startsWith('/') ? suffix : `/${suffix}`}`
}

export const parseProjectSlugFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/projects\/([^/]+)/)
  return match?.[1] ?? null
}
