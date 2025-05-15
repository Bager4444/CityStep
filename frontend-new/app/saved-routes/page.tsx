'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRoutes } from '@/hooks/useRoutes'
import { formatDate, formatTravelTime } from '@/lib/utils'

export default function SavedRoutes() {
  const { routes, loading, error, deleteRoute } = useRoutes()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот маршрут?')) {
      setIsDeleting(id)
      await deleteRoute(id)
      setIsDeleting(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Мои маршруты</h1>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-md h-48 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      ) : routes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map(route => (
            <div key={route.id} className="bg-white p-4 rounded-lg shadow-md border-t-4 border-green-500">
              <h2 className="text-xl font-semibold mb-2 text-green-700">{route.name}</h2>

              <div className="text-sm text-gray-600 mb-4">
                <p><span className="font-medium">От:</span> {route.start_point_name}</p>
                <p><span className="font-medium">До:</span> {route.end_point_name}</p>
                <p><span className="font-medium">Длительность:</span> {formatTravelTime(route.travel_time)}</p>
                <p><span className="font-medium">Дата создания:</span> {formatDate(route.created_at)}</p>
              </div>

              <div className="flex justify-between">
                <Link
                  href={`/route/${route.id}`}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  Открыть
                </Link>

                <button
                  onClick={() => handleDelete(route.id)}
                  disabled={isDeleting === route.id}
                  className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {isDeleting === route.id ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">У вас пока нет сохраненных маршрутов</p>
          <Link
            href="/create-route"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Создать маршрут
          </Link>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
