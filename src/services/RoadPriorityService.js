/**
 * 🛣️ Сервис автоматической приоритизации дорог
 * Анализирует и оценивает дороги для оптимального построения маршрутов
 */

class RoadPriorityService {
  constructor() {
    // Конфигурация приоритетов по умолчанию
    this.defaultConfig = {
      // Типы дорог для пешеходов (приоритет от высокого к низкому)
      roadTypes: {
        pedestrian: { priority: 1.0, speed: 5, safety: 0.95, comfort: 0.9 },    // Пешеходные зоны
        footway: { priority: 0.95, speed: 5, safety: 0.9, comfort: 0.85 },      // Тротуары
        path: { priority: 0.9, speed: 4, safety: 0.85, comfort: 0.8 },          // Пешеходные тропы
        cycleway: { priority: 0.7, speed: 4, safety: 0.8, comfort: 0.7 },       // Велодорожки (можно идти)
        residential: { priority: 0.6, speed: 4, safety: 0.75, comfort: 0.6 },   // Жилые улицы
        service: { priority: 0.5, speed: 3, safety: 0.7, comfort: 0.5 },        // Служебные дороги
        tertiary: { priority: 0.4, speed: 3, safety: 0.6, comfort: 0.4 },       // Третьестепенные дороги
        secondary: { priority: 0.3, speed: 3, safety: 0.5, comfort: 0.3 },      // Второстепенные дороги
        primary: { priority: 0.2, speed: 3, safety: 0.4, comfort: 0.2 },        // Основные дороги
        trunk: { priority: 0.1, speed: 3, safety: 0.3, comfort: 0.1 },          // Магистрали (нежелательно)
        motorway: { priority: 0.05, speed: 3, safety: 0.2, comfort: 0.05 }      // Автомагистрали (запрещено)
      },

      // Факторы для пешеходов (другие приоритеты)
      factors: {
        safety: 0.35,      // Безопасность - главный приоритет для пешеходов
        comfort: 0.25,     // Комфорт (тротуары, покрытие, тень)
        ecology: 0.2,      // Экология (парки, зеленые зоны)
        traffic: 0.15,     // Избегание автомобильного трафика
        speed: 0.05        // Скорость менее важна для пешеходов
      },

      timeOfDay: {
        morning: { trafficMultiplier: 1.3, safetyMultiplier: 0.9 },
        day: { trafficMultiplier: 1.0, safetyMultiplier: 1.0 },
        evening: { trafficMultiplier: 1.4, safetyMultiplier: 0.8 },
        night: { trafficMultiplier: 0.7, safetyMultiplier: 0.6 }
      },

      weather: {
        clear: { speedMultiplier: 1.0, safetyMultiplier: 1.0 },
        rain: { speedMultiplier: 0.8, safetyMultiplier: 0.7 },
        snow: { speedMultiplier: 0.6, safetyMultiplier: 0.5 },
        fog: { speedMultiplier: 0.7, safetyMultiplier: 0.6 }
      }
    }

    this.userConfig = { ...this.defaultConfig }
    this.trafficData = new Map()
    this.roadQualityData = new Map()
  }

  /**
   * 🎯 Основной метод приоритизации маршрута
   */
  async prioritizeRoute(routeData, options = {}) {
    try {
      console.log('🛣️ Начинаем приоритизацию маршрута...')

      const {
        transportMode = 'driving',
        userPreferences = {},
        currentTime = new Date(),
        weather = 'clear'
      } = options

      // Анализируем сегменты маршрута
      const segments = await this.analyzeRouteSegments(routeData)

      // Применяем приоритизацию к каждому сегменту
      const prioritizedSegments = segments.map(segment =>
        this.calculateSegmentPriority(segment, {
          transportMode,
          userPreferences,
          currentTime,
          weather
        })
      )

      // Вычисляем общий приоритет маршрута
      const routePriority = this.calculateRoutePriority(prioritizedSegments)

      // Генерируем альтернативные маршруты с учетом приоритетов
      const alternatives = await this.generateAlternativeRoutes(
        routeData,
        prioritizedSegments,
        options
      )

      console.log(`✅ Приоритизация завершена. Общий приоритет: ${routePriority.toFixed(2)}`)

      return {
        originalRoute: routeData,
        prioritizedSegments,
        routePriority,
        alternatives,
        recommendations: this.generateRecommendations(prioritizedSegments),
        metadata: {
          analysisTime: new Date(),
          factorsUsed: Object.keys(this.userConfig.factors),
          transportMode,
          weather
        }
      }
    } catch (error) {
      console.error('❌ Ошибка при приоритизации маршрута:', error)
      throw new Error(`Ошибка приоритизации: ${error.message}`)
    }
  }

