'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface MovingArrowProps {
  map: L.Map | null
  routePoints: [number, number][]
  currentPosition: [number, number] | null
  nextPointIndex?: number
}

export default function MovingArrow({
  map,
  routePoints,
  currentPosition,
  nextPointIndex = 0
}: MovingArrowProps) {
  const arrowMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!map || !currentPosition || routePoints.length < 2) return

    // Создаем HTML для стрелки
    const createArrowIcon = () => {
      return L.divIcon({
        html: `
          <div class="relative">
            <div class="h-12 w-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        `,
        className: 'moving-arrow',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    }

    // Удаляем предыдущий маркер, если он существует
    if (arrowMarkerRef.current) {
      map.removeLayer(arrowMarkerRef.current)
    }

    // Создаем новый маркер
    const arrowIcon = createArrowIcon()
    arrowMarkerRef.current = L.marker(currentPosition, {
      icon: arrowIcon,
      zIndexOffset: 1000 // Чтобы стрелка была поверх других маркеров
    }).addTo(map)

    // Функция для расчета угла между двумя точками
    const calculateAngle = (p1: [number, number], p2: [number, number]) => {
      const [lat1, lng1] = p1
      const [lat2, lng2] = p2

      // Преобразуем координаты в радианы
      const lat1Rad = (lat1 * Math.PI) / 180
      const lng1Rad = (lng1 * Math.PI) / 180
      const lat2Rad = (lat2 * Math.PI) / 180
      const lng2Rad = (lng2 * Math.PI) / 180

      // Рассчитываем направление (bearing)
      const y = Math.sin(lng2Rad - lng1Rad) * Math.cos(lat2Rad)
      const x =
        Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lng2Rad - lng1Rad)
      const bearing = Math.atan2(y, x)

      // Преобразуем радианы в градусы
      let degrees = (bearing * 180) / Math.PI
      degrees = (degrees + 360) % 360 // Нормализуем к 0-360

      return degrees
    }

    // Находим ближайшую точку на маршруте к текущему положению
    const findNextPointIndex = () => {
      if (!currentPosition) return nextPointIndex

      let minDistance = Infinity
      let closestIndex = nextPointIndex

      // Ищем ближайшую точку на маршруте, начиная с текущего индекса
      for (let i = nextPointIndex; i < routePoints.length; i++) {
        const point = routePoints[i]
        const distance = Math.sqrt(
          Math.pow(currentPosition[0] - point[0], 2) +
          Math.pow(currentPosition[1] - point[1], 2)
        )

        if (distance < minDistance) {
          minDistance = distance
          closestIndex = i
        }
      }

      return closestIndex
    }

    // Получаем индекс следующей точки
    const nextIndex = findNextPointIndex()
    const nextPoint = routePoints[Math.min(nextIndex + 1, routePoints.length - 1)]

    // Рассчитываем угол к следующей точке
    const angle = calculateAngle(currentPosition, nextPoint)

    // Устанавливаем поворот стрелки
    if (arrowMarkerRef.current) {
      // Если плагин не загружен, используем CSS трансформацию
      const arrowElement = arrowMarkerRef.current.getElement()?.querySelector('div')
      if (arrowElement) {
        arrowElement.style.transform = `rotate(${angle}deg)`
      }
    }

    // Очистка при размонтировании
    return () => {
      if (arrowMarkerRef.current && map) {
        map.removeLayer(arrowMarkerRef.current)
      }
    }
  }, [map, currentPosition, routePoints, nextPointIndex])

  return null
}
