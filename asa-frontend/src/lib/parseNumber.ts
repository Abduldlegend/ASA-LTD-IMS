/**
 * Reads a number typed by a person: "12,500", "₦12 500.50", ".5". Returns null if it is not a plain number.
 * Forms keep what was typed as text, so the box shows exactly what the person wrote, and convert on save.
 */
export function parseDecimal(text: string): number | null {
    const cleaned = text.replace(/[₦,\s]/g, '')
    if (!/^(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
}

export function isWholeNumber(n: number): boolean {
    return Number.isInteger(n)
}

/** True when the number has at most two decimal places, as money does. */
export function hasAtMostTwoDecimals(n: number): boolean {
    return Math.abs(Math.round(n * 100) - n * 100) < 1e-6
}