  /**
   * 🔍 Анализ сегментов маршрута
   */
  async analyzeRouteSegments(routeData) {
    const segments = []

    if (!routeData.coordinates || routeData.coordinates.length < 2) {
      throw new Error('Недостаточно координат для анализа маршрута')
    }

    // Разбиваем маршрут на сегменты
    for (let i = 0; i < routeData.coordinates.length - 1; i++) {
      const start = routeData.coordinates[i]
      const end = routeData.coordinates[i + 1]

      const segment = {
        id: `segment_${i}`,
        start: { lat: start[0], lon: start[1] },
        end: { lat: end[0], lon: end[1] },
        distance: this.calculateDistance(start, end),
        roadType: await this.identifyRoadType(start, end),
        trafficLevel: await this.getTrafficLevel(start, end),
        roadQuality: await this.getRoadQuality(start, end),
        safetyScore: await this.getSafetyScore(start, end)
      }

      segments.push(segment)
    }

    return segments
  }

  /**
   * 📊 Вычисление приоритета сегмента
   */
  calculateSegmentPriority(segment, options) {
    const { transportMode, userPreferences, currentTime, weather } = options

    // Базовые характеристики дороги
    const roadConfig = this.userConfig.roadTypes[segment.roadType] ||
                      this.userConfig.roadTypes.secondary

    // Временные модификаторы
    const timeModifiers = this.getTimeModifiers(currentTime)
    const weatherModifiers = this.userConfig.weather[weather]

    // Вычисляем компоненты приоритета
    const speedScore = roadConfig.speed * weatherModifiers.speedMultiplier
    const safetyScore = segment.safetyScore * timeModifiers.safetyMultiplier *
                       weatherModifiers.safetyMultiplier
    const trafficScore = (1 - segment.trafficLevel) * timeModifiers.trafficMultiplier
    const ecologyScore = this.calculateEcologyScore(segment, transportMode)
    const comfortScore = this.calculateComfortScore(segment, roadConfig)

    // Применяем веса факторов
    const factors = this.userConfig.factors
    const totalPriority =
      speedScore * factors.speed +
      safetyScore * factors.safety +
      trafficScore * factors.traffic +
      ecologyScore * factors.ecology +
      comfortScore * factors.comfort

    return {
      ...segment,
      priority: Math.max(0, Math.min(1, totalPriority)),
      scores: {
        speed: speedScore,
        safety: safetyScore,
        traffic: trafficScore,
        ecology: ecologyScore,
        comfort: comfortScore
      },
      modifiers: {
        time: timeModifiers,
        weather: weatherModifiers
      }
    }
  }

  /**
   * 🕐 Получение временных модификаторов
   */
  getTimeModifiers(currentTime) {
    const hour = currentTime.getHours()

    if (hour >= 7 && hour <= 10) return this.userConfig.timeOfDay.morning
    if (hour >= 17 && hour <= 20) return this.userConfig.timeOfDay.evening
    if (hour >= 22 || hour <= 6) return this.userConfig.timeOfDay.night
    return this.userConfig.timeOfDay.day
  }

  /**
   * 🌱 Вычисление экологического рейтинга для пешеходов
   */
  calculateEcologyScore(segment, transportMode = 'walking') {
    // Для пешеходов экология означает близость к зеленым зонам и отдаленность от загрязнения
    const roadEcologyScore = {
      pedestrian: 1.0,    // Пешеходные зоны - максимальная экология
      footway: 0.95,      // Тротуары - хорошая экология
      path: 1.0,          // Тропы в парках - отличная экология
      cycleway: 0.9,      // Велодорожки - хорошая экология
      residential: 0.8,   // Жилые улицы - умеренная экология
      service: 0.7,       // Служебные дороги - пониженная экология
      tertiary: 0.6,      // Третьестепенные дороги - низкая экология
      secondary: 0.4,     // Второстепенные дороги - плохая экология
      primary: 0.3,       // Основные дороги - очень плохая экология
      trunk: 0.2,         // Магистрали - ужасная экология
      motorway: 0.1       // Автомагистрали - катастрофическая экология
    }[segment.roadType] || 0.5

    // Дополнительные факторы для пешеходов
    let ecologyBonus = 1.0

    // Бонус за отсутствие автомобильного трафика
    if (['pedestrian', 'footway', 'path'].includes(segment.roadType)) {
      ecologyBonus += 0.2
    }

    // Штраф за высокий трафик (загрязнение воздуха и шум)
    const trafficPenalty = 1 - (segment.trafficLevel * 0.3)

    return Math.min(1.0, roadEcologyScore * ecologyBonus * trafficPenalty)
  }

