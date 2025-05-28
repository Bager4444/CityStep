'use client'

import { useState, useEffect } from 'react'
import { MapPinIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface NavigationPanelProps {
  currentPosition: [number, number] | null
  nextStopName: string
  nextStopDistance: number | null
  estimatedTime: string
  onExit: () => void
}

export default function NavigationPanel({
  currentPosition,
  nextStopName,
  nextStopDistance,
  estimatedTime,
  onExit
}: NavigationPanelProps) {
  const [expanded, setExpanded] = useState(true)

  // Форматирование расстояния
  const formatDistance = (distance: number | null): string => {
    if (distance === null) return 'Расчет...'
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} м`
    }
    return `${distance.toFixed(1)} км`
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg z-40 transition-all duration-300 ${expanded ? 'h-32' : 'h-16'}`}>
      <div className="container mx-auto px-4 h-full">
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
              onClick={() => setExpanded(!expanded)}
              className="mr-2 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <button 
              onClick={onExit}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {expanded && (
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
              <p className="text-sm text-gray-500">Текущие координаты:</p>
              <p className="text-xs font-mono">
                {currentPosition 
                  ? `${currentPosition[0].toFixed(6)}, ${currentPosition[1].toFixed(6)}` 
                  : 'Определение...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
