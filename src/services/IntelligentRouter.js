/**
 * 🧠 Интеллектуальный роутер с приоритизацией дорог
 * Строит маршруты с учетом приоритетов дорог для пешеходов
 */

class IntelligentRouter {
  constructor(priorityService) {
    this.priorityService = priorityService
    this.cache = new Map()
    this.maxCacheSize = 100
  }

  /**
   * 🗺️ Построение оптимального маршрута с учетом приоритетов
   */
  async buildOptimizedRoute(fromCoords, toCoords, options = {}) {
    const {
      transportMode = 'walking',
      avoidHighTraffic = true,
      preferSafeRoutes = true,
      preferParks = false,
      maxAlternatives = 3,
      waypoints = [] // Промежуточные точки
    } = options

    console.log('🧠 Строим оптимизированный маршрут с приоритизацией...')

    if (waypoints.length > 0) {
      console.log(`📍 Маршрут через ${waypoints.length} промежуточных точек`)
    }

    try {
      // Генерируем несколько альтернативных маршрутов
      const alternatives = await this.generateRouteAlternatives(
        fromCoords,
        toCoords,
        transportMode,
        maxAlternatives,
        waypoints
      )

      if (alternatives.length === 0) {
        throw new Error('Не удалось построить ни одного маршрута')
      }

      // Анализируем каждый маршрут
      const analyzedRoutes = []
      for (const route of alternatives) {
        try {
          const analysis = await this.priorityService.prioritizeRoute(route, {
            transportMode,
            currentTime: new Date(),
            weather: 'clear'
          })

          analyzedRoutes.push({
            route,
            analysis,
            score: this.calculateRouteScore(analysis, options)
          })
        } catch (error) {
          console.warn('⚠️ Ошибка анализа маршрута:', error.message)
        }
      }

      if (analyzedRoutes.length === 0) {
        // Возвращаем первый маршрут без анализа
        return alternatives[0]
      }

      // Сортируем по итоговому счету
      analyzedRoutes.sort((a, b) => b.score - a.score)

      const bestRoute = analyzedRoutes[0]
      console.log(`✅ Выбран лучший маршрут с оценкой ${bestRoute.score.toFixed(2)}`)

      return {
        ...bestRoute.route,
        priorityAnalysis: bestRoute.analysis,
        alternativeRoutes: analyzedRoutes.slice(1).map(r => ({
          route: r.route,
          analysis: r.analysis,
          score: r.score
        }))
      }

    } catch (error) {
      console.error('❌ Ошибка построения оптимизированного маршрута:', error)
      throw error
    }
  }

  /**
   * 🔄 Генерация альтернативных маршрутов
   */
  async generateRouteAlternatives(fromCoords, toCoords, transportMode, maxAlternatives, waypoints = []) {
    const alternatives = []
    const profile = this.getOSRMProfile(transportMode)

    // Если есть промежуточные точки, строим маршрут через них
    if (waypoints.length > 0) {
      try {
        const waypointRoute = await this.buildRouteWithWaypoints(
          [fromCoords, ...waypoints.map(wp => wp.coordinates), toCoords],
          profile
        )
        waypointRoute.type = 'waypoint'
        waypointRoute.waypointCount = waypoints.length
        alternatives.push(waypointRoute)

        console.log(`✅ Построен маршрут через ${waypoints.length} промежуточных точек`)
      } catch (error) {
        console.warn('⚠️ Не удалось построить маршрут через промежуточные точки:', error.message)
      }
    }

    // 1. Прямой маршрут (если нет промежуточных точек или как альтернатива)
    if (waypoints.length === 0) {
      try {
        const directRoute = await this.buildDirectRoute(fromCoords, toCoords, profile)
        alternatives.push(directRoute)
      } catch (error) {
        console.warn('⚠️ Не удалось построить прямой маршрут:', error.message)
      }
    }

    // 2. Альтернативные маршруты (только если нет промежуточных точек)
    if (waypoints.length === 0) {
      // Более разумные отклонения для пешеходных маршрутов (меньшие расстояния)
      const waypointStrategies = [
        { name: 'north_detour', offset: [0.002, 0] },      // Северный объезд (200м)
        { name: 'south_detour', offset: [-0.002, 0] },     // Южный объезд (200м)
        { name: 'east_detour', offset: [0, 0.002] },       // Восточный объезд (200м)
        { name: 'west_detour', offset: [0, -0.002] },      // Западный объезд (200м)
        { name: 'diagonal_ne', offset: [0.001, 0.001] },   // Северо-восточный (100м)
        { name: 'diagonal_sw', offset: [-0.001, -0.001] }  // Юго-западный (100м)
      ]

      for (let i = 0; i < Math.min(maxAlternatives - 1, waypointStrategies.length); i++) {
        try {
          const strategy = waypointStrategies[i]
          const waypoint = [
            fromCoords[0] + (toCoords[0] - fromCoords[0]) * 0.5 + strategy.offset[0],
            fromCoords[1] + (toCoords[1] - fromCoords[1]) * 0.5 + strategy.offset[1]
          ]

          const alternativeRoute = await this.buildRouteWithWaypoints(
            [fromCoords, waypoint, toCoords],
            profile
          )

          // Проверяем, что маршрут достаточно отличается от прямого
          if (alternatives.length > 0) {
            const distanceDiff = Math.abs(alternativeRoute.distance - alternatives[0].distance)
            if (distanceDiff > alternatives[0].distance * 0.1) { // Отличие больше 10%
              alternatives.push(alternativeRoute)
            }
          } else {
            alternatives.push(alternativeRoute)
          }
        } catch (error) {
          console.warn(`⚠️ Не удалось построить альтернативный маршрут ${waypointStrategies[i].name}:`, error.message)
        }
      }
    } else {
      // Для маршрутов с промежуточными точками генерируем альтернативы с измененным порядком точек
      if (waypoints.length > 1) {
        try {
          // Альтернатива с обратным порядком промежуточных точек
          const reversedWaypoints = [...waypoints].reverse()
          const reversedRoute = await this.buildRouteWithWaypoints(
            [fromCoords, ...reversedWaypoints.map(wp => wp.coordinates), toCoords],
            profile
          )
          reversedRoute.type = 'waypoint_reversed'
          reversedRoute.waypointCount = waypoints.length
          alternatives.push(reversedRoute)

          console.log('✅ Построен альтернативный маршрут с обратным порядком точек')
        } catch (error) {
          console.warn('⚠️ Не удалось построить маршрут с обратным порядком точек:', error.message)
        }
      }
    }

    console.log(`📍 Сгенерировано ${alternatives.length} альтернативных маршрутов`)
    return alternatives
  }

