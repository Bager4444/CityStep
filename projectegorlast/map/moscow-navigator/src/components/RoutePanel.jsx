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
      // Передаем информацию о выбранном транспорте и желаемое время
      await onRouteSearch(selectedTransport, totalTime)
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



  // Функция для расчета нужного расстояния по времени
  const calculateRequiredDistance = (timeMinutes) => {
    if (!timeMinutes || timeMinutes <= 0) return null
    const hours = timeMinutes / 60
    const distanceKm = hours * 5 // 5 км/ч - средняя скорость ходьбы
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

        <button
          type="submit"
          className="route-button"
          disabled={isSearching || !routeFrom.trim() || !routeTo.trim()}
        >
          {isSearching ? 'Построение маршрута...' : 'Построить маршрут'}
        </button>

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
