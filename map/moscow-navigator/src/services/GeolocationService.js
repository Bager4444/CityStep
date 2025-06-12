/**
 * Сервис высокоточной геолокации
 * Использует все доступные методы для получения максимально точного местоположения
 */

class GeolocationService {
  constructor() {
    this.watchId = null
    this.lastKnownPosition = null
    this.isWatching = false
    this.callbacks = {
      success: [],
      error: []
    }

    // Настройки для максимальной точности (GPS)
    this.highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 60000, // 60 секунд для GPS
      maximumAge: 0 // Всегда получать свежие данные
    }

    // Настройки для быстрого получения приблизительного местоположения
    this.fastOptions = {
      enableHighAccuracy: false,
      timeout: 5000, // 5 секунд
      maximumAge: 300000 // 5 минут
    }
  }

  /**
   * Проверяет поддержку геолокации
   */
  isSupported() {
    return 'geolocation' in navigator
  }

  /**
   * Запрашивает разрешение на геолокацию
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Геолокация не поддерживается в этом браузере')
    }

    // Проверяем текущие разрешения
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })

        if (permission.state === 'denied') {
          throw new Error('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.')
        }

        if (permission.state === 'granted') {
          return true
        }
      } catch (error) {
        console.warn('Не удалось проверить разрешения:', error)
      }
    }

    // Пытаемся получить местоположение для запроса разрешения
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Доступ к геолокации запрещен пользователем'))
              break
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Местоположение недоступно'))
              break
            case error.TIMEOUT:
              reject(new Error('Превышено время ожидания получения местоположения'))
              break
            default:
              reject(new Error('Неизвестная ошибка геолокации'))
              break
          }
        },
        this.fastOptions
      )
    })
  }

  /**
   * Получает текущее местоположение с максимальной точностью
   */
  async getCurrentPosition(highAccuracy = true) {
    if (!this.isSupported()) {
      throw new Error('Геолокация не поддерживается')
    }

    const options = highAccuracy ? this.highAccuracyOptions : this.fastOptions

    return new Promise((resolve, reject) => {
      // Сначала пытаемся получить быстрое приблизительное местоположение
      if (highAccuracy) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Сохраняем приблизительное местоположение
            this.lastKnownPosition = this.processPosition(position)

            // Теперь получаем точное местоположение
            navigator.geolocation.getCurrentPosition(
              (accuratePosition) => {
                const processedPosition = this.processPosition(accuratePosition)
                this.lastKnownPosition = processedPosition
                resolve(processedPosition)
              },
              (error) => {
                // Если точное местоположение получить не удалось, возвращаем приблизительное
                if (this.lastKnownPosition) {
                  resolve(this.lastKnownPosition)
                } else {
                  reject(this.createError(error))
                }
              },
              this.highAccuracyOptions
            )
          },
          (error) => {
            reject(this.createError(error))
          },
          this.fastOptions
        )
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const processedPosition = this.processPosition(position)
            this.lastKnownPosition = processedPosition
            resolve(processedPosition)
          },
          (error) => reject(this.createError(error)),
          options
        )
      }
    })
  }

  /**
   * Начинает отслеживание местоположения
   */
  startWatching(onSuccess, onError, highAccuracy = true) {
    if (!this.isSupported()) {
      const error = new Error('Геолокация не поддерживается')
      if (onError) onError(error)
      return
    }

    if (this.isWatching) {
      this.stopWatching()
    }

    // Добавляем колбэки
    if (onSuccess) this.callbacks.success.push(onSuccess)
    if (onError) this.callbacks.error.push(onError)

    const options = highAccuracy ? this.highAccuracyOptions : this.fastOptions

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const processedPosition = this.processPosition(position)
        this.lastKnownPosition = processedPosition

        // Вызываем все колбэки успеха
        this.callbacks.success.forEach(callback => {
          try {
            callback(processedPosition)
          } catch (error) {
            console.error('Ошибка в колбэке геолокации:', error)
          }
        })
      },
      (error) => {
        const processedError = this.createError(error)

        // Вызываем все колбэки ошибок
        this.callbacks.error.forEach(callback => {
          try {
            callback(processedError)
          } catch (err) {
            console.error('Ошибка в колбэке ошибки геолокации:', err)
          }
        })
      },
      options
    )

    this.isWatching = true
  }

  /**
   * Останавливает отслеживание местоположения
   */
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    this.isWatching = false
    this.callbacks.success = []
    this.callbacks.error = []
  }

  /**
   * Обрабатывает позицию и добавляет дополнительную информацию
   */
  processPosition(position) {
    const coords = position.coords

    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy, // точность в метрах
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading, // направление движения в градусах
      speed: coords.speed, // скорость в м/с
      timestamp: position.timestamp,

      // Дополнительная обработанная информация
      coordinates: [coords.latitude, coords.longitude],
      accuracyLevel: this.getAccuracyLevel(coords.accuracy),
      isHighAccuracy: coords.accuracy <= 10, // считаем точным если точность <= 10 метров

      // Человекочитаемая информация
      accuracyText: this.getAccuracyText(coords.accuracy),
      speedKmh: coords.speed ? (coords.speed * 3.6).toFixed(1) : null,
      headingText: coords.heading ? this.getHeadingText(coords.heading) : null
    }
  }

  /**
   * Определяет уровень точности
   */
  getAccuracyLevel(accuracy) {
    if (accuracy <= 5) return 'excellent'
    if (accuracy <= 10) return 'good'
    if (accuracy <= 50) return 'fair'
    if (accuracy <= 100) return 'poor'
    return 'very_poor'
  }

  /**
   * Возвращает текстовое описание точности
   */
  getAccuracyText(accuracy) {
    if (accuracy <= 5) return 'Отличная точность'
    if (accuracy <= 10) return 'Хорошая точность'
    if (accuracy <= 50) return 'Средняя точность'
    if (accuracy <= 100) return 'Низкая точность'
    return 'Очень низкая точность'
  }

  /**
   * Преобразует направление в текст
   */
  getHeadingText(heading) {
    const directions = [
      'Север', 'Северо-восток', 'Восток', 'Юго-восток',
      'Юг', 'Юго-запад', 'Запад', 'Северо-запад'
    ]
    const index = Math.round(heading / 45) % 8
    return directions[index]
  }

  /**
   * Создает объект ошибки с подробным описанием
   */
  createError(error) {
    let message = 'Неизвестная ошибка геолокации'
    let code = 'UNKNOWN_ERROR'

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Доступ к геолокации запрещен'
        code = 'PERMISSION_DENIED'
        break
      case error.POSITION_UNAVAILABLE:
        message = 'Местоположение недоступно'
        code = 'POSITION_UNAVAILABLE'
        break
      case error.TIMEOUT:
        message = 'Превышено время ожидания'
        code = 'TIMEOUT'
        break
    }

    return {
      message,
      code,
      originalError: error
    }
  }

  /**
   * Возвращает последнее известное местоположение
   */
  getLastKnownPosition() {
    return this.lastKnownPosition
  }

  /**
   * Проверяет, ведется ли отслеживание
   */
  isCurrentlyWatching() {
    return this.isWatching
  }

  /**
   * Вычисляет расстояние между двумя точками (в метрах)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }
}

// Создаем единственный экземпляр сервиса
const geolocationService = new GeolocationService()

export default geolocationService
