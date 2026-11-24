/** Accepts 080…, +234… and spaces or dashes between digits. */
export function isNigerianPhone(value: string): boolean {
  return /^(\+?234|0)[789]\d{9}$/.test(value.replace(/[\s-]/g, ''))
}

/**
 * The same number written differently ("0803 000 0001", "+234 803 000 0001", "2348030000001") becomes one
 * form, so two customers with the same phone can be spotted. Only meaningful for numbers that passed isNigerianPhone.
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('234') ? `0${digits.slice(3)}` : digits
}