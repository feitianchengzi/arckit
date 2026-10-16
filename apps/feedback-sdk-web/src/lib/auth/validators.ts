export type CodeType = 'email' | 'sms'

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function detectInputType(input: string): CodeType | null {
  const trimmed = input.trim()
  if (isValidEmail(trimmed)) return 'email'
  if (isValidPhone(trimmed)) return 'sms'
  return null
}
