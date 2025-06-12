import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Мокаем Leaflet компоненты для тестирования
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({
    setView: vi.fn(),
  }),
}))

// Мокаем Leaflet
vi.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: undefined,
      },
      mergeOptions: vi.fn(),
    },
  },
}))

// Мокаем геолокацию
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
  },
  writable: true,
})

describe('App', () => {
  it('renders main title', () => {
    render(<App />)
    expect(screen.getByText('Навигатор Москвы')).toBeInTheDocument()
  })

  it('renders search panel', () => {
    render(<App />)
    expect(screen.getByText('Поиск мест')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Введите адрес или название места/)).toBeInTheDocument()
  })

  it('renders route panel', () => {
    render(<App />)
    expect(screen.getByText('Построение маршрута')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Начальная точка')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Конечная точка')).toBeInTheDocument()
  })

  it('renders map container', () => {
    render(<App />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders search examples', () => {
    render(<App />)
    expect(screen.getByText('Красная площадь')).toBeInTheDocument()
    expect(screen.getByText('Тверская улица')).toBeInTheDocument()
  })

  it('renders route examples', () => {
    render(<App />)
    expect(screen.getByText(/Красная площадь → Парк Горького/)).toBeInTheDocument()
  })
})
