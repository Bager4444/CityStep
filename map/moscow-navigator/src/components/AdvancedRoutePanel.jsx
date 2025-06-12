import { useState, useEffect } from 'react'
import './AdvancedRoutePanel.css'

const AdvancedRoutePanel = ({
  routeFrom,
  setRouteFrom,
  routeTo,
  setRouteTo,
  onRouteSearch,
  route,
  userLocation
}) => {
  const [stops, setStops] = useState([])
  const [newStop, setNewStop] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  // Функции для форматирования расстояния и времени
  const formatDistance = (meters) => {
    if (!meters || isNaN(meters)) return 'Неизвестно'

    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} км`
    }
    return `${Math.round(meters)} м`
  }

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return 'Неизвестно'

    const minutes = Math.round(seconds / 60)

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}ч ${remainingMinutes}мин`
    }
    return `${minutes} мин`
  }

  // Инициализация времени отправления (текущее время + 10 минут)
  useEffect(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10)
    const timeString = now.toTimeString().slice(0, 5)
    setDepartureTime(timeString)
  }, [])

  // Категории мест для быстрого добавления
  const placeCategories = [
    { name: 'Кафе', icon: '☕', query: 'кафе' },
    { name: 'Ресторан', icon: '🍽️', query: 'ресторан' },
    { name: 'Магазин', icon: '🛒', query: 'магазин' },
    { name: 'Аптека', icon: '💊', query: 'аптека' },
    { name: 'Банк', icon: '🏦', query: 'банк' },
    { name: 'АЗС', icon: '⛽', query: 'заправка' },
    { name: 'Парк', icon: '🌳', query: 'парк' },
    { name: 'Музей', icon: '🏛️', query: 'музей' }
  ]

  // Добавление остановки
  const handleAddStop = () => {
    if (newStop.trim()) {
      const stop = {
        id: Date.now(),
        address: newStop.trim(),
        type: 'custom'
      }
      setStops([...stops, stop])
      setNewStop('')
    }
  }

  // Добавление остановки по категории
  const handleAddCategoryStop = (category) => {
    const stop = {
      id: Date.now(),
      address: `${category.query} рядом с маршрутом`,
      type: 'category',
      category: category.name,
      icon: category.icon,
      query: category.query
    }
    setStops([...stops, stop])
  }

  // Удаление остановки
  const handleRemoveStop = (stopId) => {
    setStops(stops.filter(stop => stop.id !== stopId))
  }

  // Перемещение остановки
  const moveStop = (index, direction) => {
    const newStops = [...stops]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex >= 0 && newIndex < stops.length) {
      [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]]
      setStops(newStops)
    }
  }

  // Использование текущего местоположения
  const useCurrentLocation = () => {
    if (userLocation) {
      setRouteFrom(`${userLocation.lat.toFixed(6)}, ${userLocation.lon.toFixed(6)}`)
    } else {
      setError('Геолокация недоступна')
    }
  }

  // Построение маршрута
  const handleRouteSearch = async () => {
    if (!routeFrom.trim() || !routeTo.trim()) {
      setError('Заполните поля "Откуда" и "Куда"')
      return
    }

    setIsSearching(true)
    setError('')

    try {
      // Передаем остановки в функцию построения маршрута
      await onRouteSearch('walking', stops, departureTime)
    } catch (err) {
      setError(err.message || 'Ошибка при построении маршрута')
    } finally {
      setIsSearching(false)
    }
  }

  // Очистка маршрута
  const handleClearRoute = () => {
    setRouteFrom('')
    setRouteTo('')
    setStops([])
    setError('')
  }

  return (
    <div className="advanced-route-panel">
      {/* Заголовок */}
      <div className="route-header">
        <h2>🚶‍♂️ Пешеходный маршрут</h2>
        <p>Планируйте маршрут с остановками</p>
      </div>

      {/* Основные точки маршрута */}
      <div className="route-points">
        <div className="route-point">
          <label>📍 Откуда:</label>
          <div className="input-with-button">
            <input
              type="text"
              value={routeFrom}
              onChange={(e) => setRouteFrom(e.target.value)}
              placeholder="Введите адрес отправления"
              className="route-input"
            />
            <button
              onClick={useCurrentLocation}
              className="location-btn"
              title="Использовать текущее местоположение"
            >
              📍
            </button>
          </div>
        </div>

        <div className="route-point">
          <label>🎯 Куда:</label>
          <input
            type="text"
            value={routeTo}
            onChange={(e) => setRouteTo(e.target.value)}
            placeholder="Введите адрес назначения"
            className="route-input"
          />
        </div>

        <div className="route-point">
          <label>⏰ Время отправления:</label>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="time-input"
          />
        </div>
      </div>

      {/* Остановки */}
      <div className="stops-section">
        <h3>🛑 Остановки по пути</h3>

        {/* Список остановок */}
        {stops.length > 0 && (
          <div className="stops-list">
            {stops.map((stop, index) => (
              <div key={stop.id} className="stop-item">
                <div className="stop-info">
                  <span className="stop-icon">
                    {stop.icon || '📍'}
                  </span>
                  <span className="stop-address">{stop.address}</span>
                  {stop.category && (
                    <span className="stop-category">{stop.category}</span>
                  )}
                </div>
                <div className="stop-controls">
                  <button
                    onClick={() => moveStop(index, 'up')}
                    disabled={index === 0}
                    className="move-btn"
                    title="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStop(index, 'down')}
                    disabled={index === stops.length - 1}
                    className="move-btn"
                    title="Переместить вниз"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemoveStop(stop.id)}
                    className="remove-btn"
                    title="Удалить остановку"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Добавление новой остановки */}
        <div className="add-stop">
          <div className="custom-stop">
            <input
              type="text"
              value={newStop}
              onChange={(e) => setNewStop(e.target.value)}
              placeholder="Добавить адрес остановки"
              className="stop-input"
              onKeyPress={(e) => e.key === 'Enter' && handleAddStop()}
            />
            <button onClick={handleAddStop} className="add-btn">
              ➕
            </button>
          </div>

          {/* Быстрые категории */}
          <div className="category-stops">
            <p>Или выберите категорию:</p>
            <div className="category-grid">
              {placeCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleAddCategoryStop(category)}
                  className="category-btn"
                  title={`Добавить ${category.name.toLowerCase()}`}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Кнопки управления */}
      <div className="route-actions">
        <button
          onClick={handleRouteSearch}
          disabled={isSearching || !routeFrom.trim() || !routeTo.trim()}
          className="route-btn primary"
        >
          {isSearching ? '🔄 Строим маршрут...' : '🗺️ Построить маршрут'}
        </button>

        <button
          onClick={handleClearRoute}
          className="route-btn secondary"
        >
          🗑️ Очистить
        </button>
      </div>

      {/* Информация о маршруте */}
      {route && (
        <div className="route-info">
          <h3>📊 Информация о маршруте</h3>
          <div className="route-stats">
            <div className="stat">
              <span className="stat-label">Расстояние:</span>
              <span className="stat-value">{formatDistance(route.distance)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Время в пути:</span>
              <span className="stat-value">{formatDuration(route.duration)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Остановок:</span>
              <span className="stat-value">{stops.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedRoutePanel
