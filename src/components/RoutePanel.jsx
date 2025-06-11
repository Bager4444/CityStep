import { useState, useCallback } from 'react'
import './RoutePanel.css'

function RoutePanel({
  routeFrom,
  setRouteFrom,
  routeTo,
  setRouteTo,
  waypoints = [],
  onAddWaypoint,
  onRemoveWaypoint,
  onRouteSearch,
  route,
  userLocation
}) {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [newWaypointInputs, setNewWaypointInputs] = useState({}) // Для хранения значений новых точек
  const [searchingWaypoints, setSearchingWaypoints] = useState({}) // Для отслеживания поиска

  // Всегда используем пешеходный режим
  const selectedTransport = 'walking'

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('🔥 *** ФОРМА ОТПРАВЛЕНА ***')
    console.log('🔥 routeFrom:', routeFrom)
    console.log('🔥 routeTo:', routeTo)
    console.log('🔥 totalTime:', totalTime)

    try {
      if (!routeFrom.trim() || !routeTo.trim()) {
        console.log('❌ Поля не заполнены')
        setError('Пожалуйста, заполните оба поля')
        return
      }

      console.log('✅ Поля заполнены, начинаем поиск')
      setIsSearching(true)
      setError('')

      // Валидация промежуточных точек
      if (waypoints && waypoints.length > 0) {
        for (let i = 0; i < waypoints.length; i++) {
          const waypoint = waypoints[i]
          if (!waypoint || !waypoint.coordinates || waypoint.coordinates.length !== 2) {
            setError(`Некорректная промежуточная точка ${i + 1}. Попробуйте удалить и добавить её заново.`)
            return
          }
        }

        // Предупреждение о конфликте времени и промежуточных точек
        if (totalTime && totalTime > 0) {
          console.log('⚠️ При указании времени промежуточные точки будут игнорированы')
        }
      }

      // Передаем информацию о выбранном транспорте и желаемое время
      console.log('🚀 RoutePanel вызывает onRouteSearch с параметрами:', {
        selectedTransport,
        totalTime,
        totalTimeType: typeof totalTime,
        waypointsCount: waypoints.length,
        waypoints: waypoints
      })
      await onRouteSearch(selectedTransport, totalTime)
    } catch (err) {
      // Более детальная обработка ошибок
      let errorMessage = 'Ошибка при построении маршрута. Попробуйте еще раз.'

      if (err && err.message) {
        if (err.message.includes('Не заполнены поля')) {
          errorMessage = 'Пожалуйста, заполните поля "Откуда" и "Куда"'
        } else if (err.message.includes('Не удалось найти адрес')) {
          errorMessage = 'Не удалось найти один из адресов. Проверьте правильность написания.'
        } else if (err.message.includes('Ошибка сети')) {
          errorMessage = 'Проблемы с подключением к интернету. Проверьте соединение.'
        } else if (err.message.includes('Не удалось построить маршрут')) {
          errorMessage = 'Невозможно построить маршрут между указанными точками.'
        } else if (err.message.includes('промежуточную точку')) {
          errorMessage = 'Ошибка с промежуточными точками. Попробуйте удалить их и добавить заново.'
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
    setRouteFrom('Моё местоположение')
    setError('')
    console.log('✅ Поле "Откуда" заполнено: Моё местоположение')
  }, [setRouteFrom])

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
    if (!timeMinutes || timeMinutes <= 0) return 0
    const hours = parseFloat(timeMinutes) / 60
    const distanceKm = hours * 5 // 5 км/ч - средняя скорость ходьбы
    return distanceKm
  }

  // Добавление новой промежуточной точки
  const handleAddWaypoint = () => {
    const newId = Date.now()
    setNewWaypointInputs(prev => ({
      ...prev,
      [newId]: ''
    }))
  }

  // Поиск и добавление промежуточной точки
  const handleSearchAndAddWaypoint = async (waypointId, query) => {
    if (!query.trim()) return

    setSearchingWaypoints(prev => ({ ...prev, [waypointId]: true }))

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Москва, Россия')}&limit=1&addressdetails=1&bounded=1&viewbox=36.8,56.0,38.2,55.1&countrycodes=ru`
      )

      if (response.ok) {
        const results = await response.json()
        if (results.length > 0) {
          const result = results[0]
          const lat = parseFloat(result.lat)
          const lon = parseFloat(result.lon)

          // Проверяем, что координаты в пределах Москвы
          if (lat < 55.1 || lat > 56.0 || lon < 36.8 || lon > 38.2) {
            setError(`Место "${query}" находится вне Москвы`)
            return
          }

          const waypoint = {
            id: waypointId,
            name: result.display_name,
            coordinates: [lat, lon],
            order: waypoints.length
          }

          onAddWaypoint(waypoint)

          // Убираем поле ввода после успешного добавления
          setNewWaypointInputs(prev => {
            const newInputs = { ...prev }
            delete newInputs[waypointId]
            return newInputs
          })
        } else {
          setError('Место не найдено. Попробуйте другой запрос.')
        }
      }
    } catch (error) {
      console.error('Ошибка поиска промежуточной точки:', error)
      setError('Ошибка при поиске места')
    } finally {
      setSearchingWaypoints(prev => ({ ...prev, [waypointId]: false }))
    }
  }

  // Удаление поля ввода новой точки
  const handleCancelWaypoint = (waypointId) => {
    setNewWaypointInputs(prev => {
      const newInputs = { ...prev }
      delete newInputs[waypointId]
      return newInputs
    })
  }

  // Изменение значения в поле ввода промежуточной точки
  const handleWaypointInputChange = (waypointId, value) => {
    setNewWaypointInputs(prev => ({
      ...prev,
      [waypointId]: value
    }))
    setError('')
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
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="location-button available"
                title="Использовать моё местоположение"
              >
                📍
              </button>
            </div>
          </div>

          {/* Промежуточные точки */}
          {waypoints.map((waypoint, index) => (
            <div key={waypoint.id} className="waypoint-group">
              <div className="waypoint-header">
                <span className="waypoint-label">📍 Точка {index + 1}:</span>
                <button
                  type="button"
                  onClick={() => onRemoveWaypoint(waypoint.id)}
                  className="remove-waypoint-btn"
                  title="Удалить точку"
                >
                  ✕
                </button>
              </div>
              <div className="waypoint-info">
                <span className="waypoint-name">{waypoint.name}</span>
              </div>
            </div>
          ))}

          {/* Поля ввода для новых промежуточных точек */}
          {Object.entries(newWaypointInputs).map(([waypointId, value]) => (
            <div key={waypointId} className="new-waypoint-group">
              <label>📍 Новая точка:</label>
              <div className="new-waypoint-input">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleWaypointInputChange(waypointId, e.target.value)}
                  placeholder="Введите адрес или название места"
                  className="route-input"
                  disabled={searchingWaypoints[waypointId]}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearchAndAddWaypoint(waypointId, value)
                    }
                  }}
                  autoComplete="off"
                />
                <div className="waypoint-actions">
                  <button
                    type="button"
                    onClick={() => handleSearchAndAddWaypoint(waypointId, value)}
                    className="add-waypoint-btn"
                    disabled={!value.trim() || searchingWaypoints[waypointId]}
                    title="Добавить точку"
                  >
                    {searchingWaypoints[waypointId] ? '⏳' : '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelWaypoint(waypointId)}
                    className="cancel-waypoint-btn"
                    title="Отменить"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Кнопка добавления новой промежуточной точки */}
          <div className="add-waypoint-container">
            <button
              type="button"
              onClick={handleAddWaypoint}
              className="add-waypoint-main-btn"
              title="Добавить промежуточную точку"
            >
              ➕ Добавить точку
            </button>
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
                💡 Маршрут будет скорректирован до ~{calculateRequiredDistance(totalTime).toFixed(1)} км
                <div style={{ color: '#007bff', fontSize: '12px', marginTop: '4px' }}>
                  🎯 Приложение автоматически создаст маршрут нужной длины между выбранными точками
                </div>
                {waypoints.length > 0 && (
                  <div style={{ color: '#ff9800', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ При указании времени промежуточные точки будут игнорированы
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="route-button"
          disabled={isSearching || !routeFrom.trim() || !routeTo.trim()}
          onClick={(e) => {
            console.log('🔥 *** КНОПКА НАЖАТА ***')
            console.log('🔥 Тип события:', e.type)
            console.log('🔥 routeFrom:', routeFrom)
            console.log('🔥 routeTo:', routeTo)
            console.log('🔥 waypoints:', waypoints)
          }}
        >
          {isSearching ? 'Построение маршрута...' : 'Построить маршрут'}
        </button>

        {/* ТЕСТОВАЯ КНОПКА */}
        <button
          type="button"
          onClick={async () => {
            console.log('🧪 *** ТЕСТОВАЯ КНОПКА НАЖАТА ***')
            console.log('🧪 waypoints:', waypoints)
            console.log('🧪 waypoints.length:', waypoints.length)

            try {
              setRouteFrom('Красная площадь')
              setRouteTo('Парк Горького')
              setIsSearching(true)
              setError('')

              await new Promise(resolve => setTimeout(resolve, 100))

              console.log('🧪 Вызываем onRouteSearch...')
              await onRouteSearch('walking')
            } catch (err) {
              console.error('🧪 Ошибка тестовой кнопки:', err)
              setError('Ошибка: ' + err.message)
            } finally {
              setIsSearching(false)
            }
          }}
          className="route-button"
          style={{
            backgroundColor: '#e91e63',
            fontSize: '14px',
            padding: '10px 15px',
            marginTop: '10px'
          }}
          disabled={isSearching}
        >
          🧪 ТЕСТ: Прямой вызов функции
        </button>

        {/* Кнопка для быстрого тестирования */}
        <button
          type="button"
          onClick={async () => {
            try {
              setError('')
              setRouteFrom('Красная площадь')
              setRouteTo('Парк Горького')
              setIsSearching(true)

              // Небольшая задержка для обновления состояния
              await new Promise(resolve => setTimeout(resolve, 100))

              await onRouteSearch('walking')
            } catch (err) {
              setError('Ошибка тестового маршрута: ' + err.message)
              console.error('Test route error:', err)
            } finally {
              setIsSearching(false)
            }
          }}
          className="route-button"
          style={{
            backgroundColor: '#ff9800',
            fontSize: '12px',
            padding: '8px 12px',
            marginTop: '8px'
          }}
          disabled={isSearching}
        >
          🧪 Тест: Красная площадь → Парк Горького
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
