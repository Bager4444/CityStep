import { useState } from 'react'
import './TransportSelector.css'

const TRANSPORT_MODES = {
  walking: {
    id: 'walking',
    name: 'Пешком',
    icon: '🚶',
    color: '#28a745',
    description: 'Пешеходный маршрут',
    osrmProfile: 'foot',
    avgSpeed: 3 // км/ч - обычная скорость ходьбы
  },
  cycling: {
    id: 'cycling',
    name: 'Велосипед',
    icon: '🚴',
    color: '#17a2b8',
    description: 'Велосипедный маршрут',
    osrmProfile: 'bicycle',
    avgSpeed: 18 // км/ч - средняя скорость велосипеда в городе
  },
  driving: {
    id: 'driving',
    name: 'Автомобиль',
    icon: '🚗',
    color: '#dc3545',
    description: 'Автомобильный маршрут',
    osrmProfile: 'driving',
    avgSpeed: 30 // км/ч - средняя скорость в городе с пробками
  },
  public_transport: {
    id: 'public_transport',
    name: 'Общественный транспорт',
    icon: '🚌',
    color: '#6f42c1',
    description: 'Автобус, метро, трамвай',
    osrmProfile: 'driving', // Используем driving как базу
    avgSpeed: 22 // км/ч - с учетом остановок и пересадок
  },
  taxi: {
    id: 'taxi',
    name: 'Такси',
    icon: '🚕',
    color: '#fd7e14',
    description: 'Маршрут на такси',
    osrmProfile: 'driving',
    avgSpeed: 28 // км/ч - чуть быстрее обычного авто
  }
}

