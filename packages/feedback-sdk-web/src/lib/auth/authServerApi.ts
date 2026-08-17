import { CodeType } from '@/lib/auth/validators'

const GATEWAY_BASE_URL = import.meta.env.DEV
  ? '/gateway'
  : import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'

interface ApiEnvelope<T> {
  code?: string
  message?: string
  data?: T
  error?: {
    message?: string
  }
}

interface LoginTokens {
  access_token: string
  refresh_token: string
  expires_in?: number
  refresh_expires_in?: number
  access_token_expires_at?: number
  refresh_token_expires_at?: number
}

interface LoginResultData {
  user?: Record<string, unknown>
  tokens?: LoginTokens
}

interface ApiKeyData {
  id?: string
  name?: string
  api_key?: string
  expires_at?: string
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const json = (await response.json().catch(() => ({}))) as ApiEnvelope<T>

  if (!response.ok) {
    const message = json.error?.message || json.message || `Request failed: ${response.status}`
    throw new Error(message)
  }

  if (json.code && json.code !== 'OK') {
    throw new Error(json.error?.message || json.message || `API error: ${json.code}`)
  }

  return (json.data ?? (json as unknown as T))
}

export async function sendVerificationCode(params: { codeType: CodeType; target: string }) {
  return requestJson<{ message?: string }>(`${GATEWAY_BASE_URL}/auth-server/v1/public/send_verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code_type: params.codeType,
      target: params.target,
      purpose: 'login',
    }),
  })
}

export async function loginWithVerification(params: { codeType: CodeType; target: string; code: string }) {
  const body =
    params.codeType === 'email'
      ? { email: params.target, code: params.code, code_type: 'email', purpose: 'login' }
      : { phone: params.target, code: params.code, code_type: 'sms', purpose: 'login' }

  return requestJson<LoginResultData>(`${GATEWAY_BASE_URL}/auth-server/v1/public/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function generateApiKey(params: { token: string; name: string; expiresAt?: string }) {
  return requestJson<ApiKeyData>(`${GATEWAY_BASE_URL}/auth-server/v1/user/generate_apikey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      name: params.name,
      expires_at: params.expiresAt,
      permissions: ['read', 'write'],
      allowed_services: ['workshop'],
    }),
  })
}

export async function verifyApiKey(apiKey: string) {
  return requestJson<Record<string, unknown>>(`${GATEWAY_BASE_URL}/workshop/v1/apikey/header-info`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
}