  /**
   * 📊 Вычисление итогового счета маршрута
   */
  calculateRouteScore(analysis, options) {
    const { avoidHighTraffic, preferSafeRoutes, preferParks } = options

    let score = analysis.routePriority * 100 // Базовый приоритет (0-100)

    // Бонусы и штрафы на основе пользовательских предпочтений
    if (preferSafeRoutes) {
      const avgSafety = analysis.prioritizedSegments.reduce(
        (sum, seg) => sum + seg.safetyScore, 0
      ) / analysis.prioritizedSegments.length
      score += avgSafety * 20 // Бонус до +20 за безопасность
    }

    if (avoidHighTraffic) {
      const avgTraffic = analysis.prioritizedSegments.reduce(
        (sum, seg) => sum + seg.trafficLevel, 0
      ) / analysis.prioritizedSegments.length
      score -= avgTraffic * 30 // Штраф до -30 за высокий трафик
    }

    if (preferParks) {
      const avgEcology = analysis.prioritizedSegments.reduce(
        (sum, seg) => sum + seg.scores.ecology, 0
      ) / analysis.prioritizedSegments.length
      score += avgEcology * 25 // Бонус до +25 за экологичность
    }

    // Штраф за низкокачественные сегменты
    const lowQualitySegments = analysis.prioritizedSegments.filter(seg => seg.priority < 0.3)
    score -= lowQualitySegments.length * 5

    // Бонус за высококачественные сегменты
    const highQualitySegments = analysis.prioritizedSegments.filter(seg => seg.priority > 0.8)
    score += highQualitySegments.length * 3

    return Math.max(0, score)
  }

  /**
   * 🛣️ Построение прямого маршрута
   */
  async buildDirectRoute(fromCoords, toCoords, profile) {
    const cacheKey = `${fromCoords.join(',')}-${toCoords.join(',')}-${profile}`

    if (this.cache.has(cacheKey)) {
      console.log('📋 Используем кешированный маршрут')
      return this.cache.get(cacheKey)
    }

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson&steps=true&alternatives=false`
    )

    if (!response.ok) {
      throw new Error('Ошибка сервиса построения маршрутов')
    }

    const data = await response.json()
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Не удалось построить маршрут')
    }

    const route = {
      coordinates: data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]),
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
      from: fromCoords,
      to: toCoords,
      type: 'direct'
    }

    // Кешируем результат
    this.addToCache(cacheKey, route)

    return route
  }

  /**
   * 🗺️ Построение маршрута через промежуточные точки
   */
  async buildRouteWithWaypoints(points, profile) {
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

    return {
      coordinates: data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]),
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
      from: points[0],
      to: points[points.length - 1],
      waypoints: points.slice(1, -1),
      type: 'waypoint'
    }
  }

  /**
   * 🚗 Определение профиля OSRM
   */
  getOSRMProfile(transportMode) {
    switch (transportMode) {
      case 'walking': return 'foot'
      case 'cycling': return 'bicycle'
      case 'driving':
      case 'taxi':
      case 'public_transport':
      default: return 'driving'
    }
  }

  /**
   * 💾 Управление кешем
   */
  addToCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // Удаляем самый старый элемент
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  /**
   * 🧹 Очистка кеша
   */
  clearCache() {
    this.cache.clear()
    console.log('🧹 Кеш маршрутов очищен')
  }
}

export default IntelligentRouter