  /**
   * 😌 Вычисление рейтинга комфорта для пешеходов
   */
  calculateComfortScore(segment, roadConfig) {
    // Базовый комфорт для пешеходов
    let comfort = roadConfig.comfort || roadConfig.priority

    // Качество покрытия важно для пешеходов
    comfort *= segment.roadQuality

    // Пешеходам важно избегать автомобильного трафика
    const trafficComfort = 1 - (segment.trafficLevel * 0.5) // больший штраф за трафик
    comfort *= trafficComfort

    // Дополнительные факторы комфорта для пешеходов
    const comfortBonuses = {
      pedestrian: 1.2,    // Пешеходные зоны - максимальный комфорт
      footway: 1.1,       // Тротуары - хороший комфорт
      path: 1.15,         // Тропы - отличный комфорт
      cycleway: 1.0,      // Велодорожки - нормальный комфорт
      residential: 0.9,   // Жилые улицы - пониженный комфорт
      service: 0.8,       // Служебные дороги - низкий комфорт
      tertiary: 0.7,      // Третьестепенные дороги - плохой комфорт
      secondary: 0.6,     // Второстепенные дороги - очень плохой комфорт
      primary: 0.5,       // Основные дороги - ужасный комфорт
      trunk: 0.3,         // Магистрали - катастрофический комфорт
      motorway: 0.1       // Автомагистрали - недопустимый комфорт
    }

    const comfortMultiplier = comfortBonuses[segment.roadType] || 0.8
    comfort *= comfortMultiplier

    return Math.max(0, Math.min(1, comfort))
  }

  /**
   * 📏 Вычисление расстояния между точками
   */
  calculateDistance(point1, point2) {
    const R = 6371000 // Радиус Земли в метрах
    const lat1Rad = point1[0] * Math.PI / 180
    const lat2Rad = point2[0] * Math.PI / 180
    const deltaLatRad = (point2[0] - point1[0]) * Math.PI / 180
    const deltaLonRad = (point2[1] - point1[1]) * Math.PI / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * 🛣️ Определение типа дороги (заглушка для демонстрации)
   */
  async identifyRoadType(start, end) {
    // В реальной реализации здесь будет запрос к OSM Overpass API
    // или другому сервису для определения типа дороги
    const roadTypes = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential']
    return roadTypes[Math.floor(Math.random() * roadTypes.length)]
  }

  /**
   * 🚦 Получение уровня трафика (заглушка)
   */
  async getTrafficLevel(start, end) {
    // В реальной реализации здесь будет интеграция с сервисами трафика
    return Math.random() * 0.8 // 0-0.8 уровень загруженности
  }

  /**
   * 🛤️ Получение качества дороги (заглушка)
   */
  async getRoadQuality(start, end) {
    // В реальной реализации здесь будет база данных качества дорог
    return 0.7 + Math.random() * 0.3 // 0.7-1.0 качество
  }

  /**
   * 🛡️ Получение рейтинга безопасности (заглушка)
   */
  async getSafetyScore(start, end) {
    // В реальной реализации здесь будет анализ статистики ДТП
    return 0.6 + Math.random() * 0.4 // 0.6-1.0 безопасность
  }

  /**
   * 🎯 Вычисление общего приоритета маршрута
   */
  calculateRoutePriority(prioritizedSegments) {
    if (!prioritizedSegments.length) return 0

    const totalDistance = prioritizedSegments.reduce((sum, seg) => sum + seg.distance, 0)
    const weightedPriority = prioritizedSegments.reduce((sum, seg) => {
      const weight = seg.distance / totalDistance
      return sum + (seg.priority * weight)
    }, 0)

    return weightedPriority
  }

  /**
   * 🔄 Генерация альтернативных маршрутов для пешеходов
   */
  async generateAlternativeRoutes(originalRoute, prioritizedSegments, options) {
    const alternatives = []

    // Альтернатива 1: Максимальная безопасность
    alternatives.push({
      type: 'safest',
      name: '🛡️ Самый безопасный',
      description: 'Маршрут по тротуарам и пешеходным зонам',
      config: { safety: 0.5, comfort: 0.25, ecology: 0.15, traffic: 0.05, speed: 0.05 }
    })

    // Альтернатива 2: Максимальный комфорт
    alternatives.push({
      type: 'comfort',
      name: '😌 Самый комфортный',
      description: 'Маршрут по удобным пешеходным дорожкам',
      config: { comfort: 0.45, safety: 0.3, ecology: 0.15, traffic: 0.05, speed: 0.05 }
    })

    // Альтернатива 3: Через парки и зеленые зоны
    alternatives.push({
      type: 'eco',
      name: '🌱 Через парки',
      description: 'Маршрут через парки и зеленые зоны',
      config: { ecology: 0.4, comfort: 0.3, safety: 0.25, traffic: 0.03, speed: 0.02 }
    })

    // Альтернатива 4: Избегание автомобильного трафика
    alternatives.push({
      type: 'quiet',
      name: '🔇 Тихий маршрут',
      description: 'Маршрут вдали от автомобильных дорог',
      config: { traffic: 0.4, safety: 0.3, comfort: 0.2, ecology: 0.08, speed: 0.02 }
    })

    // Альтернатива 5: Кратчайший путь
    alternatives.push({
      type: 'shortest',
      name: '📏 Кратчайший',
      description: 'Самый короткий маршрут (может быть менее комфортным)',
      config: { speed: 0.3, safety: 0.25, comfort: 0.2, ecology: 0.15, traffic: 0.1 }
    })

    return alternatives
  }

  /**
   * 💡 Генерация рекомендаций
   */
  generateRecommendations(prioritizedSegments) {
    const recommendations = []

    // Анализируем проблемные участки
    const lowPrioritySegments = prioritizedSegments.filter(seg => seg.priority < 0.4)
    const highTrafficSegments = prioritizedSegments.filter(seg => seg.trafficLevel > 0.7)
    const lowSafetySegments = prioritizedSegments.filter(seg => seg.safetyScore < 0.6)

    if (lowPrioritySegments.length > 0) {
      recommendations.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Проблемные участки',
        message: `Обнаружено ${lowPrioritySegments.length} участков с низким приоритетом. Рассмотрите альтернативные маршруты.`
      })
    }

