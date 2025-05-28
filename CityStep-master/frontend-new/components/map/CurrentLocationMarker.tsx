'use client'

// Этот компонент должен использоваться только на клиенте

import { useEffect } from 'react'
import L from 'leaflet'

interface CurrentLocationMarkerProps {
  map: L.Map | null
  position: [number, number] | null
  accuracy?: number
}

export default function CurrentLocationMarker({
  map,
  position,
  accuracy = 0
}: CurrentLocationMarkerProps) {
  useEffect(() => {
    if (!map || !position) return

    // Создаем маркер текущего местоположения
    const locationMarker = L.marker(position, {
      icon: L.divIcon({
        className: 'current-location-marker',
        html: `
          <div class="relative">
            <div class="h-6 w-6 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
            <div class="absolute top-0 left-0 h-6 w-6 bg-blue-500 rounded-full animate-ping opacity-50"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(map)

    // Если есть данные о точности, добавляем круг
    let accuracyCircle: L.Circle | null = null
    if (accuracy > 0) {
      accuracyCircle = L.circle(position, {
        radius: accuracy,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        color: '#3b82f6',
        weight: 1
      }).addTo(map)
    }

    // Очистка при размонтировании
    return () => {
      map.removeLayer(locationMarker)
      if (accuracyCircle) {
        map.removeLayer(accuracyCircle)
      }
    }
  }, [map, position, accuracy])

  return null
}
