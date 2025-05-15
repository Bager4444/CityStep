'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface AnimatedRouteProps {
  map: L.Map | null
  routePoints: [number, number][]
}

export default function AnimatedRoute({
  map,
  routePoints
}: AnimatedRouteProps) {
  const polylineRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!map || routePoints.length < 2) return

    // Создаем полилинию для маршрута
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
    }

    // Создаем фиолетовую линию маршрута
    polylineRef.current = L.polyline(routePoints, {
      color: '#8b5cf6',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'purple-route'
    }).addTo(map)

    // Очищаем предыдущие маркеры
    markersRef.current.forEach(marker => {
      if (map) map.removeLayer(marker)
    })
    markersRef.current = []

    // Создаем маркеры-стрелки
    const createArrowMarkers = () => {
      // Количество стрелок на маршруте - зависит от длины маршрута
      const numArrows = Math.min(20, Math.max(8, Math.floor(routePoints.length / 5)))

      for (let i = 0; i < numArrows; i++) {
        // Создаем HTML для стрелки
        const arrowDiv = document.createElement('div')
        arrowDiv.className = 'route-arrow-icon'
        arrowDiv.innerHTML = `
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
        `

        // Создаем иконку
        const icon = L.divIcon({
          html: arrowDiv,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })

        // Создаем маркер и добавляем его на карту
        const marker = L.marker([0, 0], { icon }).addTo(map)
        markersRef.current.push(marker)
      }
    }

    createArrowMarkers()

    // Функция для расчета позиции на линии
    const getPositionOnLine = (fraction: number) => {
      const totalLength = routePoints.length
      const index = Math.floor(fraction * (totalLength - 1))
      const remainder = fraction * (totalLength - 1) - index

      if (index >= totalLength - 1) {
        return routePoints[totalLength - 1]
      }

      const p1 = routePoints[index]
      const p2 = routePoints[index + 1]

      // Линейная интерполяция между точками
      const lat = p1[0] + remainder * (p2[0] - p1[0])
      const lng = p1[1] + remainder * (p2[1] - p1[1])

      return [lat, lng] as [number, number]
    }

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

    // Анимация стрелок
    let offset = 0
    let lastTimestamp = 0
    const animateArrows = (timestamp = 0) => {
      // Рассчитываем дельту времени для плавной анимации
      if (lastTimestamp === 0) {
        lastTimestamp = timestamp
      }

      const deltaTime = timestamp - lastTimestamp
      lastTimestamp = timestamp

      // Скорость зависит от длины маршрута
      const speed = 0.0005 * Math.min(10, Math.max(1, routePoints.length / 10))

      // Увеличиваем смещение с учетом времени
      offset = (offset + speed * deltaTime) % 1

      markersRef.current.forEach((marker, i) => {
        // Распределяем стрелки равномерно по маршруту
        const fraction = (offset + i / markersRef.current.length) % 1
        const position = getPositionOnLine(fraction)

        // Получаем следующую точку для расчета угла
        const nextFraction = (fraction + 0.01) % 1
        const nextPosition = getPositionOnLine(nextFraction)

        // Рассчитываем угол
        const angle = calculateAngle(position, nextPosition)

        // Устанавливаем позицию и поворот
        marker.setLatLng(position)

        // Поворачиваем стрелку
        const arrowElement = marker.getElement()?.querySelector('svg')
        if (arrowElement) {
          arrowElement.style.transform = `rotate(${angle}deg)`
        }
      })

      animationFrameRef.current = requestAnimationFrame(animateArrows)
    }

    // Запускаем анимацию
    animationFrameRef.current = requestAnimationFrame(animateArrows)

    // Очистка при размонтировании
    return () => {
      if (polylineRef.current && map) {
        map.removeLayer(polylineRef.current)
      }

      markersRef.current.forEach(marker => {
        if (map) map.removeLayer(marker)
      })

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [map, routePoints])

  return null
}
