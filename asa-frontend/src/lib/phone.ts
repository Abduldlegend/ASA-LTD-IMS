/** Accepts 080…, +234… and spaces or dashes between digits. */
export function isNigerianPhone(value: string): boolean {
  return /^(\+?234|0)[789]\d{9}$/.test(value.replace(/[\s-]/g, ''))
}