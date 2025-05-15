'use client'

import { useState, useEffect } from 'react'
import { MapMarker } from '../map/MapComponent'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface Direction {
  instruction: string
  distance: number
  icon: string
  iconPath: string
  placeId?: string
}

interface RouteDirectionsProps {
  startPoint: {
    name: string
    latitude: number
    longitude: number
  }
  endPoint: {
    name: string
    latitude: number
    longitude: number
  }
  places: MapMarker[]
  onDirectionClick?: (placeId: string) => void
}

export default function RouteDirections({
  startPoint,
  endPoint,
  places,
  onDirectionClick
}: RouteDirectionsProps) {
  const [directions, setDirections] = useState<Direction[]>([])
  const [expanded, setExpanded] = useState(true)
  const [activeDirectionIndex, setActiveDirectionIndex] = useState<number | null>(null)

  // Рассчитываем расстояние между двумя точками в километрах
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Определяем направление движения
  const getDirection = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const dLat = lat2 - lat1
    const dLon = lon2 - lon1

    // Определяем основное направление
    if (Math.abs(dLat) > Math.abs(dLon)) {
      return dLat > 0 ? 'north' : 'south'
    } else {
      return dLon > 0 ? 'east' : 'west'
    }
  }

  // Генерируем инструкцию для поворота
  const generateInstruction = (
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    placeName: string
  ): string => {
    const direction = getDirection(fromLat, fromLon, toLat, toLon)

    switch (direction) {
      case 'north':
        return `Двигайтесь на север к ${placeName}`
      case 'south':
        return `Двигайтесь на юг к ${placeName}`
      case 'east':
        return `Двигайтесь на восток к ${placeName}`
      case 'west':
        return `Двигайтесь на запад к ${placeName}`
      default:
        return `Двигайтесь к ${placeName}`
    }
  }

  // Генерируем иконку для направления
  const getDirectionIcon = (direction: string): { icon: string, iconPath: string } => {
    switch (direction) {
      case 'north':
        return {
          icon: '↑',
          iconPath: '/icons/direction-north.svg'
        }
      case 'south':
        return {
          icon: '↓',
          iconPath: '/icons/direction-south.svg'
        }
      case 'east':
        return {
          icon: '→',
          iconPath: '/icons/direction-east.svg'
        }
      case 'west':
        return {
          icon: '←',
          iconPath: '/icons/direction-west.svg'
        }
      default:
        return {
          icon: '•',
          iconPath: '/icons/direction-point.svg'
        }
    }
  }

  // Генерируем список поворотов
  useEffect(() => {
    if (!startPoint || !endPoint || !places.length) return

    const newDirections: Direction[] = []

    // Добавляем начальную точку
    let prevLat = startPoint.latitude
    let prevLon = startPoint.longitude

    // Сортируем места по порядку (если есть свойство order)
    const sortedPlaces = [...places].sort((a, b) => {
      const orderA = (a as any).order || 0
      const orderB = (b as any).order || 0
      return orderA - orderB
    })

    // Добавляем инструкции для каждого места
    sortedPlaces.forEach((place, index) => {
      const [lat, lon] = place.position
      const distance = calculateDistance(prevLat, prevLon, lat, lon)
      const direction = getDirection(prevLat, prevLon, lat, lon)
      const instruction = generateInstruction(prevLat, prevLon, lat, lon, place.title)
      const { icon, iconPath } = getDirectionIcon(direction)

      newDirections.push({
        instruction,
        distance,
        icon,
        iconPath,
        placeId: (place as any).id
      })

      prevLat = lat
      prevLon = lon
    })

    // Добавляем конечную точку
    const finalDistance = calculateDistance(prevLat, prevLon, endPoint.latitude, endPoint.longitude)
    const finalDirection = getDirection(prevLat, prevLon, endPoint.latitude, endPoint.longitude)
    const { icon, iconPath } = getDirectionIcon(finalDirection)

    newDirections.push({
      instruction: `Двигайтесь к конечной точке: ${endPoint.name}`,
      distance: finalDistance,
      icon,
      iconPath
    })

    setDirections(newDirections)
  }, [startPoint, endPoint, places])

  // Форматируем расстояние
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} м`
    }
    return `${distance.toFixed(1)} км`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div
        className="flex items-center justify-between p-4 cursor-pointer border-b"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-bold text-lg text-green-700">Маршрут</h3>
        {expanded ? (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {expanded && (
        <div className="p-4">
          <div className="flex items-center mb-4">
            <div className="bg-green-600 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3">
              A
            </div>
            <div>
              <p className="font-medium">{startPoint.name}</p>
              <p className="text-xs text-gray-500">Начальная точка</p>
            </div>
          </div>

          <div className="space-y-4 ml-4 border-l-2 border-gray-200 pl-4">
            {directions.map((direction, index) => (
              <div
                key={index}
                className={`flex items-start cursor-pointer transition-colors ${
                  activeDirectionIndex === index ? 'bg-green-50' : ''
                }`}
                onClick={() => {
                  setActiveDirectionIndex(index)
                  if (direction.placeId && onDirectionClick) {
                    onDirectionClick(direction.placeId)
                  }
                }}
              >
                <div className="mr-3 flex-shrink-0 mt-1">
                  <img src={direction.iconPath} alt={direction.icon} className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm">{direction.instruction}</p>
                  <p className="text-xs text-gray-500">{formatDistance(direction.distance)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-4">
            <div className="bg-red-600 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3">
              B
            </div>
            <div>
              <p className="font-medium">{endPoint.name}</p>
              <p className="text-xs text-gray-500">Конечная точка</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
