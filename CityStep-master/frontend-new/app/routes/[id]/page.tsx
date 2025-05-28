'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapMarker, MapRoute } from '@/components/map/MapComponent'

// Динамический импорт компонента карты
const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-200 h-64 flex items-center justify-center text-gray-500">
        Загрузка карты...
      </div>
    )
  }
)

// Типы данных
interface Place {
  id: string
  name: string
  description: string
  type: 'attraction' | 'park' | 'exhibition' | 'cafe' | 'restaurant' | 'shop' | 'home'
  latitude: number
  longitude: number
  estimated_time: number
  image_url: string
  beauty_score?: number
  popularity?: number
  historical_value?: number
  architectural_value?: number
  best_time?: string[]
}

interface RoutePoint {
  place: Place
  order: number
  stay_time: number // в минутах
}

interface RouteData {
  id: string
  name: string
  description: string
  points: RoutePoint[]
  total_distance: number // в метрах
  total_time: number // в минутах
  created_at: string
}

export default function RoutePage({ params }: { params: { id: string } }) {
  const [route, setRoute] = useState<RouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]) // Москва по умолчанию
  const [mapZoom, setMapZoom] = useState(11)

  // Загрузка данных о маршруте
  useEffect(() => {
    const fetchRoute = async () => {
      setLoading(true)
      try {
        // В реальном приложении здесь был бы запрос к API
        // Для демонстрации используем моковые данные
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Загружаем моковые данные о местах
        const mockPlaces = await import('@/app/moscow-places/beautiful/mockData')
        
        // Создаем моковый маршрут
        const mockRoute: RouteData = {
          id: params.id,
          name: "Маршрут по красивым местам центра Москвы",
          description: "Маршрут включает самые красивые и интересные места центра Москвы",
          points: [
            {
              place: mockPlaces.default[0], // Храм Василия Блаженного
              order: 1,
              stay_time: 60
            },
            {
              place: mockPlaces.default[1], // Красная площадь
              order: 2,
              stay_time: 45
            },
            {
              place: mockPlaces.default[2], // Московский Кремль
              order: 3,
              stay_time: 120
            },
            {
              place: mockPlaces.default[3], // Большой театр
              order: 4,
              stay_time: 90
            },
            {
              place: mockPlaces.default[6], // Парк Зарядье
              order: 5,
              stay_time: 60
            }
          ],
          total_distance: 3.2, // км
          total_time: 375, // минут
          created_at: new Date().toISOString()
        }
        
        setRoute(mockRoute)
        
        // Обновляем маркеры и маршруты на карте
        updateMapMarkersAndRoutes(mockRoute)
      } catch (error) {
        console.error('Ошибка при загрузке маршрута:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()
  }, [params.id])

  // Функция для обновления маркеров и маршрутов на карте
  const updateMapMarkersAndRoutes = (routeData: RouteData) => {
    // Создаем маркеры для точек маршрута
    const markers: MapMarker[] = routeData.points.map((point, index) => ({
      position: [point.place.latitude, point.place.longitude],
      title: `${index + 1}. ${point.place.name}`,
      description: point.place.description,
      type: index === 0 ? 'start' : index === routeData.points.length - 1 ? 'end' : point.place.type,
      active: true,
      image_url: point.place.image_url,
      beauty_score: point.place.beauty_score,
      estimated_time: point.place.estimated_time
    }))
    
    setMapMarkers(markers)
    
    // Создаем маршрут между точками
    if (routeData.points.length >= 2) {
      const routePoints: [number, number][] = routeData.points.map(point => 
        [point.place.latitude, point.place.longitude]
      )
      
      setMapRoutes([{
        points: routePoints,
        color: '#16a34a' // Зеленый цвет
      }])
      
      // Центрируем карту на маршруте
      const latSum = routePoints.reduce((sum, point) => sum + point[0], 0)
      const lngSum = routePoints.reduce((sum, point) => sum + point[1], 0)
      const centerLat = latSum / routePoints.length
      const centerLng = lngSum / routePoints.length
      
      setMapCenter([centerLat, centerLng])
      setMapZoom(13)
    }
  }

  // Функция для форматирования времени
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} мин.`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ч. ${mins} мин.` : `${hours} ч.`
  }

  // Функция для форматирования расстояния
  const formatDistance = (kilometers: number) => {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)} м`
    }
    return `${kilometers.toFixed(1)} км`
  }

  // Функция для получения цвета в зависимости от типа места
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'attraction':
        return 'bg-red-100 text-red-800'
      case 'park':
        return 'bg-green-100 text-green-800'
      case 'exhibition':
        return 'bg-purple-100 text-purple-800'
      case 'cafe':
        return 'bg-yellow-100 text-yellow-800'
      case 'restaurant':
        return 'bg-orange-100 text-orange-800'
      case 'shop':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Функция для получения названия типа места
  const getTypeName = (type: string) => {
    switch (type) {
      case 'attraction':
        return 'Достопримечательность'
      case 'park':
        return 'Парк'
      case 'exhibition':
        return 'Выставка'
      case 'cafe':
        return 'Кафе'
      case 'restaurant':
        return 'Ресторан'
      case 'shop':
        return 'Магазин'
      case 'home':
        return 'Дом'
      default:
        return 'Место'
    }
  }

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка маршрута...</p>
        </div>
      ) : route ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-green-700">{route.name}</h1>
              <p className="text-gray-600">Создан: {formatDate(route.created_at)}</p>
            </div>
            <Link
              href="/create-route/beautiful-places"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Создать новый маршрут
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Карта маршрута</h2>
                <MapComponent
                  center={mapCenter}
                  zoom={mapZoom}
                  markers={mapMarkers}
                  routes={mapRoutes}
                  height="500px"
                />
              </div>
            </div>

            <div>
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Информация о маршруте</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Описание</h3>
                    <p className="text-gray-700">{route.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Общее расстояние</h3>
                      <p className="text-lg font-semibold text-green-700">{formatDistance(route.total_distance)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Общее время</h3>
                      <p className="text-lg font-semibold text-green-700">{formatTime(route.total_time)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Количество мест</h3>
                      <p className="text-lg font-semibold text-green-700">{route.points.length}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Начальная точка</h3>
                      <p className="text-gray-700 truncate">{route.points[0].place.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Точки маршрута</h2>
            <div className="space-y-6">
              {route.points.map((point, index) => (
                <div key={point.place.id} className="flex flex-col md:flex-row gap-4 pb-6 border-b border-gray-200 last:border-0">
                  <div className="md:w-1/4">
                    <div className="bg-gray-200 rounded-md overflow-hidden h-48">
                      <img 
                        src={point.place.image_url} 
                        alt={point.place.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Если изображение не загрузилось, заменяем на заглушку
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Нет+фото';
                        }}
                      />
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <div className="flex items-center mb-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold mr-2">
                        {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold">{point.place.name}</h3>
                    </div>
                    <div className="flex items-center mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(point.place.type)}`}>
                        {getTypeName(point.place.type)}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        Время пребывания: {formatTime(point.stay_time)}
                      </span>
                      {point.place.beauty_score && (
                        <span className="ml-3 text-sm text-green-600 font-semibold">
                          Красота: {point.place.beauty_score}/10
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{point.place.description}</p>
                    
                    {index < route.points.length - 1 && (
                      <div className="mt-3 flex items-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Далее: {route.points[index + 1].place.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Link
              href="/moscow-places/beautiful"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              ← Вернуться к красивым местам
            </Link>
            <Link
              href="/create-route/beautiful-places"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Создать новый маршрут
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Маршрут не найден</h1>
          <p className="text-gray-500 mb-6">Маршрут с ID {params.id} не существует или был удален</p>
          <Link
            href="/create-route/beautiful-places"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Создать новый маршрут
          </Link>
        </div>
      )}
    </div>
  )
}
