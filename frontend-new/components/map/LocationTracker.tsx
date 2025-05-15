'use client'

import { useState, useEffect } from 'react'
import { MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'

interface LocationTrackerProps {
  onLocationUpdate: (position: [number, number]) => void
  enabled?: boolean
  showIndicator?: boolean
}

export default function LocationTracker({
  onLocationUpdate,
  enabled = true,
  showIndicator = true
}: LocationTrackerProps) {
  const [tracking, setTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  // Запуск отслеживания местоположения
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером')
      return
    }

    setError(null)
    setTracking(true)

    // Опции для геолокации
    const options = {
      enableHighAccuracy: true, // Высокая точность
      timeout: 5000, // Таймаут в мс
      maximumAge: 0 // Не использовать кэшированные данные
    }

    // Функция успешного получения местоположения
    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      onLocationUpdate([latitude, longitude])
    }

    // Функция обработки ошибок
    const error = (err: GeolocationPositionError) => {
      let errorMessage = 'Неизвестная ошибка'
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Доступ к геолокации запрещен'
          break
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Информация о местоположении недоступна'
          break
        case err.TIMEOUT:
          errorMessage = 'Истекло время ожидания запроса местоположения'
          break
      }
      
      setError(errorMessage)
      setTracking(false)
    }

    // Запускаем отслеживание
    const id = navigator.geolocation.watchPosition(success, error, options)
    setWatchId(id)
  }

  // Остановка отслеживания местоположения
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setTracking(false)
  }

  // Запуск/остановка отслеживания при изменении enabled
  useEffect(() => {
    if (enabled) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => {
      stopTracking()
    }
  }, [enabled])

  if (!showIndicator) {
    return null
  }

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      ) : tracking ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md flex items-center">
          <div className="relative mr-2">
            <MapPinIcon className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-ping"></span>
          </div>
          <span className="text-sm">Отслеживание местоположения</span>
        </div>
      ) : (
        <button
          onClick={startTracking}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <MapPinIcon className="h-5 w-5 mr-2" />
          <span>Включить отслеживание</span>
        </button>
      )}
    </div>
  )
}
