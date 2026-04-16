import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage pro testy
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '00000000-0000-4000-8000-000000000001',
    subtle: {
      digest: vi.fn(async (_algo: string, data: ArrayBuffer) => {
        // Jednoduchý deterministický hash pro testy
        const arr = new Uint8Array(data)
        const sum = arr.reduce((a, b) => a + b, 0)
        const hex = sum.toString(16).padStart(64, '0')
        return Buffer.from(hex, 'hex')
      }),
    },
  },
})
