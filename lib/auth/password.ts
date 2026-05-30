export const MIN_PASSWORD_LENGTH = 6

export function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

export function validatePasswordConfirmation(
  password: string,
  confirm: string
): string | null {
  if (password !== confirm) {
    return 'Passwords do not match.'
  }
  return null
}
