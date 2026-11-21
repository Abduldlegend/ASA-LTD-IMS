import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // VITE_USE_MOCKS=true or false always wins. When it is not set, mocks are on everywhere except production builds.
  const useMocks = env.VITE_USE_MOCKS === undefined ? mode !== 'production' : env.VITE_USE_MOCKS === 'true'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    // A build-time constant, so when it is false the mock API and demo accounts are removed from the build entirely.
    define: { __USE_MOCKS__: JSON.stringify(useMocks) },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})