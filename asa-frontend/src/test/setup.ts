import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { setSessionExpiredHandler } from '@/lib/api'
import { tokenStore } from '@/lib/tokenStore'
import { mockServer } from '@/mocks/authServer'

beforeEach(() => {
    mockServer.setDelay(0)
})

afterEach(() => {
    mockServer.reset()
    tokenStore.clear()
    setSessionExpiredHandler(null)
    localStorage.clear()
})

// Recharts measures its container with ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
    observe() { }
    unobserve() { }
    disconnect() { }
}