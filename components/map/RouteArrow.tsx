'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface RouteArrowProps {
  map: L.Map | null
  routePoints: [number, number][]
  color?: string
  weight?: number
  opacity?: number
  animate?: boolean
  arrowColor?: string
}

export default function RouteArrow({
  map,
  routePoints,
  animate = true
}: RouteArrowProps) {
  const polylineRef = useRef<L.Polyline | null>(null)
  const arrowMarkersRef = useRef<L.Marker[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!map || routePoints.length < 2) return

    // Создаем полилинию для маршрута
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
    }

    polylineRef.current = L.polyline(routePoints, {
      color: '#8b5cf6', // Всегда фиолетовый цвет
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'purple-route' // Применяем класс для стилизации
    }).addTo(map)

    // Очищаем предыдущие маркеры стрелок
    arrowMarkersRef.current.forEach(marker => {
      if (map) map.removeLayer(marker)
    })
    arrowMarkersRef.current = []

    // Если анимация включена, добавляем стрелки на маршрут
    if (animate) {
      // Создаем иконку стрелки
      const arrowIcon = L.divIcon({
        className: 'route-arrow-icon',
        html: `
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <path d="M16 4L26 16L16 28L6 16L16 4Z" fill="#8b5cf6" stroke="white" stroke-width="2" filter="url(#glow)" />
          </svg>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      // Функция для расчета точек для стрелок
      const calculateArrowPoints = () => {
        const points: [number, number][] = []
        const totalLength = routePoints.length

        // Размещаем стрелки равномерно по маршруту
        // Увеличиваем количество стрелок для более плавной анимации
        const numArrows = Math.min(8, Math.floor(totalLength / 2))
        if (numArrows <= 0) return points

        const step = Math.floor(totalLength / numArrows)

        for (let i = 1; i < totalLength - 1; i += step) {
          points.push(routePoints[i])
        }

        return points
      }

      // Получаем точки для стрелок
      const arrowPoints = calculateArrowPoints()

      // Создаем маркеры стрелок
      arrowPoints.forEach((point, index) => {
        // Рассчитываем угол для стрелки (направление к следующей точке)
        const nextPoint = routePoints[Math.min(index * Math.floor(routePoints.length / arrowPoints.length) + 1, routePoints.length - 1)]
        const prevPoint = routePoints[Math.max(index * Math.floor(routePoints.length / arrowPoints.length) - 1, 0)]

        const angle = calculateAngle(prevPoint, nextPoint)

        // Создаем маркер со стрелкой
        const marker = L.marker(point, {
          icon: arrowIcon,
          rotationAngle: angle, // Требуется плагин Leaflet.RotatedMarker
          rotationOrigin: 'center center'
        }).addTo(map)

        arrowMarkersRef.current.push(marker)
      })

      // Анимация движения стрелок по маршруту
      let animationStep = 0
      let lastTimestamp = 0
      const animationSpeed = 0.2 // Скорость анимации (меньше = медленнее)

      const animateArrows = (timestamp: number) => {
        // Рассчитываем дельту времени для плавной анимации
        if (lastTimestamp === 0) {
          lastTimestamp = timestamp
        }

        const deltaTime = timestamp - lastTimestamp
        lastTimestamp = timestamp

        // Увеличиваем шаг анимации пропорционально времени
        animationStep = (animationStep + deltaTime * animationSpeed) % routePoints.length

        // Обновляем позиции стрелок
        arrowMarkersRef.current.forEach((marker, index) => {
          // Равномерно распределяем стрелки по маршруту
          const offset = (index * (routePoints.length / arrowMarkersRef.current.length))
          const pointIndex = Math.floor((animationStep + offset) % routePoints.length)

          // Интерполяция между точками для плавного движения
          const nextPointIndex = (pointIndex + 1) % routePoints.length
          const progress = (animationStep + offset) % 1

          const currentPoint = routePoints[pointIndex]
          const nextPoint = routePoints[nextPointIndex]

          // Линейная интерполяция между точками
          const interpolatedLat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progress
          const interpolatedLng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progress
          const interpolatedPoint: [number, number] = [interpolatedLat, interpolatedLng]

          // Рассчитываем угол для стрелки
          const angle = calculateAngle(currentPoint, nextPoint)

          marker.setLatLng(interpolatedPoint)
          // @ts-ignore - rotationAngle не является стандартным свойством, но добавляется плагином
          if (marker.options.rotationAngle !== undefined) {
            // @ts-ignore
            marker.setRotationAngle(angle)
          }
        })

        animationRef.current = requestAnimationFrame(animateArrows)
      }

      // Запускаем анимацию
      animationRef.current = requestAnimationFrame(animateArrows)
    }

    // Очистка при размонтировании
    return () => {
      if (polylineRef.current && map) {
        map.removeLayer(polylineRef.current)
      }

      arrowMarkersRef.current.forEach(marker => {
        if (map) map.removeLayer(marker)
      })

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [map, routePoints, color, weight, opacity, animate, arrowColor])

  // Функция для расчета угла между двумя точками
  const calculateAngle = (point1: [number, number], point2: [number, number]): number => {
    const [lat1, lng1] = point1
    const [lat2, lng2] = point2

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

  return null
}
