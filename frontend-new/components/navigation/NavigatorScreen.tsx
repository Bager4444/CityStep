'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowUpIcon,
  MapPinIcon,
  PauseIcon,
  MapIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/solid'

interface NavigatorScreenProps {
  currentPosition: [number, number] | null
  targetPosition: [number, number] | null
  nextStopName: string
  nextStopDistance: number | null
  estimatedTime: string
  onExit: () => void
  onSwitchToMap: () => void
  onNextStop?: () => void
  onPrevStop?: () => void
  totalStops?: number
  currentStopIndex?: number
  routeProgress?: number
  currentSpeed?: number | null
}

export default function NavigatorScreen({
  currentPosition,
  targetPosition,
  nextStopName,
  nextStopDistance,
  estimatedTime,
  onExit,
  onSwitchToMap,
  onNextStop,
  onPrevStop,
  totalStops = 1,
  currentStopIndex = 0,
  routeProgress = 0,
  currentSpeed = null
}: NavigatorScreenProps) {
  const [angle, setAngle] = useState(0)
  const [compassDirection, setCompassDirection] = useState<string>('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0) // Время в пути в секундах
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Инициализация аудио для уведомлений
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3')
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Запуск таймера для отслеживания времени в пути
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Воспроизведение звука при приближении к точке
  useEffect(() => {
    if (nextStopDistance !== null && nextStopDistance < 0.1 && soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Ошибка воспроизведения звука:', e))
    }
  }, [nextStopDistance, soundEnabled])

  // Рассчитываем угол между текущим положением и целью
  useEffect(() => {
    if (!currentPosition || !targetPosition) return

    const [lat1, lon1] = currentPosition
    const [lat2, lon2] = targetPosition

    // Преобразуем координаты в радианы
    const lat1Rad = (lat1 * Math.PI) / 180
    const lon1Rad = (lon1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180
    const lon2Rad = (lon2 * Math.PI) / 180

    // Рассчитываем направление (bearing)
    const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad)
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad)
    const bearing = Math.atan2(y, x)

    // Преобразуем радианы в градусы
    let degrees = (bearing * 180) / Math.PI
    degrees = (degrees + 360) % 360 // Нормализуем к 0-360

    setAngle(degrees)

    // Определяем направление по компасу
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ']
    const index = Math.round(degrees / 45) % 8
    setCompassDirection(directions[index])
  }, [currentPosition, targetPosition])

  // Форматирование расстояния
  const formatDistance = (distance: number | null): string => {
    if (distance === null) return 'Расчет...'

    if (distance < 1) {
      return `${Math.round(distance * 1000)} м`
    }
    return `${distance.toFixed(1)} км`
  }

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-[#121826] text-white z-50">
      {/* Верхняя панель */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <button
          onClick={onExit}
          className="p-2"
        >
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold">Навигация</h2>
          <p className="text-sm text-gray-300">Время в пути: 0:09</p>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2"
          >
            {soundEnabled ?
              <SpeakerWaveIcon className="h-6 w-6 text-white" /> :
              <SpeakerXMarkIcon className="h-6 w-6 text-white" />
            }
          </button>

          <button
            onClick={onSwitchToMap}
            className="p-2"
          >
            <MapIcon className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Центральная часть с большой стрелкой */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        {/* Название следующей точки */}
        <div className="bg-[#8b5cf6] px-6 py-3 rounded-lg text-center mb-8 shadow-lg w-64">
          <div className="flex items-center justify-center mb-1">
            <MapPinIcon className="h-5 w-5 mr-2" />
            <span className="text-lg">Следующая точка</span>
          </div>
          <div className="font-bold text-xl mb-1">Красная площадь</div>
          <div className="text-lg">
            292 м
          </div>
        </div>

        {/* Большая стрелка направления */}
        <div className="relative mb-8">
          <div
            className="bg-[#8b5cf6] rounded-full p-8 shadow-lg"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <ArrowUpIcon className="h-24 w-24 text-white" />
          </div>

          {/* Индикатор направления */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-[#8b5cf6] px-3 py-1 rounded-full text-lg font-bold shadow">
            ЮВ
          </div>
        </div>

        {/* Информация о скорости и прогрессе */}
        <div className="flex justify-between w-80 mb-4">
          <div className="bg-[#1e293b] p-4 rounded-lg text-center w-36">
            <p className="text-gray-400 text-sm">Скорость</p>
            <p className="text-2xl font-bold">
              {currentSpeed !== null ? `${Math.round(currentSpeed)} км/ч` : '9 км/ч'}
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg text-center w-36">
            <p className="text-gray-400 text-sm">Осталось</p>
            <p className="text-2xl font-bold">2 мин</p>
          </div>
        </div>

        {/* Прогресс маршрута */}
        <div className="w-80 bg-[#1e293b] rounded-full h-4 mb-8">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${routeProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Нижняя панель с кнопками */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4">
        <button
          onClick={onExit}
          className="px-6 py-3 rounded-full shadow-lg bg-red-600 text-white font-medium w-64 flex items-center justify-center"
        >
          <PauseIcon className="h-5 w-5 mr-2" />
          Остановить
        </button>

        <button
          className="px-6 py-3 rounded-full shadow-lg bg-green-600 text-white font-medium w-64 flex items-center justify-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Отслеживание включено
        </button>

        <div className="text-center mt-2">
          <p className="text-lg font-bold">
            {currentStopIndex + 1} из {totalStops}
          </p>
          <p className="text-sm text-gray-300">
            {currentPosition
              ? `${currentPosition[0].toFixed(5)}, ${currentPosition[1].toFixed(5)}`
              : 'Определение...'}
          </p>
        </div>
      </div>
    </div>
  )
}
