import { useState, useCallback } from 'react'
import './RoutePanel.css'

function RoutePanel({
  routeFrom,
  setRouteFrom,
  routeTo,
  setRouteTo,
  onRouteSearch,
  route,
  userLocation
}) {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [waypoints, setWaypoints] = useState([]) // Промежуточные точки
  const [newWaypoint, setNewWaypoint] = useState('')

  // Всегда используем пешеходный режим
  const selectedTransport = 'walking'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!routeFrom.trim() || !routeTo.trim()) {
      setError('Пожалуйста, заполните оба поля')
      return
    }

    setIsSearching(true)
    setError('')

    try {
      // Передаем информацию о выбранном транспорте, желаемое время и промежуточные точки
      await onRouteSearch(selectedTransport, totalTime, waypoints)
    } catch (err) {
      // Более детальная обработка ошибок
      let errorMessage = 'Ошибка при построении маршрута. Попробуйте еще раз.'

      if (err.message) {
        if (err.message.includes('Не заполнены поля')) {
          errorMessage = 'Пожалуйста, заполните поля "Откуда" и "Куда"'
        } else if (err.message.includes('Не удалось найти адрес')) {
          errorMessage = 'Не удалось найти один из адресов. Проверьте правильность написания.'
        } else if (err.message.includes('Ошибка сети')) {
          errorMessage = 'Проблемы с подключением к интернету. Проверьте соединение.'
        } else if (err.message.includes('Не удалось построить маршрут')) {
          errorMessage = 'Невозможно построить маршрут между указанными точками.'
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      console.error('Route search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUseCurrentLocation = useCallback(() => {
    if (userLocation) {
      setRouteFrom('Мое местоположение')
      setError('')
    } else {
      setError('Геолокация недоступна. Разрешите доступ к местоположению в браузере.')
    }
  }, [userLocation, setRouteFrom])

  const handleSwapAddresses = useCallback(() => {
    const temp = routeFrom
    setRouteFrom(routeTo)
    setRouteTo(temp)
    setError('')
  }, [routeFrom, routeTo, setRouteFrom, setRouteTo])

  const handleFromChange = useCallback((e) => {
    setRouteFrom(e.target.value)
    setError('')
  }, [setRouteFrom])

  const handleToChange = useCallback((e) => {
    setRouteTo(e.target.value)
    setError('')
  }, [setRouteTo])

  const handleTotalTimeChange = useCallback((e) => {
    const newValue = e.target.value
    console.log('🕐 Изменение времени:', newValue, 'тип:', typeof newValue)
    setTotalTime(newValue)
    setError('')
  }, [setTotalTime])

  // Функции для работы с промежуточными точками
  const addWaypoint = () => {
    if (newWaypoint.trim()) {
      const waypoint = {
        id: Date.now(),
        address: newWaypoint.trim()
      }
      setWaypoints([...waypoints, waypoint])
      setNewWaypoint('')
      setError('')
    }
  }

  const removeWaypoint = (id) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id))
  }

  const moveWaypoint = (index, direction) => {
    const newWaypoints = [...waypoints]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex >= 0 && newIndex < waypoints.length) {
      [newWaypoints[index], newWaypoints[newIndex]] = [newWaypoints[newIndex], newWaypoints[index]]
      setWaypoints(newWaypoints)
    }
  }

  const clearRoute = () => {
    setRouteFrom('')
    setRouteTo('')
    setWaypoints([])
    setTotalTime('')
    setError('')
  }

  // Функция для добавления промежуточной точки между началом и концом
  const addMiddleWaypoint = async () => {
    if (!routeFrom.trim() || !routeTo.trim()) {
      setError('Сначала заполните поля "Откуда" и "Куда"')
      return
    }

    try {
      setError('')

      // Геокодируем начальную и конечную точки
      console.log('🔍 Ищем координаты для промежуточной точки...')

      const fromResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(routeFrom.trim() + ', Москва, Россия')}&limit=1&addressdetails=1`
      )
      const fromData = await fromResponse.json()

      const toResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(routeTo.trim() + ', Москва, Россия')}&limit=1&addressdetails=1`
      )
      const toData = await toResponse.json()

      if (!fromData.length || !toData.length) {
        setError('Не удалось найти координаты начальной или конечной точки')
        return
      }

      const fromCoords = [parseFloat(fromData[0].lat), parseFloat(fromData[0].lon)]
      const toCoords = [parseFloat(toData[0].lat), parseFloat(toData[0].lon)]

      // Вычисляем координаты середины
      const middleLat = (fromCoords[0] + toCoords[0]) / 2
      const middleLon = (fromCoords[1] + toCoords[1]) / 2

      console.log('📍 Координаты промежуточной точки:', [middleLat, middleLon])

      // Находим ближайший адрес к средней точке
      const reverseResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${middleLat}&lon=${middleLon}&zoom=18&addressdetails=1`
      )
      const reverseData = await reverseResponse.json()

      let middleAddress = `${middleLat.toFixed(6)}, ${middleLon.toFixed(6)}`
      if (reverseData && reverseData.display_name) {
        // Извлекаем краткий адрес
        const parts = reverseData.display_name.split(',')
        middleAddress = parts.slice(0, 2).join(',').trim() || middleAddress
      }

      // Добавляем промежуточную точку
      const waypoint = {
        id: Date.now(),
        address: middleAddress,
        coordinates: [middleLat, middleLon],
        isMiddlePoint: true
      }

      setWaypoints([waypoint])
      console.log('✅ Добавлена промежуточная точка:', middleAddress)

    } catch (error) {
      console.error('Ошибка при добавлении промежуточной точки:', error)
      setError('Ошибка при поиске промежуточной точки')
    }
  }



  // Функция для расчета нужного расстояния по времени
  const calculateRequiredDistance = (timeMinutes) => {
    if (!timeMinutes || timeMinutes <= 0) return null
    const hours = timeMinutes / 60
    const distanceKm = hours * 3 // 3 км/ч - средняя скорость ходьбы
    return distanceKm
  }







  return (
    <div className="route-panel">
      <h3>🚶‍♂️ Пешеходный маршрут</h3>

      <form onSubmit={handleSubmit} className="route-form">
        <div className="route-inputs">
          <div className="input-group">
            <label htmlFor="route-from">Откуда:</label>
            <div className="input-with-button">
              <input
                id="route-from"
                type="text"
                value={routeFrom}
                onChange={handleFromChange}
                placeholder="Начальная точка"
                className="route-input"
                disabled={isSearching}
                autoComplete="off"
              />
              {userLocation && (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="location-button"
                  title="Использовать текущее местоположение"
                >
                  📍
                </button>
              )}
            </div>
          </div>

          <div className="swap-container">
            <button
              type="button"
              onClick={handleSwapAddresses}
              className="swap-button"
              title="Поменять местами"
            >
              ⇅
            </button>
          </div>

          <div className="input-group">
            <label htmlFor="route-to">Куда:</label>
            <input
              id="route-to"
              type="text"
              value={routeTo}
              onChange={handleToChange}
              placeholder="Конечная точка"
              className="route-input"
              disabled={isSearching}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="total-time">⏱️ Общее время (минуты):</label>
            <input
              id="total-time"
              type="number"
              value={totalTime}
              onChange={handleTotalTimeChange}
              placeholder="Например: 30"
              className="route-input"
              disabled={isSearching}
              min="1"
              max="1440"
              autoComplete="off"
            />
            {totalTime && totalTime > 0 && (
              <div className="time-hint">
                💡 Маршрут будет скорректирован до ~{calculateRequiredDistance(totalTime)?.toFixed(1)} км
                <div style={{ color: '#007bff', fontSize: '12px', marginTop: '4px' }}>
                  🎯 Приложение автоматически создаст маршрут нужной длины между выбранными точками
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Промежуточные точки */}
        <div className="waypoints-section">
          <div className="waypoints-header">
            <h4>🛑 Промежуточные точки</h4>
            <button
              type="button"
              onClick={addMiddleWaypoint}
              className="auto-middle-btn"
              disabled={!routeFrom.trim() || !routeTo.trim()}
              title="Добавить точку посередине маршрута"
            >
              ⚡ Авто
            </button>
          </div>

          {/* Список промежуточных точек */}
          {waypoints.length > 0 && (
            <div className="waypoints-list">
              {waypoints.map((waypoint, index) => (
                <div key={waypoint.id} className="waypoint-item">
                  <div className="waypoint-info">
                    <span className="waypoint-number">{index + 1}</span>
                    <span className="waypoint-address">{waypoint.address}</span>
                  </div>
                  <div className="waypoint-controls">
                    <button
                      type="button"
                      onClick={() => moveWaypoint(index, 'up')}
                      disabled={index === 0}
                      className="move-btn"
                      title="Переместить вверх"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWaypoint(index, 'down')}
                      disabled={index === waypoints.length - 1}
                      className="move-btn"
                      title="Переместить вниз"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWaypoint(waypoint.id)}
                      className="remove-btn"
                      title="Удалить точку"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Добавление новой промежуточной точки */}
          <div className="add-waypoint">
            <input
              type="text"
              value={newWaypoint}
              onChange={(e) => setNewWaypoint(e.target.value)}
              placeholder="Добавить промежуточную точку"
              className="waypoint-input"
              onKeyPress={(e) => e.key === 'Enter' && addWaypoint()}
            />
            <button
              type="button"
              onClick={addWaypoint}
              className="add-waypoint-btn"
              title="Добавить точку"
            >
              ➕
            </button>
          </div>
        </div>

        <div className="route-actions">
          <button
            type="submit"
            className="route-button primary"
            disabled={isSearching || !routeFrom.trim() || !routeTo.trim()}
          >
            {isSearching ? 'Построение маршрута...' : 'Построить маршрут'}
          </button>

          <button
            type="button"
            onClick={clearRoute}
            className="route-button secondary"
          >
            🗑️ Очистить
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </form>



      <div className="route-tips">
        <h4>🚶‍♂️ Популярные пешеходные маршруты:</h4>
        <ul>
          <li>Красная площадь → Парк Горького (3.5 км, ~40 мин)</li>
          <li>Арбат → Тверская (1.2 км, ~15 мин)</li>
          <li>Кремль → Храм Христа Спасителя (1.8 км, ~20 мин)</li>
          <li>ВДНХ → Ботанический сад (2.1 км, ~25 мин)</li>
        </ul>
      </div>
    </div>
  )
}

export default RoutePanel
