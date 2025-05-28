import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import MapComponent from './components/MapComponent'
import SearchPanel from './components/SearchPanel'
import RoutePanel from './components/RoutePanel'

import LocationDebug from './components/LocationDebug'
import UserButton from './components/UserButton'
import WelcomeScreen from './components/WelcomeScreen'
import geolocationService from './services/GeolocationService'
import './App.css'

function App() {
  const { isAuthenticated, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [routeFrom, setRouteFrom] = useState('')
  const [routeTo, setRouteTo] = useState('')
  const [mapCenter, setMapCenter] = useState([55.7558, 37.6176]) // Москва
  const [markers, setMarkers] = useState([])
  const [route, setRoute] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isFullscreenMap, setIsFullscreenMap] = useState(false)

  // Получение высокоточной геолокации пользователя
  useEffect(() => {
    const initializeGeolocation = async () => {
      if (!geolocationService.isSupported()) {
        console.warn('🚫 Геолокация не поддерживается этим браузером')
        return
      }

      try {
        // Запрашиваем разрешение на геолокацию
        console.log('📍 Запрашиваем разрешение на геолокацию...')
        await geolocationService.requestPermission()
        console.log('✅ Разрешение на геолокацию получено')

        // Получаем текущее местоположение с максимальной точностью
        console.log('🎯 Получаем высокоточное местоположение...')
        const position = await geolocationService.getCurrentPosition(true)
        setUserLocation(position.coordinates)

        console.log('🎯 Высокоточное местоположение получено:', {
          coordinates: position.coordinates,
          accuracy: `${position.accuracy}м (${position.accuracyText})`,
          speed: position.speedKmh ? `${position.speedKmh} км/ч` : 'неподвижен',
          heading: position.headingText || 'неизвестно',
          timestamp: new Date(position.timestamp).toLocaleTimeString()
        })

        // Если пользователь в Москве или рядом, центрируем карту на его местоположении
        const [lat, lon] = position.coordinates
        if (lat > 55.4 && lat < 56.1 && lon > 37.2 && lon < 38.0) {
          setMapCenter(position.coordinates)
          console.log('🗺️ Карта центрирована на местоположении пользователя')
        }

        // Начинаем отслеживание местоположения для постоянных обновлений
        console.log('🔄 Запускаем отслеживание местоположения...')
        geolocationService.startWatching(
          (updatedPosition) => {
            setUserLocation(updatedPosition.coordinates)

            // Логируем только значительные изменения точности
            const prevAccuracy = geolocationService.getLastKnownPosition()?.accuracy
            if (!prevAccuracy || Math.abs(updatedPosition.accuracy - prevAccuracy) > 5) {
              console.log('📍 Местоположение обновлено:', {
                coordinates: updatedPosition.coordinates,
                accuracy: `${updatedPosition.accuracy}м (${updatedPosition.accuracyText})`,
                improvement: prevAccuracy ?
                  `${prevAccuracy > updatedPosition.accuracy ? '📈 лучше' : '📉 хуже'} на ${Math.abs(prevAccuracy - updatedPosition.accuracy).toFixed(1)}м` :
                  'первое обновление'
              })
            }
          },
          (error) => {
            console.warn('⚠️ Ошибка отслеживания местоположения:', error.message)
          },
          true // максимальная точность
        )

      } catch (error) {
        console.error('❌ Ошибка инициализации геолокации:', error.message)

        // Показываем пользователю подсказки
        if (error.message.includes('запрещен')) {
          console.log('💡 Совет: Разрешите доступ к геолокации в настройках браузера для лучшей работы навигации')
        } else if (error.message.includes('недоступно')) {
          console.log('💡 Совет: Проверьте подключение к интернету и включите службы геолокации')
        }
      }
    }

    initializeGeolocation()

    // Очистка при размонтировании компонента
    return () => {
      if (geolocationService.isCurrentlyWatching()) {
        console.log('🛑 Останавливаем отслеживание геолокации')
        geolocationService.stopWatching()
      }
    }
  }, [])

  // Обработчик обновлений навигации - временно отключен
  const handleNavigationUpdate = (data) => {
    console.log('Обновление навигации:', data)

    // Если навигация активна, можем обновить центр карты
    if (data.isNavigating && userLocation) {
      setMapCenter(userLocation)
    }
  }

  // Обработчик обновления шагов навигации - временно отключен
  const handleNavigationStepsUpdate = (steps) => {
    console.log('Обновление шагов навигации:', steps)
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      throw new Error('Пустой запрос для поиска')
    }

    try {
      // Используем Nominatim API для поиска адресов в Москве
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Москва, Россия')}&limit=5&addressdetails=1`
      )

      if (!response.ok) {
        throw new Error('Ошибка сети при поиске')
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw new Error(`Не найдено результатов для запроса: "${query}"`)
      }

      const results = data.map(item => {
        const lat = parseFloat(item.lat)
        const lon = parseFloat(item.lon)

        if (isNaN(lat) || isNaN(lon)) {
          console.warn('Некорректные координаты для элемента:', item)
          return null
        }

        return {
          lat,
          lon,
          display_name: item.display_name,
          address: item.address
        }
      }).filter(Boolean) // Убираем null элементы

      if (results.length === 0) {
        throw new Error('Получены некорректные данные поиска')
      }

      setMarkers(results)
      setMapCenter([results[0].lat, results[0].lon])

    } catch (error) {
      console.error('Ошибка поиска:', error)
      throw error // Пробрасываем ошибку для обработки в компоненте
    }
  }

  const handleRouteSearch = async (transportMode = 'walking', totalTime = null) => {
    // Детальная валидация полей
    if (!routeFrom.trim()) {
      throw new Error('Поле "Откуда" не заполнено')
    }

    if (!routeTo.trim()) {
      throw new Error('Поле "Куда" не заполнено')
    }

    console.log('🚀 Начинаем построение маршрута:', {
      from: routeFrom.trim(),
      to: routeTo.trim(),
      transport: transportMode,
      totalTime: totalTime
    })

    try {
      // Обработка специального случая "Мое местоположение"
      let fromQuery = routeFrom.trim()
      let fromCoords = null

      if (fromQuery === 'Мое местоположение' && userLocation) {
        fromCoords = userLocation
      } else {
        // Геокодируем начальную точку
        console.log('🔍 Ищем начальную точку:', fromQuery)
        const fromResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromQuery + ', Москва, Россия')}&limit=1&addressdetails=1`
        )

        if (!fromResponse.ok) {
          console.error('❌ Ошибка сети при поиске начальной точки:', fromResponse.status)
          throw new Error('Ошибка сети при поиске начальной точки')
        }

        const fromData = await fromResponse.json()
        console.log('📍 Результат поиска начальной точки:', fromData)

        if (!fromData || fromData.length === 0) {
          throw new Error(`Не удалось найти адрес: "${fromQuery}"`)
        }

        fromCoords = [parseFloat(fromData[0].lat), parseFloat(fromData[0].lon)]
        console.log('📍 Координаты начальной точки:', fromCoords)

        // Проверяем валидность координат
        if (isNaN(fromCoords[0]) || isNaN(fromCoords[1])) {
          throw new Error('Некорректные координаты начальной точки')
        }
      }

      // Геокодируем конечную точку
      console.log('🔍 Ищем конечную точку:', routeTo.trim())
      const toResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(routeTo.trim() + ', Москва, Россия')}&limit=1&addressdetails=1`
      )

      if (!toResponse.ok) {
        console.error('❌ Ошибка сети при поиске конечной точки:', toResponse.status)
        throw new Error('Ошибка сети при поиске конечной точки')
      }

      const toData = await toResponse.json()
      console.log('📍 Результат поиска конечной точки:', toData)

      if (!toData || toData.length === 0) {
        throw new Error(`Не удалось найти адрес: "${routeTo.trim()}"`)
      }

      const toCoords = [parseFloat(toData[0].lat), parseFloat(toData[0].lon)]
      console.log('📍 Координаты конечной точки:', toCoords)

      // Проверяем валидность координат
      if (isNaN(toCoords[0]) || isNaN(toCoords[1])) {
        throw new Error('Некорректные координаты конечной точки')
      }

      // Проверяем, что точки не совпадают
      const distance = Math.sqrt(
        Math.pow(fromCoords[0] - toCoords[0], 2) + Math.pow(fromCoords[1] - toCoords[1], 2)
      )
      if (distance < 0.001) {
        throw new Error('Начальная и конечная точки слишком близко друг к другу')
      }

      // Функция для создания промежуточных точек для удлинения маршрута
      const createExtendedRoute = async (from, to, targetTimeMinutes) => {
        const targetDistanceKm = (targetTimeMinutes / 60) * 5 // 5 км/ч средняя скорость ходьбы

        // Сначала строим прямой маршрут
        const directRoute = await buildRoute(from, to, transportMode)
        const directDistanceKm = directRoute.distance / 1000

        console.log(`🎯 Целевое расстояние: ${targetDistanceKm.toFixed(1)} км, прямой маршрут: ${directDistanceKm.toFixed(1)} км`)

        // Если прямой маршрут уже достаточно длинный, возвращаем его
        if (directDistanceKm >= targetDistanceKm * 0.9) {
          console.log('✅ Прямой маршрут подходит по длине')
          return directRoute
        }

        // Нужно удлинить маршрут до целевого расстояния
        const additionalDistanceKm = targetDistanceKm - directDistanceKm
        console.log(`📏 Нужно добавить ${additionalDistanceKm.toFixed(1)} км для достижения ${targetDistanceKm.toFixed(1)} км`)

        // Пробуем создать точный маршрут с несколькими попытками
        let bestRoute = directRoute
        let bestDifference = additionalDistanceKm

        // Пробуем разные варианты отклонений
        const offsetMultipliers = [0.15, 0.25, 0.35, 0.45] // разные коэффициенты отклонения

        for (const multiplier of offsetMultipliers) {
          try {
            const waypoints = await generateWaypoints(from, to, additionalDistanceKm, directDistanceKm, multiplier)

            if (waypoints.length > 0) {
              console.log(`🗺️ Попытка ${multiplier}: создаем маршрут через ${waypoints.length} промежуточных точек`)
              const testRoute = await buildRouteWithWaypoints([from, ...waypoints, to], transportMode)
              const testDistanceKm = testRoute.distance / 1000
              const testDifference = Math.abs(testDistanceKm - targetDistanceKm)

              console.log(`📏 Попытка ${multiplier}: получили ${testDistanceKm.toFixed(1)} км (отклонение: ${testDifference.toFixed(1)} км)`)

              // Если это лучший результат, сохраняем его
              if (testDifference < bestDifference) {
                bestRoute = testRoute
                bestDifference = testDifference
                console.log(`✅ Новый лучший результат: отклонение ${testDifference.toFixed(1)} км`)

                // Если достигли точности ±1 км, прерываем поиск
                if (testDifference <= 1.0) {
                  console.log('🎯 Достигнута целевая точность ±1 км')
                  break
                }
              }
            }
          } catch (error) {
            console.log(`❌ Ошибка при попытке ${multiplier}:`, error.message)
          }
        }

        if (bestRoute !== directRoute) {
          console.log(`🗺️ Используем лучший найденный маршрут`)
          const extendedRoute = bestRoute

          // Проверяем, достигли ли мы целевого расстояния
          const actualDistanceKm = extendedRoute.distance / 1000
          console.log(`📏 Получили маршрут ${actualDistanceKm.toFixed(1)} км (цель: ${targetDistanceKm.toFixed(1)} км)`)

          // Проверяем, что маршрут не слишком длинный (защита от ошибок)
          const maxReasonableDistance = targetDistanceKm * 2 // максимум в 2 раза больше цели
          if (actualDistanceKm > maxReasonableDistance) {
            console.log(`⚠️ Маршрут слишком длинный (${actualDistanceKm.toFixed(1)} км), возвращаем прямой маршрут`)
            return directRoute
          }

          // Проверяем точность маршрута (допуск ±1 км)
          const toleranceKm = 1.0 // допуск ±1 км
          const difference = Math.abs(actualDistanceKm - targetDistanceKm)

          if (difference <= toleranceKm) {
            console.log(`✅ Расстояние точное: отклонение ${difference.toFixed(1)} км`)
            return extendedRoute
          } else {
            console.log(`⚠️ Расстояние неточное: отклонение ${difference.toFixed(1)} км (допуск: ±${toleranceKm} км)`)

            // Если маршрут слишком короткий или слишком длинный, возвращаем прямой
            if (difference > 5) { // если отклонение больше 5 км
              console.log('📏 Отклонение слишком большое, возвращаем прямой маршрут')
              return directRoute
            }

            // Возвращаем то, что получилось (лучше чем прямой маршрут)
            return extendedRoute
          }
        }

        return directRoute
      }

      // Функция для генерации промежуточных точек
      const generateWaypoints = async (from, to, additionalDistanceKm, directDistanceKm, offsetMultiplier = 0.2) => {
        const waypoints = []

        // Более консервативный подход к созданию промежуточных точек
        // Ограничиваем количество точек и отклонения
        const maxWaypoints = Math.min(3, Math.max(1, Math.floor(additionalDistanceKm / 5))) // максимум 3 точки
        console.log(`🗺️ Создаем ${maxWaypoints} промежуточных точек для добавления ${additionalDistanceKm.toFixed(1)} км`)

        // Создаем перпендикулярное направление к прямой линии
        const directionLat = to[0] - from[0]
        const directionLon = to[1] - from[1]

        // Перпендикулярный вектор (поворот на 90 градусов)
        const perpLat = -directionLon
        const perpLon = directionLat

        // Нормализуем перпендикулярный вектор
        const perpLength = Math.sqrt(perpLat * perpLat + perpLon * perpLon)

        if (perpLength > 0) {
          const normalizedPerpLat = perpLat / perpLength
          const normalizedPerpLon = perpLon / perpLength

          // Используем переданный коэффициент отклонения
          const maxOffsetKm = Math.min(8, additionalDistanceKm * offsetMultiplier) // используем переданный multiplier
          const offsetDistance = maxOffsetKm / 111 // преобразование км в градусы

          console.log(`📍 Используем отклонение ${offsetMultiplier} = ${maxOffsetKm.toFixed(1)} км`)

          for (let i = 0; i < maxWaypoints; i++) {
            // Создаем точки с умеренными отклонениями
            const factor = (i % 2 === 0) ? 1 : -1 // чередуем стороны
            const scaleFactor = 0.5 + (i * 0.25) // более умеренное увеличение отклонения

            // Позиция вдоль прямой линии (равномерно распределяем точки)
            const t = (i + 1) / (maxWaypoints + 1)
            const baseLat = from[0] + t * (to[0] - from[0])
            const baseLon = from[1] + t * (to[1] - from[1])

            // Добавляем отклонение
            const waypointLat = baseLat + normalizedPerpLat * offsetDistance * factor * scaleFactor
            const waypointLon = baseLon + normalizedPerpLon * offsetDistance * factor * scaleFactor

            waypoints.push([waypointLat, waypointLon])

            console.log(`📍 Точка ${i + 1}: отклонение ${(maxOffsetKm * scaleFactor).toFixed(1)} км ${factor > 0 ? 'вправо' : 'влево'}`)
          }
        }

        return waypoints
      }

      // Функция для построения маршрута
      const buildRoute = async (from, to, mode) => {
        const profile = getOSRMProfile(mode)
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`
        )

        if (!response.ok) {
          throw new Error('Ошибка сервиса построения маршрутов')
        }

        const data = await response.json()
        if (!data.routes || data.routes.length === 0) {
          throw new Error('Не удалось построить маршрут')
        }

        return data.routes[0]
      }

      // Функция для построения маршрута через промежуточные точки
      const buildRouteWithWaypoints = async (points, mode) => {
        const profile = getOSRMProfile(mode)
        const coordinates = points.map(p => `${p[1]},${p[0]}`).join(';')

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`
        )

        if (!response.ok) {
          throw new Error('Ошибка сервиса построения маршрутов')
        }

        const data = await response.json()
        if (!data.routes || data.routes.length === 0) {
          throw new Error('Не удалось построить маршрут через промежуточные точки')
        }

        return data.routes[0]
      }

      // Определяем профиль маршрута в зависимости от транспорта
      const getOSRMProfile = (mode) => {
        switch (mode) {
          case 'walking': return 'foot'
          case 'cycling': return 'bicycle'
          case 'driving':
          case 'taxi':
          case 'public_transport':
          default: return 'driving'
        }
      }

      const profile = getOSRMProfile(transportMode)
      console.log(`🚗 Строим маршрут для транспорта: ${transportMode} (профиль: ${profile})`)

      // Выбираем способ построения маршрута в зависимости от наличия totalTime
      let routeInfo
      if (totalTime && totalTime > 0) {
        console.log(`⏱️ Строим маршрут на ${totalTime} минут`)
        routeInfo = await createExtendedRoute(fromCoords, toCoords, totalTime)
      } else {
        console.log('🗺️ Строим прямой маршрут')
        routeInfo = await buildRoute(fromCoords, toCoords, transportMode)
      }

      // Проверяем валидность данных маршрута
      if (!routeInfo.geometry || !routeInfo.geometry.coordinates ||
          typeof routeInfo.distance !== 'number' || typeof routeInfo.duration !== 'number') {
        throw new Error('Получены некорректные данные маршрута')
      }

      setRoute({
        coordinates: routeInfo.geometry.coordinates.map(coord => [coord[1], coord[0]]),
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        from: fromCoords,
        to: toCoords
      })

      // Центрируем карту на маршруте
      const bounds = [
        [Math.min(fromCoords[0], toCoords[0]), Math.min(fromCoords[1], toCoords[1])],
        [Math.max(fromCoords[0], toCoords[0]), Math.max(fromCoords[1], toCoords[1])]
      ]
      setMapCenter([(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2])

    } catch (error) {
      console.error('Ошибка построения маршрута:', error)
      throw error // Пробрасываем ошибку для обработки в компоненте
    }
  }

  // Обработчик изменения состояния модального окна аутентификации
  const handleAuthModalChange = (isOpen) => {
    setIsAuthModalOpen(isOpen)
  }

  // Обработчик открытия полноэкранной карты
  const handleStartJourney = () => {
    console.log('Starting journey with route:', route)
    if (route) {
      setIsFullscreenMap(true)
    } else {
      console.error('No route available for fullscreen map')
    }
  }

  // Обработчик закрытия полноэкранной карты
  const handleCloseFullscreenMap = () => {
    setIsFullscreenMap(false)
  }

  // Показываем загрузку во время инициализации аутентификации
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка CityStep...</p>
        </div>
      </div>
    )
  }

  // Показываем экран приветствия для неавторизованных пользователей
  if (!isAuthenticated) {
    return <WelcomeScreen />
  }

  // Полноэкранная карта
  if (isFullscreenMap && route) {
    try {
      const mapCenterForFullscreen = route?.from || mapCenter || [55.7558, 37.6176]

      return (
        <div className="fullscreen-map">
          <div className="fullscreen-header">
            <button
              onClick={handleCloseFullscreenMap}
              className="close-fullscreen-btn"
              title="Закрыть полноэкранный режим"
            >
              ✕ Закрыть
            </button>
            <h2>🗺️ Навигация по маршруту</h2>
            <div className="scale-info">Масштаб 1:100</div>
          </div>
          <div className="fullscreen-map-component">
            <MapComponent
              center={mapCenterForFullscreen}
              markers={markers || []}
              route={route}
              userLocation={userLocation}
              zoom={18}
              className="fullscreen-map-component"
            />
          </div>
        </div>
      )
    } catch (error) {
      console.error('Error rendering fullscreen map:', error)
      return (
        <div className="fullscreen-map">
          <div className="fullscreen-header">
            <button onClick={handleCloseFullscreenMap}>✕ Закрыть</button>
            <h2>Ошибка загрузки карты</h2>
          </div>
          <div style={{ padding: '20px', color: 'red' }}>
            Произошла ошибка при загрузке карты: {error.message}
          </div>
        </div>
      )
    }
  }

  // Основное приложение для авторизованных пользователей
  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>CityStep</h1>
          <UserButton onAuthModalChange={handleAuthModalChange} />
        </div>

        <SearchPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          markers={markers}
          setMapCenter={setMapCenter}
        />

        <RoutePanel
          routeFrom={routeFrom}
          setRouteFrom={setRouteFrom}
          routeTo={routeTo}
          setRouteTo={setRouteTo}
          onRouteSearch={handleRouteSearch}
          route={route}
          userLocation={userLocation}
        />


      </div>

      {/* Карта в правом верхнем углу - четверть экрана */}
      <div className={`map-container ${isAuthModalOpen ? 'map-hidden' : ''}`}>
        {!isAuthModalOpen && (
          <MapComponent
            center={mapCenter}
            markers={markers}
            route={route}
            userLocation={userLocation}
          />
        )}
        {isAuthModalOpen && (
          <div className="map-placeholder">
            <div className="map-placeholder-content">
              <h2>🗺️ CityStep</h2>
              <p>Карта</p>
            </div>
          </div>
        )}
      </div>

      {/* Дополнительная панель справа снизу */}
      <div className="additional-panel">
        <h3>📊 Информация о маршруте</h3>
        {route ? (
          <div className="route-details">
            <div className="route-stat">
              <span className="stat-label">Расстояние:</span>
              <span className="stat-value">{route.distance || 'Неизвестно'}</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Время:</span>
              <span className="stat-value">{route.duration || 'Неизвестно'}</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Тип:</span>
              <span className="stat-value">🚶‍♂️ Пешком</span>
            </div>
            <button
              onClick={handleStartJourney}
              className="journey-button"
              title="Открыть карту на весь экран с масштабом 1:100"
            >
              🗺️ В путь
            </button>
          </div>
        ) : (
          <div className="no-route">
            <p>Постройте маршрут, чтобы увидеть детали</p>
            <div className="route-tips">
              <h4>💡 Возможности:</h4>
              <ul>
                <li>🚶‍♂️ Только пешеходные маршруты</li>
                <li>⏰ Установка времени отправления</li>
                <li>🛑 Добавление остановок</li>
                <li>☕ Поиск кафе и ресторанов</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Компонент отладки геолокации */}
      <LocationDebug userLocation={userLocation} />
    </div>
  )
}

export default App