    if (highTrafficSegments.length > 0) {
      recommendations.push({
        type: 'traffic',
        icon: '🚦',
        title: 'Высокая загруженность',
        message: `${highTrafficSegments.length} участков с высокой загруженностью. Рекомендуем выехать позже или выбрать другой маршрут.`
      })
    }

    if (lowSafetySegments.length > 0) {
      recommendations.push({
        type: 'safety',
        icon: '🛡️',
        title: 'Вопросы безопасности',
        message: `${lowSafetySegments.length} участков требуют повышенной осторожности. Соблюдайте скоростной режим.`
      })
    }

    // Позитивные рекомендации
    const avgPriority = prioritizedSegments.reduce((sum, seg) => sum + seg.priority, 0) / prioritizedSegments.length

    if (avgPriority > 0.8) {
      recommendations.push({
        type: 'success',
        icon: '✅',
        title: 'Отличный маршрут',
        message: 'Выбранный маршрут имеет высокий приоритет по всем параметрам!'
      })
    }

    return recommendations
  }

  /**
   * ⚙️ Обновление пользовательских настроек
   */
  updateUserConfig(newConfig) {
    this.userConfig = {
      ...this.userConfig,
      ...newConfig
    }

    console.log('⚙️ Конфигурация приоритизации обновлена:', this.userConfig)
  }

  /**
   * 📊 Получение статистики приоритизации
   */
  getStatistics(prioritizedSegments) {
    if (!prioritizedSegments.length) return null

    const stats = {
      totalSegments: prioritizedSegments.length,
      averagePriority: prioritizedSegments.reduce((sum, seg) => sum + seg.priority, 0) / prioritizedSegments.length,
      highPrioritySegments: prioritizedSegments.filter(seg => seg.priority > 0.7).length,
      lowPrioritySegments: prioritizedSegments.filter(seg => seg.priority < 0.4).length,
      averageScores: {
        speed: prioritizedSegments.reduce((sum, seg) => sum + seg.scores.speed, 0) / prioritizedSegments.length,
        safety: prioritizedSegments.reduce((sum, seg) => sum + seg.scores.safety, 0) / prioritizedSegments.length,
        traffic: prioritizedSegments.reduce((sum, seg) => sum + seg.scores.traffic, 0) / prioritizedSegments.length,
        ecology: prioritizedSegments.reduce((sum, seg) => sum + seg.scores.ecology, 0) / prioritizedSegments.length,
        comfort: prioritizedSegments.reduce((sum, seg) => sum + seg.scores.comfort, 0) / prioritizedSegments.length
      }
    }

    return stats
  }

  /**
   * 🔄 Сброс к настройкам по умолчанию
   */
  resetToDefaults() {
    this.userConfig = { ...this.defaultConfig }
    console.log('🔄 Настройки приоритизации сброшены к значениям по умолчанию')
  }
}

export default RoadPriorityService
