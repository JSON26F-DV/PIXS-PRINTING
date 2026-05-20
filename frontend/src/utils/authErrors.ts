import axios from 'axios'

/** User-facing copy — never expose stack traces, SQL, or HTTP client jargon. */
export const AUTH_MESSAGES = {
  invalidCredentials: 'Invalid email or password.',
  accessDenied: 'Access denied. You do not have permission to sign in.',
  networkError: 'Unable to connect to the server. Please try again later.',
  serverError: 'Something went wrong. Please try again later.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  unexpected: 'An unexpected error occurred. Please try again.',
  validationFailed: 'Please check your email and password and try again.',
} as const

const TECHNICAL_PATTERNS: RegExp[] = [
  /request failed with status code/i,
  /\baxios\b/i,
  /\bnetwork error\b/i,
  /\bSQLSTATE\b/i,
  /\bquery exception\b/i,
  /\bPDO\b/i,
  /\bstack trace\b/i,
  /\bat \/[\w./-]+\.php/i,
  /\bIlluminate\\/i,
  /\bSymfony\\/i,
  /\bException\b/i,
  /\bFatal error\b/i,
  /\bXAMPP\b/i,
  /\bMySQL\b/i,
  /\bMariaDB\b/i,
  /\b\.env\b/i,
  /<\s*script/i,
  /javascript:/i,
]

const ALLOWED_MESSAGES = new Set<string>([
  AUTH_MESSAGES.invalidCredentials,
  AUTH_MESSAGES.accessDenied,
  AUTH_MESSAGES.networkError,
  AUTH_MESSAGES.serverError,
  AUTH_MESSAGES.rateLimited,
  AUTH_MESSAGES.unexpected,
  AUTH_MESSAGES.validationFailed,
  'Invalid email or password.',
  'Too many login attempts. Try again in a moment.',
  'Please enter your email address.',
  'Please enter a valid email address.',
  'Please enter your password.',
  'The email format is invalid.',
  'This field contains invalid characters.',
])

export function isTechnicalMessage(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return true
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function sanitizeAuthMessage(
  message: string | undefined | null,
  fallback: string,
): string {
  if (!message || typeof message !== 'string') return fallback
  const trimmed = message.trim()
  if (!trimmed || isTechnicalMessage(trimmed)) return fallback
  if (ALLOWED_MESSAGES.has(trimmed)) return trimmed
  // Short, plain sentences from our API are usually safe
  if (
    trimmed.length <= 120 &&
    !trimmed.includes('Exception') &&
    !trimmed.includes('error:')
  ) {
    return trimmed
  }
  return fallback
}

const VALIDATION_FIELD_FALLBACKS: Record<string, string> = {
  email: 'Please enter a valid email address.',
  password: 'Please enter your password.',
}

export function sanitizeFieldErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> {
  if (!errors) return {}
  const sanitized: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(errors)) {
    const list = Array.isArray(messages) ? messages : [String(messages)]
    const cleaned = list
      .map((msg) =>
        sanitizeAuthMessage(
          msg,
          VALIDATION_FIELD_FALLBACKS[field] ?? AUTH_MESSAGES.validationFailed,
        ),
      )
      .filter(Boolean)
    if (cleaned.length > 0) {
      sanitized[field] = cleaned
    }
  }
  return sanitized
}

export function getAuthErrorMessage(
  err: unknown,
  fallback: string = AUTH_MESSAGES.unexpected,
): string {
  if (!axios.isAxiosError(err)) {
    return AUTH_MESSAGES.unexpected
  }

  if (!err.response) {
    return AUTH_MESSAGES.networkError
  }

  const status = err.response.status
  const data = err.response.data as {
    message?: string
    errors?: Record<string, string[]>
  }

  if (status === 401) {
    return AUTH_MESSAGES.invalidCredentials
  }

  if (status === 403 && !data?.message?.toLowerCase().includes('banned')) {
    return AUTH_MESSAGES.accessDenied
  }

  if (status === 429) {
    return sanitizeAuthMessage(data?.message, AUTH_MESSAGES.rateLimited)
  }

  if (status === 422 && data?.errors) {
    const first = Object.values(sanitizeFieldErrors(data.errors)).flat()[0]
    if (first) return first
    return AUTH_MESSAGES.validationFailed
  }

  if (status >= 500) {
    return AUTH_MESSAGES.serverError
  }

  return sanitizeAuthMessage(data?.message, fallback)
}
