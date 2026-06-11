const EMAIL_FORMAT =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/** Characters commonly used in XSS / injection probes in the email field. */
const SUSPICIOUS_EMAIL_CHARS = /[<>"';\\]|(--)|(\/\*)|(\bscript\b)/i

export interface LoginFormValues {
  email: string
  password: string
}

export interface LoginValidationResult {
  valid: boolean
  email?: string
  password?: string
  form?: string
}

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateLoginForm(values: LoginFormValues): LoginValidationResult {
  const email = normalizeLoginEmail(values.email)
  const password = values.password

  if (!email) {
    return { valid: false, email: 'Please enter your email address.' }
  }

  if (SUSPICIOUS_EMAIL_CHARS.test(email)) {
    return {
      valid: false,
      email: 'Please enter a valid email address.',
    }
  }

  if (!EMAIL_FORMAT.test(email)) {
    return {
      valid: false,
      email: 'Please enter a valid email address.',
    }
  }

  if (email.length > 255) {
    return {
      valid: false,
      email: 'Email address is too long.',
    }
  }

  if (!password) {
    return { valid: false, password: 'Please enter your password.' }
  }

  if (password.length > 128) {
    return {
      valid: false,
      password: 'Password is too long.',
    }
  }

  return { valid: true }
}
