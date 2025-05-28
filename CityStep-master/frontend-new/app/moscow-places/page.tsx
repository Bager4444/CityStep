'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Place } from '@/lib/supabase'
import { MapMarker } from '@/components/map/MapComponent'

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

// Типы для фильтрации
const PLACE_TYPES = [
  { id: 'attraction', name: 'Достопримечательности' },
  { id: 'cafe', name: 'Кафе' },
  { id: 'restaurant', name: 'Рестораны' },
  { id: 'shop', name: 'Магазины' },
  { id: 'park', name: 'Парки' },
  { id: 'exhibition', name: 'Выставки' }
]

export default function MoscowPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]) // Москва по умолчанию
  const [mapZoom, setMapZoom] = useState(11)

  // Загрузка мест при монтировании компонента
  useEffect(() => {
    fetchPlaces()
  }, [])

  // Обновление фильтрованных мест при изменении фильтров
  useEffect(() => {
    filterPlaces()
  }, [places, searchQuery, selectedTypes])

  // Обновление маркеров карты при изменении фильтрованных мест
  useEffect(() => {
    updateMapMarkers()
  }, [filteredPlaces, selectedPlace])

  // Функция для загрузки мест
  const fetchPlaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/places')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при загрузке мест')
      }

      const data = await response.json()
      setPlaces(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Функция для фильтрации мест
  const filterPlaces = () => {
    let filtered = [...places]

    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        place =>
          place.name.toLowerCase().includes(query) ||
          (place.description && place.description.toLowerCase().includes(query))
      )
    }

    // Фильтрация по типам
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(place => selectedTypes.includes(place.type))
    }

    setFilteredPlaces(filtered)
  }

  // Функция для обновления маркеров карты
  const updateMapMarkers = () => {
    const markers: MapMarker[] = filteredPlaces.map(place => ({
      position: [place.latitude, place.longitude],
      title: place.name,
      description: place.description || '',
      type: place.type,
      active: selectedPlace ? place.id === selectedPlace.id : false
    }))

    setMapMarkers(markers)

    // Если выбрано место, центрируем карту на нем
    if (selectedPlace) {
      setMapCenter([selectedPlace.latitude, selectedPlace.longitude])
      setMapZoom(15)
    } else if (markers.length > 0) {
      // Если нет выбранного места, но есть маркеры, центрируем карту на Москве
      setMapCenter([55.7558, 37.6173])
      setMapZoom(11)
    }
  }

  // Обработчик клика по маркеру
  const handleMarkerClick = (marker: MapMarker) => {
    const place = filteredPlaces.find(
      p => p.latitude === marker.position[0] && p.longitude === marker.position[1]
    )

    if (place) {
      setSelectedPlace(place)
      // Прокручиваем к информации о месте
      document.getElementById('place-details')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Обработчик клика по месту в списке
  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    setMapCenter([place.latitude, place.longitude])
    setMapZoom(15)
  }

  // Обработчик изменения типа места
  const handleTypeChange = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    )
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Красивые места Москвы</h1>
        <Link
          href="/moscow-places/beautiful"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Анализ красивых мест
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка - фильтры и список мест */}
        <div className="lg:w-1/3 space-y-6">
          {/* Фильтры */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Фильтры</h2>

            {/* Поиск */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Введите название или описание"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Типы мест */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Типы мест</p>
              <div className="space-y-2">
                {PLACE_TYPES.map(type => (
                  <label key={type.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.id)}
                      onChange={() => handleTypeChange(type.id)}
                      className="mr-2 h-4 w-4 text-green-600"
                    />
                    {type.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Список мест */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Список мест {filteredPlaces.length > 0 && `(${filteredPlaces.length})`}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Загрузка мест...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 bg-red-50 rounded-lg">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchPlaces}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Нет мест, соответствующих фильтрам</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredPlaces.map(place => (
                  <div
                    key={place.id}
                    className={`p-3 rounded-md cursor-pointer ${
                      selectedPlace && selectedPlace.id === place.id
                        ? 'bg-green-100 border-l-4 border-green-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handlePlaceClick(place)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{place.name}</h3>
                      <span className="text-sm text-gray-500">{formatTime(place.estimated_time)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${getTypeColor(place.type)}`}>
                        {getTypeName(place.type)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - карта и детали места */}
        <div className="lg:w-2/3 space-y-6">
          {/* Карта */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Карта</h2>
            <MapComponent
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              height="500px"
              onMarkerClick={handleMarkerClick}
            />
          </div>

          {/* Детали выбранного места */}
          {selectedPlace && (
            <div id="place-details" className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Информация о месте</h2>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Изображение места */}
                  {selectedPlace.image_url ? (
                    <div className="md:w-1/3">
                      <img
                        src={selectedPlace.image_url}
                        alt={selectedPlace.name}
                        className="w-full h-auto rounded-md object-cover"
                        onError={(e) => {
                          // Если изображение не загрузилось, показываем заглушку
                          (e.target as HTMLImageElement).src = '/images/place-placeholder.jpg';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="md:w-1/3 bg-gray-200 rounded-md flex items-center justify-center h-48">
                      <span className="text-gray-500">Нет изображения</span>
                    </div>
                  )}

                  {/* Информация о месте */}
                  <div className="md:w-2/3">
                    <h3 className="text-2xl font-bold text-green-700">{selectedPlace.name}</h3>
                    <div className="flex items-center mt-2 mb-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${getTypeColor(selectedPlace.type)}`}>
                        {getTypeName(selectedPlace.type)}
                      </span>
                      <span className="ml-4 text-gray-600">
                        Время посещения: {formatTime(selectedPlace.estimated_time)}
                      </span>
                    </div>
                    <p className="text-gray-700">{selectedPlace.description || 'Описание отсутствует'}</p>

                    {/* Координаты */}
                    <div className="mt-4 text-sm text-gray-500">
                      Координаты: {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
                    </div>

                    {/* Кнопки действий */}
                    <div className="mt-6 flex gap-3">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => {
                          // Здесь будет логика для создания маршрута с этим местом
                          window.location.href = `/create-route?place=${selectedPlace.id}`;
                        }}
                      >
                        Создать маршрут с этим местом
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        onClick={() => setSelectedPlace(null)}
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Вспомогательные функции для отображения типов мест
function getTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    attraction: 'Достопримечательность',
    cafe: 'Кафе',
    restaurant: 'Ресторан',
    shop: 'Магазин',
    park: 'Парк',
    exhibition: 'Выставка'
  }
  return typeMap[type] || type
}

function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    attraction: 'bg-red-100 text-red-800',
    cafe: 'bg-blue-100 text-blue-800',
    restaurant: 'bg-green-100 text-green-800',
    shop: 'bg-purple-100 text-purple-800',
    park: 'bg-lime-100 text-lime-800',
    exhibition: 'bg-orange-100 text-orange-800'
  }
  return colorMap[type] || 'bg-gray-100 text-gray-800'
}
