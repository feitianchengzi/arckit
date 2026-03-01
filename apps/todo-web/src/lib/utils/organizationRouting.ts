import Hashids from 'hashids'

const ORGANIZATION_ID_SALT = 'todo-web-organization'
const ORGANIZATION_HASHIDS = new Hashids(ORGANIZATION_ID_SALT, 6)

const isNumericId = (value: string): boolean => /^\d+$/.test(value)

export const encodeOrganizationId = (value: number | string): string => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return String(value)
  }
  return ORGANIZATION_HASHIDS.encode(numeric)
}

export const decodeOrganizationId = (value: string): string | null => {
  if (!value) return null
  if (isNumericId(value)) return value
  const decoded = ORGANIZATION_HASHIDS.decode(value)
  if (decoded.length === 1) {
    return String(decoded[0])
  }
  return null
}

export const buildOrganizationPath = (organizationId: number | string, suffix = ''): string => {
  const slug = encodeOrganizationId(organizationId)
  if (!suffix) return `/organizations/${slug}`
  return `/organizations/${slug}${suffix.startsWith('/') ? suffix : `/${suffix}`}`
}

export const buildFeedbackOrganizationPath = (organizationId: number | string): string => {
  const slug = encodeOrganizationId(organizationId)
  return `/feedbacks/organizations/${slug}`
}
