import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Мокаем fetch для API вызовов
global.fetch = vi.fn()

// Мокаем CSS импорты
vi.mock('leaflet/dist/leaflet.css', () => ({}))

// Мокаем window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
