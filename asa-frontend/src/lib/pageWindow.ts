/**
 * Which page buttons to show: always the first and last, the current page with a
 * neighbour on each side, and "…" where pages are skipped. For 20 pages on page 9:
 * 1 … 8 9 10 … 20
 */
export type PageItem = number | 'gap-start' | 'gap-end'

export function pageWindow(current: number, total: number): PageItem[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const items: PageItem[] = [1]
    const from = Math.max(2, current - 1)
    const to = Math.min(total - 1, current + 1)
    if (from > 2) items.push(from === 3 ? 2 : 'gap-start')
    for (let p = from; p <= to; p++) items.push(p)
    if (to < total - 1) items.push(to === total - 2 ? total - 1 : 'gap-end')
    items.push(total)
    return items
}