function TransportSelector({ selectedMode = 'driving', onModeChange, disabled = false }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleModeSelect = (mode) => {
    onModeChange(mode)
    setIsExpanded(false)
  }

  const selectedTransport = TRANSPORT_MODES[selectedMode]

  return (
    <div className="transport-selector">
      <div className="transport-header">
        <span className="transport-label">Способ передвижения:</span>
      </div>

      <div className={`transport-dropdown ${isExpanded ? 'expanded' : ''}`}>
        {/* Выбранный режим */}
        <button
          className={`transport-selected ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setIsExpanded(!isExpanded)}
          disabled={disabled}
          style={{ borderColor: selectedTransport.color }}
        >
          <div className="transport-option-content">
            <span className="transport-icon">{selectedTransport.icon}</span>
            <div className="transport-info">
              <span className="transport-name">{selectedTransport.name}</span>
              <span className="transport-desc">{selectedTransport.description}</span>
            </div>
          </div>
          <span className={`dropdown-arrow ${isExpanded ? 'up' : 'down'}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>

        {/* Список опций */}
        {isExpanded && (
          <div className="transport-options">
            {Object.values(TRANSPORT_MODES).map((mode) => (
              <button
                key={mode.id}
                className={`transport-option ${selectedMode === mode.id ? 'active' : ''}`}
                onClick={() => handleModeSelect(mode.id)}
                style={{
                  borderLeftColor: mode.color,
                  backgroundColor: selectedMode === mode.id ? `${mode.color}15` : 'transparent'
                }}
              >
                <div className="transport-option-content">
                  <span className="transport-icon">{mode.icon}</span>
                  <div className="transport-info">
                    <span className="transport-name">{mode.name}</span>
                    <span className="transport-desc">{mode.description}</span>
                  </div>
                  <div className="transport-speed">
                    ~{mode.avgSpeed} км/ч
                  </div>
                </div>
                {selectedMode === mode.id && (
                  <span className="selected-check">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Дополнительная информация */}
      {selectedMode === 'public_transport' && (
        <div className="transport-note">
          <span className="note-icon">ℹ️</span>
          <span className="note-text">
            Включает метро, автобусы, трамваи и троллейбусы
          </span>
        </div>
      )}

      {selectedMode === 'walking' && (
        <div className="transport-note">
          <span className="note-icon">👟</span>
          <span className="note-text">
            Оптимальный маршрут для пешеходов
          </span>
        </div>
      )}

      {selectedMode === 'cycling' && (
        <div className="transport-note">
          <span className="note-icon">🛣️</span>
          <span className="note-text">
            Учитывает велодорожки и безопасные маршруты
          </span>
        </div>
      )}
    </div>
  )
}

// Функция для получения конфигурации транспорта
export const getTransportConfig = (mode) => {
  return TRANSPORT_MODES[mode] || TRANSPORT_MODES.driving
}

// Функция для расчета примерного времени в пути
export const calculateEstimatedTime = (distanceKm, transportMode) => {
  const config = getTransportConfig(transportMode)
  const timeHours = distanceKm / config.avgSpeed
  const timeMinutes = Math.round(timeHours * 60)

  return {
    hours: Math.floor(timeMinutes / 60),
    minutes: timeMinutes % 60,
    totalMinutes: timeMinutes
  }
}

// Функция для форматирования времени
export const formatTime = (timeObj) => {
  if (timeObj.hours > 0) {
    return `${timeObj.hours}ч ${timeObj.minutes}мин`
  }
  return `${timeObj.minutes}мин`
}

// Функция для расчета примерной стоимости такси в Москве
export const calculateTaxiPrice = (distanceKm, timeMinutes) => {
  // Тарифы такси в Москве (примерные средние значения)
  const TAXI_RATES = {
    baseFare: 150,        // Базовая стоимость посадки
    perKm: 25,           // Рублей за километр
    perMinute: 8,        // Рублей за минуту (в пробках)
    minPrice: 200,       // Минимальная стоимость поездки
    nightMultiplier: 1.2, // Ночной тариф (23:00-06:00)
    peakMultiplier: 1.3   // Час пик (07:00-10:00, 17:00-20:00)
  }

  // Базовый расчет
  let price = TAXI_RATES.baseFare +
              (distanceKm * TAXI_RATES.perKm) +
              (timeMinutes * TAXI_RATES.perMinute)

  // Применяем минимальную стоимость
  price = Math.max(price, TAXI_RATES.minPrice)

  // Проверяем время суток для применения коэффициентов
  const currentHour = new Date().getHours()

  // Ночной тариф (23:00-06:00)
  if (currentHour >= 23 || currentHour < 6) {
    price *= TAXI_RATES.nightMultiplier
  }
  // Час пик (07:00-10:00, 17:00-20:00)
  else if ((currentHour >= 7 && currentHour < 10) || (currentHour >= 17 && currentHour < 20)) {
    price *= TAXI_RATES.peakMultiplier
  }

  return {
    basePrice: Math.round(price),
    minPrice: Math.round(price * 0.8),  // -20% (эконом тариф)
    maxPrice: Math.round(price * 1.5),  // +50% (комфорт/бизнес)
    currency: '₽'
  }
}

// Функция для форматирования цены такси
export const formatTaxiPrice = (priceObj) => {
  if (priceObj.minPrice === priceObj.maxPrice) {
    return `${priceObj.basePrice}${priceObj.currency}`
  }
  return `${priceObj.minPrice}-${priceObj.maxPrice}${priceObj.currency}`
}

// Функция для получения описания тарифа
export const getTaxiTariffInfo = () => {
  const currentHour = new Date().getHours()

  if (currentHour >= 23 || currentHour < 6) {
    return { type: 'night', description: 'Ночной тариф (+20%)', icon: '🌙' }
  } else if ((currentHour >= 7 && currentHour < 10) || (currentHour >= 17 && currentHour < 20)) {
    return { type: 'peak', description: 'Час пик (+30%)', icon: '🚦' }
  } else {
    return { type: 'normal', description: 'Обычный тариф', icon: '🕐' }
  }
}

export default TransportSelector
