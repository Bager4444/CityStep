import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import MapComponent from './components/MapComponent'
import FullscreenNavigationMap from './components/FullscreenNavigationMap'
import './components/FullscreenNavigationMap.css'
import SearchPanel from './components/SearchPanel'
import RoutePanel from './components/RoutePanel'
import PriorityConfigPanel from './components/PriorityConfigPanel'
import RouteAnalysisPanel from './components/RouteAnalysisPanel'
import WaypointsPanel from './components/WaypointsPanel'
import LocationDebug from './components/LocationDebug'
import UserButton from './components/UserButton'
import WelcomeScreen from './components/WelcomeScreen'
import geolocationService from './services/GeolocationService'
import RoadPriorityService from './services/RoadPriorityService'
import IntelligentRouter from './services/IntelligentRouter'
import { formatDistance, formatDuration, formatSpeed, formatArrivalTime } from './utils/formatters'
import './App.css'

function App() {
  const { isAuthenticated, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [routeFrom, setRouteFrom] = useState('')
  const [routeTo, setRouteTo] = useState('')
  const [waypoints, setWaypoints] = useState([]) // Промежуточные точки
  const [mapCenter, setMapCenter] = useState([55.7558, 37.6176]) // Москва
  const [markers, setMarkers] = useState([])
  const [route, setRoute] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [mapKey, setMapKey] = useState(0) // Для принудительного обновления карты
  const [forceUpdate, setForceUpdate] = useState(0) // Дополнительное принудительное обновление
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isFullscreenMap, setIsFullscreenMap] = useState(false)

  // Состояния для системы приоритизации дорог
  const [priorityService] = useState(() => new RoadPriorityService())
  const [intelligentRouter] = useState(() => new IntelligentRouter(new RoadPriorityService()))
  const [routeAnalysis, setRouteAnalysis] = useState(null)
  const [isPriorityConfigOpen, setIsPriorityConfigOpen] = useState(false)
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false)
  const [isWaypointsPanelOpen, setIsWaypointsPanelOpen] = useState(false)
  const [useIntelligentRouting, setUseIntelligentRouting] = useState(false) // Отключаем по умолчанию для отладки

  // Получение высокоточной геолокации пользователя
  useEffect(() => {
    const initializeGeolocation = async () => {
      if (!geolocationService.isSupported()) {
        console.warn('🚫 Геолокация не поддерживается этим браузером')
        return
      }

      try {
        // Детальная диагностика геолокации
        console.log('🔍 Диагностика геолокации:')
        console.log('- Поддержка геолокации:', geolocationService.isSupported())
        console.log('- Протокол:', window.location.protocol)
        console.log('- Хост:', window.location.host)
        console.log('- User Agent:', navigator.userAgent.substring(0, 100) + '...')

        // Запрашиваем разрешение на геолокацию
        console.log('📍 Запрашиваем разрешение на геолокацию...')
        await geolocationService.requestPermission()
        console.log('✅ Разрешение на геолокацию получено')

        // Получаем текущее местоположение с максимальной точностью
        console.log('🎯 Получаем высокоточное местоположение...')
        const position = await geolocationService.getCurrentPosition(true)

        console.log('🎯 Высокоточное местоположение получено:', {
          coordinates: position.coordinates,
          accuracy: `${position.accuracy}м (${position.accuracyText})`,
          speed: position.speedKmh ? `${position.speedKmh} км/ч` : 'неподвижен',
          heading: position.headingText || 'неизвестно',
          timestamp: new Date(position.timestamp).toLocaleTimeString()
        })

        // Проверяем, находится ли пользователь в Москве
        const [lat, lon] = position.coordinates
        console.log(`📍 Местоположение пользователя: [${lat.toFixed(6)}, ${lon.toFixed(6)}]`)
        console.log(`🗺️ Границы Москвы: широта 55.1-56.0, долгота 36.8-38.2`)

        if (lat > 55.1 && lat < 56.0 && lon > 36.8 && lon < 38.2) {
          setUserLocation(position.coordinates)
          setMapCenter(position.coordinates)
          console.log('✅ Пользователь в Москве - карта центрирована на его местоположении')
        } else {
          console.warn(`⚠️ Пользователь находится вне Москвы: [${lat.toFixed(6)}, ${lon.toFixed(6)}]`)
          console.log('🗺️ Карта остается центрированной на Москве')
          console.log('💡 Для тестирования можно использовать эмуляцию местоположения в браузере')
          // Не устанавливаем userLocation для использования в маршрутах
          setUserLocation(null)
        }

        // Начинаем отслеживание местоположения для постоянных обновлений
        console.log('🔄 Запускаем отслеживание местоположения...')
        geolocationService.startWatching(
          (updatedPosition) => {
            const [lat, lon] = updatedPosition.coordinates

            // Проверяем, что обновленное местоположение тоже в Москве
            if (lat > 55.1 && lat < 56.0 && lon > 36.8 && lon < 38.2) {
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
            } else {
              console.warn(`⚠️ Обновленное местоположение вне Москвы: [${lat.toFixed(4)}, ${lon.toFixed(4)}] - игнорируем`)
              setUserLocation(null)
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

  // Отслеживание изменений маршрута для принудительного обновления
  useEffect(() => {
    if (route) {
      console.log('🔄 *** useEffect: route изменился ***')
      console.log('🔄 route:', route)
      console.log('🔄 coordinates length:', route.coordinates?.length)

      // Принудительно обновляем компоненты
      setForceUpdate(prev => prev + 1)
      setMapKey(prev => prev + 1)

      console.log('🔄 *** Принудительное обновление выполнено ***')
    }
  }, [route])

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
      // Используем Nominatim API для поиска адресов в Москве с ограничением области
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Москва, Россия')}&limit=5&addressdetails=1&bounded=1&viewbox=36.8,56.0,38.2,55.1&countrycodes=ru`
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
    console.log('🚀 *** ВЫЗВАНА handleRouteSearch ***')
    console.log('🔍 Параметры:', { transportMode, totalTime })
    console.log('🔍 Состояние waypoints:', waypoints)
    console.log('🔍 Количество waypoints:', waypoints.length)

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
      totalTime: totalTime,
      waypointsCount: waypoints.length
    })

    try {
      // Обработка специального случая "Мое местоположение"
      let fromQuery = routeFrom.trim()
      let fromCoords = null

      if (fromQuery === 'Мое местоположение') {
        if (!userLocation) {
          throw new Error('Местоположение недоступно. Возможно, вы находитесь вне Москвы или не предоставили разрешение на геолокацию.')
        }

        // Дополнительная проверка, что местоположение в Москве
        const [lat, lon] = userLocation
        if (lat < 55.1 || lat > 56.0 || lon < 36.8 || lon > 38.2) {
          throw new Error(`Ваше местоположение [${lat.toFixed(4)}, ${lon.toFixed(4)}] находится вне Москвы. Приложение работает только в Москве.`)
        }

        fromCoords = userLocation
        console.log('✅ Используем местоположение пользователя:', fromCoords)
      } else {
        // Геокодируем начальную точку с ограничением по Москве
        console.log('🔍 Ищем начальную точку:', fromQuery)
        const fromResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromQuery + ', Москва, Россия')}&limit=1&addressdetails=1&bounded=1&viewbox=36.8,56.0,38.2,55.1&countrycodes=ru`
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

        // Проверяем, что координаты в пределах Москвы
        if (fromCoords[0] < 55.1 || fromCoords[0] > 56.0 || fromCoords[1] < 36.8 || fromCoords[1] > 38.2) {
          console.warn(`⚠️ Начальная точка вне Москвы: [${fromCoords[0]}, ${fromCoords[1]}]`)
          throw new Error(`Начальная точка "${fromQuery}" находится вне Москвы`)
        }
      }

      // Геокодируем конечную точку с ограничением по Москве
      console.log('🔍 Ищем конечную точку:', routeTo.trim())
      const toResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(routeTo.trim() + ', Москва, Россия')}&limit=1&addressdetails=1&bounded=1&viewbox=36.8,56.0,38.2,55.1&countrycodes=ru`
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

      // Проверяем, что координаты в пределах Москвы
      if (toCoords[0] < 55.1 || toCoords[0] > 56.0 || toCoords[1] < 36.8 || toCoords[1] > 38.2) {
        console.warn(`⚠️ Конечная точка вне Москвы: [${toCoords[0]}, ${toCoords[1]}]`)
        throw new Error(`Конечная точка "${routeTo.trim()}" находится вне Москвы`)
      }

      // Проверяем, что точки не совпадают
      const distance = Math.sqrt(
        Math.pow(fromCoords[0] - toCoords[0], 2) + Math.pow(fromCoords[1] - toCoords[1], 2)
      )
      if (distance < 0.001) {
        throw new Error('Начальная и конечная точки слишком близко друг к другу')
      }

      // Строим маршрут с учетом промежуточных точек
      console.log(`📍 Промежуточных точек: ${waypoints.length}`)
      let allPoints = [fromCoords]

      // Добавляем промежуточные точки
      if (waypoints.length > 0) {
        console.log('🗺️ Добавляем промежуточные точки в маршрут:', waypoints)
        for (const waypoint of waypoints) {
          // Используем coordinates массив [lat, lon]
          if (waypoint.coordinates && waypoint.coordinates.length === 2) {
            allPoints.push(waypoint.coordinates)
            console.log(`📍 Добавлена промежуточная точка: [${waypoint.coordinates[0]}, ${waypoint.coordinates[1]}]`)
          } else {
            console.warn('⚠️ Некорректные координаты промежуточной точки:', waypoint)
          }
        }
      }

      allPoints.push(toCoords)
      console.log(`🗺️ *** ДЕТАЛЬНАЯ ДИАГНОСТИКА ТОЧЕК МАРШРУТА ***`)
      console.log(`🗺️ waypoints.length: ${waypoints.length}`)
      console.log(`🗺️ waypoints:`, waypoints)
      console.log(`🗺️ allPoints.length: ${allPoints.length}`)
      console.log(`🗺️ allPoints:`, allPoints)
      console.log(`🗺️ fromCoords:`, fromCoords)
      console.log(`🗺️ toCoords:`, toCoords)

      const profile = getOSRMProfile(transportMode)
      console.log(`🚗 Строим маршрут для транспорта: ${transportMode} (профиль: ${profile})`)

      // Выбираем способ построения маршрута
      let routeInfo

      try {
        // Преобразуем totalTime в число для корректной проверки
        const totalTimeNum = totalTime ? parseFloat(totalTime) : 0

        console.log('🔍 Проверка условий маршрута:')
        console.log('- totalTime (исходное):', totalTime, 'тип:', typeof totalTime)
        console.log('- totalTimeNum (число):', totalTimeNum, 'тип:', typeof totalTimeNum)
        console.log('- totalTimeNum > 0:', totalTimeNum > 0)
        console.log('- useIntelligentRouting:', useIntelligentRouting)
        console.log('- waypoints.length:', waypoints.length)

        if (totalTimeNum && totalTimeNum > 0) {
          console.log(`⏱️ *** РЕЖИМ ПО ВРЕМЕНИ *** Строим маршрут на ${totalTime} минут`)
          console.log('🔍 Параметры:', { totalTime, type: typeof totalTime })

          // Для маршрута по времени игнорируем промежуточные точки
          if (waypoints.length > 0) {
            console.log('⚠️ При указании времени промежуточные точки игнорируются')
          }

          console.log('🔍 Целевое время в минутах:', totalTimeNum)

          routeInfo = await createExtendedRoute(fromCoords, toCoords, totalTimeNum)
        } else if (useIntelligentRouting) {
          console.log('🧠 Строим оптимизированный маршрут с приоритизацией')

          // Показываем уведомление пользователю
          const notification = document.createElement('div')
          notification.className = 'intelligent-routing-notification'
          notification.innerHTML = '🧠 Строим оптимальный маршрут с учетом приоритетов...'
          document.body.appendChild(notification)

          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 3000)

          try {
            // Строим базовый маршрут
            const baseRoute = allPoints.length > 2 ?
              await buildRouteWithWaypoints(allPoints, transportMode) :
              await buildRoute(fromCoords, toCoords, transportMode)

            // Применяем интеллектуальную приоритизацию
            const optimizedRoute = await priorityService.optimizeRoute(baseRoute, {
              transportMode,
              currentTime: new Date(),
              weather: 'clear',
              userPreferences: {
                avoidTraffic: true,
                preferScenic: false,
                prioritizeSafety: true
              }
            })

            console.log('🧠 Маршрут оптимизирован:', optimizedRoute)
            routeInfo = optimizedRoute

            // Анализируем маршрут
            const analysis = await priorityService.prioritizeRoute(routeInfo, {
              transportMode,
              currentTime: new Date(),
              weather: 'clear'
            })

            setRouteAnalysis(analysis)
            console.log('📊 Анализ маршрута:', analysis)

          } catch (optimizationError) {
            console.warn('⚠️ Ошибка оптимизации, используем стандартный маршрут:', optimizationError.message)

            // Fallback к стандартному маршруту
            routeInfo = allPoints.length > 2 ?
              await buildRouteWithWaypoints(allPoints, transportMode) :
              await buildRoute(fromCoords, toCoords, transportMode)
          }
        } else {
          console.log('📍 Строим стандартный маршрут')
          console.log(`🔍 Отладка: allPoints.length = ${allPoints.length}, waypoints.length = ${waypoints.length}`)
          console.log('🔍 Отладка: allPoints =', allPoints)

          // Проверяем наличие промежуточных точек
          if (allPoints.length > 2) {
            console.log(`🗺️ Маршрут с ${waypoints.length} промежуточными точками`)
            console.log('🔄 Вызываем buildRouteWithWaypoints...')
            routeInfo = await buildRouteWithWaypoints(allPoints, transportMode)
          } else {
            console.log('🗺️ Прямой маршрут без промежуточных точек')
            console.log('🔄 Вызываем buildRoute...')
            routeInfo = await buildRoute(fromCoords, toCoords, transportMode)
          }
        }
      } catch (routeBuildError) {
        console.error('❌ Критическая ошибка построения маршрута:', routeBuildError)
        console.error('❌ Стек ошибки:', routeBuildError.stack)
        console.error('❌ Сообщение ошибки:', routeBuildError.message)

        // Пытаемся построить простой маршрут без промежуточных точек как fallback
        console.log('🔄 Пытаемся построить простой маршрут без промежуточных точек...')
        try {
          routeInfo = await buildRoute(fromCoords, toCoords, transportMode)
          console.log('✅ Fallback маршрут построен успешно')
        } catch (fallbackError) {
          console.error('❌ Даже fallback маршрут не удалось построить:', fallbackError)
          console.error('❌ Fallback стек ошибки:', fallbackError.stack)
          throw new Error(`Не удалось построить маршрут. Ошибка: ${routeBuildError.message}. Fallback ошибка: ${fallbackError.message}`)
        }
      }

      // Проверяем результат
      if (!routeInfo || !routeInfo.geometry || !routeInfo.geometry.coordinates) {
        throw new Error('Не удалось построить маршрут - некорректные данные от сервера')
      }

      console.log('✅ Маршрут успешно построен:', {
        distance: `${routeInfo.distance}м (${(routeInfo.distance / 1000).toFixed(1)}км)`,
        duration: `${routeInfo.duration}с (${Math.round(routeInfo.duration / 60)}мин)`,
        speed: `${((routeInfo.distance / 1000) / (routeInfo.duration / 3600)).toFixed(1)}км/ч`,
        coordinates: routeInfo.geometry.coordinates.length,
        segments: routeInfo.segments ? routeInfo.segments.length : 0
      })

      // Создаем объект маршрута для состояния
      const routeData = {
        coordinates: routeInfo.geometry.coordinates, // Координаты от OSRM в формате [lon, lat]
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        from: fromCoords, // [lat, lon]
        to: toCoords,     // [lat, lon]
        segments: routeInfo.segments || null,
        waypoints: waypoints.length
      }

      console.log('🎯 *** УСТАНАВЛИВАЕМ РЕАЛЬНЫЙ МАРШРУТ ***')
      console.log('🎯 routeData:', routeData)
      console.log('🎯 coordinates length:', routeData.coordinates?.length)
      console.log('🎯 первые 3 координаты:', routeData.coordinates?.slice(0, 3))

      setRoute(routeData)
      setMapKey(prev => prev + 1) // Принудительно обновляем карту

      console.log('🎯 *** setRoute ВЫЗВАН С РЕАЛЬНЫМ МАРШРУТОМ ***')
      console.log('🎯 *** mapKey обновлен ***')

      // Принудительно обновляем центр карты для перерендера
      setTimeout(() => {
        console.log('🎯 Обновляем центр карты для перерендера')
        setMapCenter([...fromCoords]) // Создаем новый массив для принудительного обновления
      }, 100)

      // Центрируем карту на маршруте
      const bounds = routeInfo.geometry.coordinates
      if (bounds.length > 0) {
        const lats = bounds.map(coord => coord[0])
        const lngs = bounds.map(coord => coord[1])
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
        setMapCenter([centerLat, centerLng])
        console.log('🎯 Карта центрирована на маршруте:', [centerLat, centerLng])
      }

    } catch (error) {
      console.error('❌ Ошибка построения маршрута:', error)
      throw error // Пробрасываем ошибку для обработки в RoutePanel
    }
  }

  // Функция для построения маршрута через промежуточные точки как серии отдельных маршрутов
  const buildRouteWithWaypoints = async (points, mode) => {
    console.log(`🗺️ *** ВЫЗВАНА buildRouteWithWaypoints *** Строим маршрут через ${points.length} точек как серию отдельных маршрутов`)
    console.log('🔍 Входные точки:', points)
    console.log('🔍 Режим транспорта:', mode)

    // Валидация входных данных
    if (!points || points.length < 2) {
      throw new Error('Недостаточно точек для построения маршрута')
    }

    // Проверяем, что все точки имеют корректные координаты
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      if (!point || !Array.isArray(point) || point.length !== 2 ||
          isNaN(point[0]) || isNaN(point[1])) {
        console.error(`❌ Некорректная точка ${i + 1}:`, point)
        throw new Error(`Некорректные координаты точки ${i + 1}`)
      }
    }

    const segments = []
    let totalDistance = 0
    let totalDuration = 0
    let allCoordinates = []

    // Строим маршрут между каждой парой соседних точек
    for (let i = 0; i < points.length - 1; i++) {
      const fromPoint = points[i]
      const toPoint = points[i + 1]

      console.log(`📍 Сегмент ${i + 1}: от [${fromPoint[0].toFixed(4)}, ${fromPoint[1].toFixed(4)}] до [${toPoint[0].toFixed(4)}, ${toPoint[1].toFixed(4)}]`)

      try {
        const segmentRoute = await buildRoute(fromPoint, toPoint, mode)

        // Проверяем результат сегмента
        if (!segmentRoute || !segmentRoute.geometry || !segmentRoute.geometry.coordinates) {
          throw new Error(`Пустой результат для сегмента ${i + 1}`)
        }

        segments.push(segmentRoute)
        totalDistance += segmentRoute.distance || 0
        totalDuration += segmentRoute.duration || 0

        // Добавляем координаты сегмента к общему маршруту
        if (i === 0) {
          // Для первого сегмента добавляем все координаты
          allCoordinates.push(...segmentRoute.geometry.coordinates)
        } else {
          // Для остальных сегментов пропускаем первую координату (чтобы избежать дублирования)
          allCoordinates.push(...segmentRoute.geometry.coordinates.slice(1))
        }

        console.log(`✅ Сегмент ${i + 1} построен: ${segmentRoute.distance}м (${(segmentRoute.distance/1000).toFixed(1)}км), ${segmentRoute.duration}с (${Math.round(segmentRoute.duration/60)}мин), скорость: ${((segmentRoute.distance/1000)/(segmentRoute.duration/3600)).toFixed(1)}км/ч`)
      } catch (error) {
        console.error(`❌ Ошибка построения сегмента ${i + 1}:`, error)
        throw new Error(`Не удалось построить маршрут через точку ${i + 1}: ${error.message}`)
      }
    }

    console.log(`✅ Составной маршрут построен: ${segments.length} сегментов, ${totalDistance}м, ${totalDuration}с`)
    console.log(`📊 Общее количество координат: ${allCoordinates.length}`)
    console.log(`🎨 Сегменты для отображения:`, segments.map((seg, i) => ({
      index: i + 1,
      distance: seg.distance,
      duration: seg.duration,
      coordinates: seg.geometry.coordinates.length
    })))

    // Возвращаем объединенный маршрут в формате, совместимом с остальным кодом
    return {
      geometry: {
        coordinates: allCoordinates
      },
      distance: totalDistance,
      duration: totalDuration,
      segments: segments // Массив сегментов для отображения разными цветами
    }
  }

  // Определяем профиль маршрута в зависимости от транспорта
  const getOSRMProfile = (mode) => {
    switch (mode) {
      case 'walking': return 'foot'
      case 'cycling': return 'bicycle'
      case 'driving': return 'driving'
      case 'taxi': return 'driving'
      case 'public_transport': return 'driving'
      default: return 'foot' // По умолчанию пешеходный режим
    }
  }

  // Базовая функция построения маршрута между двумя точками
  const buildRoute = async (fromCoords, toCoords, mode = 'walking') => {
    const profile = getOSRMProfile(mode)
    console.log(`🛣️ Строим маршрут от [${fromCoords[0].toFixed(4)}, ${fromCoords[1].toFixed(4)}] до [${toCoords[0].toFixed(4)}, ${toCoords[1].toFixed(4)}] (${profile})`)

    // Формируем URL для OSRM API
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson&steps=true`

    console.log('🌐 OSRM запрос:', osrmUrl)

    try {
      const response = await fetch(osrmUrl)

      if (!response.ok) {
        console.error('❌ OSRM API ошибка:', response.status, response.statusText)
        throw new Error(`Ошибка сервера маршрутизации: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 OSRM ответ:', data)

      if (!data.routes || data.routes.length === 0) {
        console.error('❌ Маршруты не найдены в ответе OSRM')
        throw new Error('Маршрут не найден')
      }

      const route = data.routes[0]

      if (!route.geometry || !route.geometry.coordinates) {
        console.error('❌ Некорректная геометрия маршрута')
        throw new Error('Некорректные данные маршрута')
      }

      // OSRM возвращает координаты в формате [lng, lat], оставляем как есть
      // MapComponent сам поменяет местами при отрисовке
      const coordinates = route.geometry.coordinates

      console.log(`✅ Маршрут построен: ${route.distance}м, ${route.duration}с, ${coordinates.length} точек`)
      console.log('🔍 Первые 3 координаты от OSRM:', coordinates.slice(0, 3))

      return {
        geometry: {
          coordinates: coordinates // [lng, lat] формат от OSRM
        },
        distance: route.distance,
        duration: route.duration,
        legs: route.legs || []
      }

    } catch (error) {
      console.error('❌ Ошибка построения маршрута:', error)
      throw new Error(`Не удалось построить маршрут: ${error.message}`)
    }
  }

  // Функция создания расширенного маршрута на заданное время
  const createExtendedRoute = async (fromCoords, toCoords, targetMinutes) => {
    console.log(`⏱️ *** ВЫЗВАНА createExtendedRoute *** Создаем расширенный маршрут на ${targetMinutes} минут`)
    console.log('🔍 Входные координаты:', { fromCoords, toCoords })

    try {
      // Валидация входных данных
      if (!fromCoords || !toCoords || !Array.isArray(fromCoords) || !Array.isArray(toCoords)) {
        throw new Error('Некорректные координаты для создания расширенного маршрута')
      }

      if (targetMinutes <= 0 || targetMinutes > 300) { // максимум 5 часов
        throw new Error(`Некорректное время: ${targetMinutes} минут`)
      }

      // Сначала строим прямой маршрут
      console.log('🔄 Строим прямой маршрут...')
      const directRoute = await buildRoute(fromCoords, toCoords, 'walking')
      const directTimeMinutes = directRoute.duration / 60

      console.log(`📊 Прямой маршрут: ${directTimeMinutes.toFixed(1)} минут, цель: ${targetMinutes} минут`)

      // Если прямой маршрут уже достаточно длинный (в пределах 10% от цели)
      if (directTimeMinutes >= targetMinutes * 0.9) {
        console.log('✅ Прямой маршрут уже достаточно длинный')
        return directRoute
      }

      // Если нужно удлинить маршрут, создаем более безопасные промежуточные точки
      const additionalTime = targetMinutes - directTimeMinutes
      console.log(`⏰ Нужно добавить ${additionalTime.toFixed(1)} минут`)

      // Создаем промежуточные точки более консервативно
      const midPoint = [
        (fromCoords[0] + toCoords[0]) / 2,
        (fromCoords[1] + toCoords[1]) / 2
      ]

      // Уменьшаем отклонение и проверяем границы Москвы
      const baseDetourDistance = Math.min(additionalTime * 0.0005, 0.01) // максимум 0.01 градуса

      // Создаем несколько вариантов промежуточных точек
      const detourOptions = [
        [midPoint[0] + baseDetourDistance, midPoint[1]],
        [midPoint[0] - baseDetourDistance, midPoint[1]],
        [midPoint[0], midPoint[1] + baseDetourDistance],
        [midPoint[0], midPoint[1] - baseDetourDistance]
      ]

      // Фильтруем точки, чтобы они были в пределах Москвы
      const validDetourPoints = detourOptions.filter(point =>
        point[0] >= 55.1 && point[0] <= 56.0 &&
        point[1] >= 36.8 && point[1] <= 38.2
      )

      if (validDetourPoints.length === 0) {
        console.log('⚠️ Не удалось создать валидные промежуточные точки, возвращаем прямой маршрут')
        return directRoute
      }

      // Берем первую валидную точку
      const detourPoint = validDetourPoints[0]
      console.log('🗺️ Создаем маршрут с промежуточной точкой:', detourPoint)

      const extendedRoute = await buildRouteWithWaypoints([fromCoords, detourPoint, toCoords], 'walking')

      const extendedTimeMinutes = extendedRoute.duration / 60
      console.log(`✅ Расширенный маршрут создан: ${extendedTimeMinutes.toFixed(1)} минут (цель: ${targetMinutes} минут)`)

      return extendedRoute

    } catch (error) {
      console.error('❌ Ошибка создания расширенного маршрута:', error)
      console.error('❌ Стек ошибки:', error.stack)

      // Fallback к прямому маршруту
      try {
        console.log('🔄 Fallback: строим прямой маршрут...')
        return await buildRoute(fromCoords, toCoords, 'walking')
      } catch (fallbackError) {
        console.error('❌ Даже fallback не удался:', fallbackError)
        throw new Error(`Не удалось создать маршрут на ${targetMinutes} минут: ${error.message}`)
      }
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

  // Обработчики для системы приоритизации
  const handleOpenPriorityConfig = () => {
    setIsPriorityConfigOpen(true)
  }

  const handleClosePriorityConfig = () => {
    setIsPriorityConfigOpen(false)
  }

  const handlePriorityConfigChange = (newConfig) => {
    console.log('🎛️ Конфигурация приоритизации изменена:', newConfig)
    // При изменении конфигурации можно пересчитать анализ текущего маршрута
    if (route && routeAnalysis) {
      handleReanalyzeRoute()
    }
  }

  const handleOpenAnalysisPanel = () => {
    setIsAnalysisPanelOpen(true)
  }

  const handleCloseAnalysisPanel = () => {
    setIsAnalysisPanelOpen(false)
  }

  const handleAlternativeSelect = async (alternative) => {
    console.log('🔄 Выбрана альтернатива:', alternative)
    // Применяем новую конфигурацию и пересчитываем маршрут
    priorityService.updateUserConfig({ factors: alternative.config })

    if (route) {
      await handleReanalyzeRoute()
    }

    setIsAnalysisPanelOpen(false)
  }

  const handleReanalyzeRoute = async () => {
    if (!route) return

    try {
      console.log('🔄 Пересчитываем анализ маршрута...')
      const analysis = await priorityService.prioritizeRoute(route, {
        transportMode: 'walking',
        currentTime: new Date(),
        weather: 'clear'
      })

      setRouteAnalysis(analysis)
      console.log('✅ Анализ пересчитан:', analysis)
    } catch (error) {
      console.warn('⚠️ Ошибка при пересчете анализа:', error.message)
    }
  }

  // Обработчики для промежуточных точек
  const handleOpenWaypointsPanel = () => {
    setIsWaypointsPanelOpen(true)
  }

  const handleCloseWaypointsPanel = () => {
    setIsWaypointsPanelOpen(false)
  }

  const handleWaypointsChange = (newWaypoints) => {
    setWaypoints(newWaypoints)
    console.log('📍 Промежуточные точки обновлены:', newWaypoints)
  }

  const handleAddWaypoint = async (waypoint) => {
    try {
      console.log('➕ *** ВЫЗВАНА handleAddWaypoint ***')
      console.log('🔍 Добавляемая точка:', waypoint)
      console.log('🔍 Текущие waypoints до добавления:', waypoints)

      const newWaypoints = [...waypoints, waypoint]
      setWaypoints(newWaypoints)
      console.log('➕ Добавлена промежуточная точка:', waypoint)
      console.log('🔍 Новые waypoints после добавления:', newWaypoints)

      // Автоматически пересчитываем маршрут, если есть начальная и конечная точки
      if (routeFrom.trim() && routeTo.trim()) {
        try {
          console.log('🔄 Пересчитываем маршрут с новой промежуточной точкой...')
          await handleRouteSearch('walking')
        } catch (error) {
          console.warn('⚠️ Ошибка при пересчете маршрута:', error.message)
          // Не пробрасываем ошибку дальше, чтобы не сломать интерфейс
        }
      }
    } catch (error) {
      console.error('❌ Ошибка при добавлении промежуточной точки:', error)
      // Показываем пользователю сообщение об ошибке, но не ломаем интерфейс
    }
  }

  const handleRemoveWaypoint = async (waypointId) => {
    try {
      const newWaypoints = waypoints.filter(wp => wp.id !== waypointId)
      setWaypoints(newWaypoints)
      console.log('➖ Удалена промежуточная точка:', waypointId)

      // Автоматически пересчитываем маршрут, если есть начальная и конечная точки
      if (routeFrom.trim() && routeTo.trim()) {
        try {
          console.log('🔄 Пересчитываем маршрут после удаления промежуточной точки...')
          await handleRouteSearch('walking')
        } catch (error) {
          console.warn('⚠️ Ошибка при пересчете маршрута:', error.message)
          // Не пробрасываем ошибку дальше, чтобы не сломать интерфейс
        }
      }
    } catch (error) {
      console.error('❌ Ошибка при удалении промежуточной точки:', error)
      // Показываем пользователю сообщение об ошибке, но не ломаем интерфейс
    }
  }

  const handleReorderWaypoints = async (reorderedWaypoints) => {
    setWaypoints(reorderedWaypoints)
    console.log('🔄 Изменен порядок промежуточных точек:', reorderedWaypoints)

    // Автоматически пересчитываем маршрут, если есть начальная и конечная точки
    if (routeFrom.trim() && routeTo.trim()) {
      try {
        console.log('🔄 Пересчитываем маршрут с новым порядком точек...')
        await handleRouteSearch('walking')
      } catch (error) {
        console.warn('⚠️ Ошибка при пересчете маршрута:', error.message)
      }
    }
  }

  // Обработчик клика по карте для перемещения
  const handleMapClick = (latlng) => {
    console.log('🗺️ Клик по карте:', latlng)

    // Проверяем, что клик в пределах Москвы
    if (latlng.lat >= 55.1 && latlng.lat <= 56.0 && latlng.lng >= 36.8 && latlng.lng <= 38.2) {
      // Центрируем карту на точке клика
      setMapCenter([latlng.lat, latlng.lng])
      console.log('🎯 Карта перецентрирована на:', [latlng.lat, latlng.lng])
    } else {
      console.warn('⚠️ Клик вне области Москвы, игнорируем')
    }
  }

  // Обработчик движений карты (перетаскивание, зум)
  const handleMapMove = (newCenter, newZoom) => {
    console.log('🗺️ Карта перемещена пользователем:', { center: newCenter, zoom: newZoom })

    // Обновляем центр карты при перетаскивании
    setMapCenter(newCenter)

    // Можно также обновить зум, если нужно
    // setMapZoom(newZoom)
  }

  // Обработчик кнопки "Моё местоположение"
  const handleGoToMyLocation = () => {
    if (userLocation) {
      setMapCenter(userLocation)
      console.log('📍 Карта центрирована на местоположении пользователя:', userLocation)
    } else {
      console.warn('⚠️ Местоположение пользователя недоступно')
      // Можно показать уведомление пользователю
      alert('Местоположение недоступно. Убедитесь, что вы находитесь в Москве и разрешили доступ к геолокации.')
    }
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
      console.log('🗺️ Полноэкранная карта - центр:', mapCenterForFullscreen)
      console.log('🗺️ Полноэкранная карта - маршрут:', {
        coordinates: route?.coordinates?.length,
        from: route?.from,
        to: route?.to
      })

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
              waypoints={waypoints}
              userLocation={userLocation}
              zoom={18}
              className="fullscreen"
            />
            {/* Кнопка "Моё местоположение" в полноэкранном режиме */}
            <button
              onClick={handleGoToMyLocation}
              className={`my-location-btn fullscreen-location-btn ${userLocation ? 'available' : 'unavailable'}`}
              title={userLocation ? 'Перейти к моему местоположению' : 'Местоположение недоступно'}
              disabled={!userLocation}
            >
              📍
            </button>
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
  console.log('🏠 App render - состояние route:', {
    routeExists: !!route,
    routeCoordinatesLength: route?.coordinates?.length,
    routeDistance: route?.distance,
    routeDuration: route?.duration
  })

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
          userLocation={userLocation}
        />

        <RoutePanel
          routeFrom={routeFrom}
          setRouteFrom={setRouteFrom}
          routeTo={routeTo}
          setRouteTo={setRouteTo}
          waypoints={waypoints}
          onAddWaypoint={handleAddWaypoint}
          onRemoveWaypoint={handleRemoveWaypoint}
          onRouteSearch={handleRouteSearch}
          route={route}
          userLocation={userLocation}
        />


      </div>

      {/* Карта в правом верхнем углу - четверть экрана */}
      <div className={`map-container ${isAuthModalOpen ? 'map-hidden' : ''}`}>
        {!isAuthModalOpen && (
          <>
            {/* Принудительно пересоздаем MapComponent при каждом изменении маршрута */}
            {(() => {
              console.log('🗺️ *** СОЗДАЕМ MapComponent ***')
              console.log('🗺️ route exists:', !!route)
              console.log('🗺️ route coordinates length:', route?.coordinates?.length)
              console.log('🗺️ mapKey:', mapKey)
              console.log('🗺️ forceUpdate:', forceUpdate)

              return (
                <MapComponent
                  key={`map-${Date.now()}-${Math.random()}`} // Уникальный ключ каждый раз
                  center={mapCenter}
                  markers={markers}
                  route={route}
                  waypoints={waypoints}
                  userLocation={userLocation}
                  onMapClick={handleMapClick}
                  onMapMove={handleMapMove}
                />
              )
            })()}
            {/* Кнопка "Моё местоположение" */}
            <button
              onClick={handleGoToMyLocation}
              className={`my-location-btn ${userLocation ? 'available' : 'unavailable'}`}
              title={userLocation ? 'Перейти к моему местоположению' : 'Местоположение недоступно'}
              disabled={!userLocation}
            >
              📍
            </button>
          </>
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
              <span className="stat-value">{formatDistance(route.distance)}</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Время в пути:</span>
              <span className="stat-value">{formatDuration(route.duration)}</span>
            </div>
            {formatSpeed(route.distance, route.duration) && (
              <div className="route-stat">
                <span className="stat-label">Средняя скорость:</span>
                <span className="stat-value">{formatSpeed(route.distance, route.duration)}</span>
              </div>
            )}
            <div className="route-stat">
              <span className="stat-label">Тип:</span>
              <span className="stat-value">🚶‍♂️ Пешком</span>
            </div>

            {/* Информация о приоритизации */}
            {routeAnalysis && (
              <div className="route-stat">
                <span className="stat-label">Приоритет:</span>
                <span className="stat-value priority-score" style={{
                  color: routeAnalysis.routePriority > 0.7 ? '#28a745' :
                         routeAnalysis.routePriority > 0.5 ? '#ffc107' : '#dc3545'
                }}>
                  {Math.round(routeAnalysis.routePriority * 100)}%
                </span>
              </div>
            )}

            {/* Переключатель интеллектуального роутинга */}
            <div className="route-stat">
              <span className="stat-label">Умный роутинг:</span>
              <label className="smart-routing-toggle">
                <input
                  type="checkbox"
                  checked={useIntelligentRouting}
                  onChange={(e) => setUseIntelligentRouting(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">
                  {useIntelligentRouting ? '🧠 Вкл' : '📍 Выкл'}
                </span>
              </label>
            </div>

            {/* Информация о промежуточных точках */}
            {waypoints.length > 0 && (
              <div className="route-stat">
                <span className="stat-label">Промежуточных точек:</span>
                <span className="stat-value waypoints-count">
                  📍 {waypoints.length}
                </span>
              </div>
            )}

            <div className="route-actions">
              <button
                onClick={handleStartJourney}
                className="journey-button primary"
                title="Открыть карту на весь экран с масштабом 1:100"
              >
                🗺️ В путь
              </button>

              {routeAnalysis && (
                <button
                  onClick={handleOpenAnalysisPanel}
                  className="journey-button secondary"
                  title="Подробный анализ маршрута"
                >
                  📊 Анализ
                </button>
              )}

              <button
                onClick={handleOpenPriorityConfig}
                className="journey-button secondary"
                title="Настройка приоритетов"
              >
                🎛️ Настройки
              </button>

              <button
                onClick={handleOpenWaypointsPanel}
                className="journey-button secondary"
                title="Управление промежуточными точками"
              >
                📍 Точки ({waypoints.length})
              </button>
            </div>
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

      {/* Панели системы приоритизации */}
      <PriorityConfigPanel
        priorityService={priorityService}
        onConfigChange={handlePriorityConfigChange}
        isVisible={isPriorityConfigOpen}
        onClose={handleClosePriorityConfig}
      />

      <RouteAnalysisPanel
        analysisData={routeAnalysis}
        isVisible={isAnalysisPanelOpen}
        onClose={handleCloseAnalysisPanel}
        onAlternativeSelect={handleAlternativeSelect}
      />

      <WaypointsPanel
        waypoints={waypoints}
        onWaypointsChange={handleWaypointsChange}
        onAddWaypoint={handleAddWaypoint}
        onRemoveWaypoint={handleRemoveWaypoint}
        onReorderWaypoints={handleReorderWaypoints}
        isVisible={isWaypointsPanelOpen}
        onClose={handleCloseWaypointsPanel}
      />
    </div>
  )
}

export default App
