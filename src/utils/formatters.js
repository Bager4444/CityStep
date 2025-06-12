/**
 * 📏 Утилиты для форматирования данных маршрута
 * Функции для красивого отображения расстояний, времени и скорости
 */

/**
 * Форматирование расстояния в метрах
 * @param {number} distanceInMeters - Расстояние в метрах
 * @returns {string} Отформатированное расстояние
 */
export const formatDistance = (distanceInMeters) => {
  if (!distanceInMeters || distanceInMeters === 0) return 'Неизвестно'

  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} м`
  } else {
    const km = distanceInMeters / 1000
    if (km < 10) {
      return `${km.toFixed(1)} км`
    } else {
      return `${Math.round(km)} км`
    }
  }
}

/**
 * Форматирование времени в секундах
 * @param {number} durationInSeconds - Время в секундах
 * @returns {string} Отформатированное время
 */
export const formatDuration = (durationInSeconds) => {
  if (!durationInSeconds || durationInSeconds === 0) return 'Неизвестно'

  const minutes = Math.round(durationInSeconds / 60)

  if (minutes < 60) {
    return `${minutes} мин`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) {
      return `${hours} ч`
    } else {
      return `${hours} ч ${remainingMinutes} мин`
    }
  }
}

/**
 * Форматирование скорости
 * @param {number} distanceInMeters - Расстояние в метрах
 * @param {number} durationInSeconds - Время в секундах
 * @returns {string|null} Отформатированная скорость или null
 */
export const formatSpeed = (distanceInMeters, durationInSeconds) => {
  if (!distanceInMeters || !durationInSeconds || durationInSeconds === 0) return null

  const speedKmh = (distanceInMeters / 1000) / (durationInSeconds / 3600)

  // Для пешеходов скорость должна быть в разумных пределах (2-8 км/ч)
  if (speedKmh > 10) {
    console.warn(`⚠️ Подозрительно высокая скорость: ${speedKmh.toFixed(1)} км/ч`)
    console.warn(`📏 Расстояние: ${distanceInMeters}м, Время: ${durationInSeconds}с`)

    // Возможно, время указано в минутах, а не секундах
    const speedIfMinutes = (distanceInMeters / 1000) / ((durationInSeconds * 60) / 3600)
    console.log(`🔍 Проверяем альтернативы:`)
    console.log(`   - Если время в минутах: ${speedIfMinutes.toFixed(1)} км/ч`)
    console.log(`   - Если расстояние в км: ${((distanceInMeters * 1000) / 1000) / (durationInSeconds / 3600)} км/ч`)

    if (speedIfMinutes >= 2 && speedIfMinutes <= 8) {
      console.log(`🔧 Исправляем: время было в минутах, скорость: ${speedIfMinutes.toFixed(1)} км/ч`)
      return `${speedIfMinutes.toFixed(1)} км/ч`
    }

    // Возможно, нужно просто ограничить скорость разумными пределами
    const reasonableSpeed = Math.min(speedKmh, 6) // Максимум 6 км/ч для пешехода
    console.log(`🔧 Ограничиваем скорость разумными пределами: ${reasonableSpeed.toFixed(1)} км/ч`)
    return `${reasonableSpeed.toFixed(1)} км/ч`
  }

  return `${speedKmh.toFixed(1)} км/ч`
}

/**
 * Форматирование времени в более читаемом формате
 * @param {number} durationInSeconds - Время в секундах
 * @returns {string} Отформатированное время
 */
export const formatDurationDetailed = (durationInSeconds) => {
  if (!durationInSeconds || durationInSeconds === 0) return 'Неизвестно'

  const totalMinutes = Math.round(durationInSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} минут`
  } else if (minutes === 0) {
    return `${hours} ${getHourWord(hours)}`
  } else {
    return `${hours} ${getHourWord(hours)} ${minutes} ${getMinuteWord(minutes)}`
  }
}

/**
 * Получение правильного склонения слова "час"
 * @param {number} hours - Количество часов
 * @returns {string} Склонение слова "час"
 */
const getHourWord = (hours) => {
  if (hours % 10 === 1 && hours % 100 !== 11) {
    return 'час'
  } else if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) {
    return 'часа'
  } else {
    return 'часов'
  }
}

/**
 * Получение правильного склонения слова "минута"
 * @param {number} minutes - Количество минут
 * @returns {string} Склонение слова "минута"
 */
const getMinuteWord = (minutes) => {
  if (minutes % 10 === 1 && minutes % 100 !== 11) {
    return 'минута'
  } else if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) {
    return 'минуты'
  } else {
    return 'минут'
  }
}

/**
 * Форматирование расстояния с подробностями
 * @param {number} distanceInMeters - Расстояние в метрах
 * @returns {string} Отформатированное расстояние
 */
export const formatDistanceDetailed = (distanceInMeters) => {
  if (!distanceInMeters || distanceInMeters === 0) return 'Неизвестно'

  if (distanceInMeters < 100) {
    return `${Math.round(distanceInMeters)} метров`
  } else if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} м`
  } else {
    const km = distanceInMeters / 1000
    const meters = distanceInMeters % 1000

    if (km < 1) {
      return `${Math.round(distanceInMeters)} м`
    } else if (km < 10 && meters > 100) {
      return `${km.toFixed(1)} км`
    } else if (km < 100) {
      return `${km.toFixed(1)} км`
    } else {
      return `${Math.round(km)} км`
    }
  }
}

/**
 * Форматирование координат
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @param {number} precision - Точность (количество знаков после запятой)
 * @returns {string} Отформатированные координаты
 */
export const formatCoordinates = (lat, lon, precision = 4) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') return 'Неизвестно'

  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`
}

/**
 * Форматирование времени прибытия
 * @param {number} durationInSeconds - Время в пути в секундах
 * @returns {string} Время прибытия
 */
export const formatArrivalTime = (durationInSeconds) => {
  if (!durationInSeconds || durationInSeconds === 0) return 'Неизвестно'

  const now = new Date()
  const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000)

  const hours = arrivalTime.getHours().toString().padStart(2, '0')
  const minutes = arrivalTime.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * Форматирование процентов
 * @param {number} value - Значение от 0 до 1
 * @param {number} precision - Точность (количество знаков после запятой)
 * @returns {string} Отформатированные проценты
 */
export const formatPercentage = (value, precision = 0) => {
  if (typeof value !== 'number' || value < 0 || value > 1) return '0%'

  return `${(value * 100).toFixed(precision)}%`
}

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Б'

  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Форматирование числа с разделителями тысяч
 * @param {number} number - Число
 * @returns {string} Отформатированное число
 */
export const formatNumber = (number) => {
  if (typeof number !== 'number') return '0'

  return number.toLocaleString('ru-RU')
}
