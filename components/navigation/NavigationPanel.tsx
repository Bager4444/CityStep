'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  SignalIcon
} from '@heroicons/react/24/solid'
import { XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'

interface NavigationPanelProps {
  currentPosition: [number, number] | null
  nextStopName: string
  nextStopDistance: number | null
  estimatedTime: string
  onExit: () => void
  targetPosition?: [number, number] | null
  routeProgress?: number // Прогресс маршрута в процентах (0-100)
  currentSpeed?: number | null // Текущая скорость в км/ч
  onNextStop?: () => void
  onPrevStop?: () => void
  totalStops?: number
  currentStopIndex?: number
  onSwitchToNavigatorScreen?: () => void // Функция для переключения на экран навигатора
}

export default function NavigationPanel({
  currentPosition,
  nextStopName,
  nextStopDistance,
  estimatedTime,
  onExit,
  targetPosition,
  routeProgress = 0,
  currentSpeed = null,
  onNextStop,
  onPrevStop,
  totalStops = 1,
  currentStopIndex = 0,
  onSwitchToNavigatorScreen
}: NavigationPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [angle, setAngle] = useState(0)
  const [compassDirection, setCompassDirection] = useState<string>('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0) // Время в пути в секундах
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Инициализация аудио для уведомлений
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Запуск таймера для отслеживания времени в пути
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Воспроизведение звука при приближении к точке
  useEffect(() => {
    if (nextStopDistance !== null && nextStopDistance < 0.1 && soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Ошибка воспроизведения звука:', e));
    }
  }, [nextStopDistance, soundEnabled]);

  // Рассчитываем угол между текущим положением и целью
  useEffect(() => {
    if (!currentPosition || !targetPosition) return;

    const [lat1, lon1] = currentPosition;
    const [lat2, lon2] = targetPosition;

    // Преобразуем координаты в радианы
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lon1Rad = (lon1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const lon2Rad = (lon2 * Math.PI) / 180;

    // Рассчитываем направление (bearing)
    const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
    const bearing = Math.atan2(y, x);

    // Преобразуем радианы в градусы
    let degrees = (bearing * 180) / Math.PI;
    degrees = (degrees + 360) % 360; // Нормализуем к 0-360

    setAngle(degrees);

    // Определяем направление по компасу
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    const index = Math.round(degrees / 45) % 8;
    setCompassDirection(directions[index]);
  }, [currentPosition, targetPosition]);

  // Форматирование расстояния
  const formatDistance = (distance: number | null): string => {
    if (distance === null) return 'Расчет...';

    if (distance < 1) {
      return `${Math.round(distance * 1000)} м`;
    }
    return `${distance.toFixed(1)} км`;
  };

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Переключение в полноэкранный режим
  const toggleFullscreen = () => {
    if (onSwitchToNavigatorScreen) {
      // Если есть функция для переключения на экран навигатора, используем ее
      onSwitchToNavigatorScreen();
    } else {
      // Иначе используем встроенный полноэкранный режим
      setFullscreen(!fullscreen);
      setExpanded(true);
    }
  };

  // Полноэкранный режим навигации
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50">
        {/* Верхняя панель */}
        <div className="absolute top-0 left-0 right-0 bg-gray-800 p-4 flex justify-between items-center">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold">Навигация</h2>
            <p className="text-sm text-gray-300">Время в пути: {formatTime(elapsedTime)}</p>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            {soundEnabled ?
              <SpeakerWaveIcon className="h-6 w-6 text-white" /> :
              <SpeakerXMarkIcon className="h-6 w-6 text-white" />
            }
          </button>
        </div>

        {/* Центральная часть с большой стрелкой */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          {/* Название следующей точки */}
          <div className="bg-blue-600 px-6 py-3 rounded-lg text-center mb-8 shadow-lg w-64">
            <div className="flex items-center justify-center mb-1">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span className="text-lg">Следующая точка</span>
            </div>
            <div className="font-bold text-xl mb-1">{nextStopName}</div>
            <div className="text-lg">
              {nextStopDistance !== null ? formatDistance(nextStopDistance) : 'Расчет...'}
            </div>
          </div>

          {/* Большая стрелка направления */}
          <div className="relative mb-8">
            <div
              className="bg-blue-600 rounded-full p-8 shadow-lg"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <ArrowUpIcon className="h-24 w-24 text-white" />
            </div>

            {/* Индикатор направления */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 px-3 py-1 rounded-full text-lg font-bold shadow">
              {compassDirection}
            </div>
          </div>

          {/* Информация о скорости и прогрессе */}
          <div className="flex justify-between w-80 mb-4">
            <div className="bg-gray-800 p-4 rounded-lg text-center w-36">
              <p className="text-gray-400 text-sm">Скорость</p>
              <p className="text-2xl font-bold">
                {currentSpeed !== null ? `${Math.round(currentSpeed)} км/ч` : '-- км/ч'}
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg text-center w-36">
              <p className="text-gray-400 text-sm">Осталось</p>
              <p className="text-2xl font-bold">{estimatedTime}</p>
            </div>
          </div>

          {/* Прогресс маршрута */}
          <div className="w-80 bg-gray-700 rounded-full h-4 mb-8">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${routeProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Нижняя панель с кнопками навигации */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onPrevStop}
              disabled={currentStopIndex === 0}
              className={`p-4 rounded-lg ${currentStopIndex === 0 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 text-white'}`}
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>

            <div className="text-center">
              <p className="text-lg font-bold">
                {currentStopIndex + 1} из {totalStops}
              </p>
              <p className="text-sm text-gray-300">
                {currentPosition
                  ? `${currentPosition[0].toFixed(5)}, ${currentPosition[1].toFixed(5)}`
                  : 'Определение...'}
              </p>
            </div>

            <button
              onClick={onNextStop}
              disabled={currentStopIndex === totalStops - 1}
              className={`p-4 rounded-lg ${currentStopIndex === totalStops - 1 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 text-white'}`}
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Компактный режим навигации
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg z-40 transition-all duration-300 ${expanded ? 'h-auto' : 'h-16'}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="bg-blue-600 rounded-full p-2 mr-3">
              <MapPinIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium">{nextStopName}</h3>
              <p className="text-sm text-gray-500">
                {nextStopDistance !== null ? formatDistance(nextStopDistance) : 'Расчет расстояния...'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleFullscreen}
              className="mr-2 p-2 rounded-full hover:bg-gray-100"
              title="Полноэкранный режим"
            >
              <SparklesIcon className="h-5 w-5 text-blue-600" />
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="mr-2 p-2 rounded-full hover:bg-gray-100"
              title={expanded ? "Свернуть" : "Развернуть"}
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600" />
            </button>

            <button
              onClick={onExit}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Выйти из режима навигации"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {expanded && (
          <>
            <div className="flex items-center justify-between h-16 border-t border-gray-200">
              <div className="flex items-center">
                <div className="bg-green-600 rounded-full p-2 mr-3">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Расчетное время</h3>
                  <p className="text-sm text-gray-500">{estimatedTime}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Время в пути:</p>
                <p className="text-sm font-medium">{formatTime(elapsedTime)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between h-16 border-t border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-full p-2 mr-3">
                  <SignalIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Скорость</h3>
                  <p className="text-sm text-gray-500">
                    {currentSpeed !== null ? `${Math.round(currentSpeed)} км/ч` : 'Определение...'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Координаты:</p>
                <p className="text-xs font-mono">
                  {currentPosition
                    ? `${currentPosition[0].toFixed(5)}, ${currentPosition[1].toFixed(5)}`
                    : 'Определение...'}
                </p>
              </div>
            </div>

            {/* Кнопки переключения между точками */}
            <div className="flex justify-between items-center py-4 border-t border-gray-200">
              <button
                onClick={onPrevStop}
                disabled={currentStopIndex === 0}
                className={`px-4 py-2 rounded-md flex items-center ${
                  currentStopIndex === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Предыдущая точка
              </button>

              <div className="text-center">
                <span className="font-medium">
                  {currentStopIndex + 1} из {totalStops}
                </span>
              </div>

              <button
                onClick={onNextStop}
                disabled={currentStopIndex === totalStops - 1}
                className={`px-4 py-2 rounded-md flex items-center ${
                  currentStopIndex === totalStops - 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Следующая точка
                <ChevronRightIcon className="h-5 w-5 ml-1" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
