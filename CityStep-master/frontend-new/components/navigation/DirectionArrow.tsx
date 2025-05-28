'use client'

import { useEffect, useState } from 'react'
import { ArrowUpIcon } from '@heroicons/react/24/solid'

interface DirectionArrowProps {
  currentPosition: [number, number] | null
  targetPosition: [number, number] | null
  visible: boolean
}

export default function DirectionArrow({
  currentPosition,
  targetPosition,
  visible
}: DirectionArrowProps) {
  const [angle, setAngle] = useState(0)

  // Рассчитываем угол между текущим положением и целью
  useEffect(() => {
    if (!currentPosition || !targetPosition || !visible) return

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
  }, [currentPosition, targetPosition, visible])

  if (!visible || !currentPosition || !targetPosition) {
    return null
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div 
        className="bg-blue-600 rounded-full p-4 shadow-lg"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <ArrowUpIcon className="h-12 w-12 text-white" />
      </div>
      <div className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-full text-center text-sm font-medium">
        {Math.round(angle)}°
      </div>
    </div>
  )
}
