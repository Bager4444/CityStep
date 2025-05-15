'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, MapIcon, ShareIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface RouteCreatedModalProps {
  routeId: string
  routeName: string
  onClose: () => void
}

export default function RouteCreatedModal({
  routeId,
  routeName,
  onClose
}: RouteCreatedModalProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  // Переход к просмотру маршрута
  const viewRoute = () => {
    router.push(`/route/${routeId}`)
  }

  // Копирование ссылки на маршрут
  const shareRoute = () => {
    const url = `${window.location.origin}/route/${routeId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Маршрут создан!</h3>
          <p className="text-gray-600">{routeName}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={viewRoute}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <MapIcon className="h-5 w-5 mr-2" />
            Просмотреть маршрут
          </button>

          <button
            onClick={shareRoute}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ShareIcon className="h-5 w-5 mr-2" />
            {copied ? 'Ссылка скопирована!' : 'Поделиться маршрутом'}
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Создать еще один маршрут
          </button>
        </div>
      </div>
    </div>
  )
}
