'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { MapMarker } from '../../components/map/MapComponent'
import AddressSearch from '../../components/search/AddressSearch'
import RouteCreatedModal from '../../components/routes/RouteCreatedModal'

// Динамический импорт компонента карты
const MapComponent = dynamic(
  () => import('../../components/map/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-200 h-64 flex items-center justify-center text-gray-500">
        Загрузка карты...
      </div>
    )
  }
)

export default function CreateRoute() {
  // Данные формы
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')
  const [travelTime, setTravelTime] = useState('')
  const [includeRestaurants, setIncludeRestaurants] = useState(false)
  const [includeCafes, setIncludeCafes] = useState(false)
  const [includeShops, setIncludeShops] = useState(false)
  const [includeParks, setIncludeParks] = useState(false)
  const [includeExhibitions, setIncludeExhibitions] = useState(false)
  const [routeName, setRouteName] = useState('')

  // Данные для карты
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]) // Москва по умолчанию
  const [startMarker, setStartMarker] = useState<MapMarker | null>(null)
  const [endMarker, setEndMarker] = useState<MapMarker | null>(null)
  const [mapMode, setMapMode] = useState<'start' | 'end'>('start') // Режим выбора точки на карте

  // Состояние модального окна
  const [showModal, setShowModal] = useState(false)
  const [createdRouteId, setCreatedRouteId] = useState('')

  // Обновление центра карты при изменении маркеров
  useEffect(() => {
    if (startMarker && !endMarker) {
      setMapCenter(startMarker.position)
    } else if (endMarker && !startMarker) {
      setMapCenter(endMarker.position)
    } else if (startMarker && endMarker) {
      // Центрируем карту между начальной и конечной точками
      const lat = (startMarker.position[0] + endMarker.position[0]) / 2
      const lng = (startMarker.position[1] + endMarker.position[1]) / 2
      setMapCenter([lat, lng])
    }
  }, [startMarker, endMarker])

  // Обработчик клика по карте
  const handleMapClick = (position: [number, number]) => {
    if (mapMode === 'start') {
      // Устанавливаем начальную точку
      setStartMarker({
        position,
        title: 'Начальная точка',
        type: 'start'
      })
      setStartPoint(`Точка [${position[0].toFixed(4)}, ${position[1].toFixed(4)}]`)
      // Переключаемся на выбор конечной точки
      setMapMode('end')
    } else {
      // Устанавливаем конечную точку
      setEndMarker({
        position,
        title: 'Конечная точка',
        type: 'end'
      })
      setEndPoint(`Точка [${position[0].toFixed(4)}, ${position[1].toFixed(4)}]`)
    }
  }

  // Обработчик выбора адреса для начальной точки
  const handleStartAddressSelect = (marker: MapMarker) => {
    setStartMarker(marker)
    setStartPoint(marker.title)
    setMapMode('end') // Переключаемся на выбор конечной точки
  }

  // Обработчик выбора адреса для конечной точки
  const handleEndAddressSelect = (marker: MapMarker) => {
    setEndMarker(marker)
    setEndPoint(marker.title)
  }

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startMarker || !endMarker || !travelTime) {
      alert('Пожалуйста, укажите начальную и конечную точки, а также время пути')
      return
    }

    // Формируем название маршрута, если оно не указано
    const name = routeName || `Маршрут от ${startPoint} до ${endPoint}`

    // Собираем типы мест для включения в маршрут
    const includeTypes = []
    if (includeRestaurants) includeTypes.push('restaurant')
    if (includeCafes) includeTypes.push('cafe')
    if (includeShops) includeTypes.push('shop')
    if (includeParks) includeTypes.push('park')
    if (includeExhibitions) includeTypes.push('exhibition')

    try {
      // Здесь будет запрос к API для создания маршрута
      // В демо-режиме просто симулируем ответ сервера

      // Симуляция запроса к API
      // В реальном приложении здесь будет запрос к API
      /*
      const response = await fetch('/api/routes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          start_point_name: startPoint,
          start_latitude: startMarker.position[0],
          start_longitude: startMarker.position[1],
          end_point_name: endPoint,
          end_latitude: endMarker.position[0],
          end_longitude: endMarker.position[1],
          travel_time: parseFloat(travelTime),
          include_types: includeTypes
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка при создании маршрута')
      }

      const data = await response.json()
      setCreatedRouteId(data.id)
      */

      // Демо-режим: генерируем случайный ID маршрута
      const demoRouteId = Math.floor(Math.random() * 1000).toString()
      setCreatedRouteId(demoRouteId)
      setRouteName(name)
      setShowModal(true)
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Произошла ошибка при создании маршрута. Пожалуйста, попробуйте еще раз.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Создание маршрута</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Модальное окно после создания маршрута */}
        {showModal && (
          <RouteCreatedModal
            routeId={createdRouteId}
            routeName={routeName}
            onClose={() => {
              setShowModal(false)
              // Сбрасываем форму после закрытия модального окна
              setStartPoint('')
              setEndPoint('')
              setTravelTime('')
              setStartMarker(null)
              setEndMarker(null)
              setIncludeRestaurants(false)
              setIncludeCafes(false)
              setIncludeShops(false)
              setIncludeParks(false)
              setIncludeExhibitions(false)
              setRouteName('')
              setMapMode('start')
            }}
          />
        )}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Выберите точки на карте</h2>
          <p className="text-gray-600 mb-4">
            Сейчас вы выбираете: <span className="font-medium text-green-600">
              {mapMode === 'start' ? 'Начальную точку' : 'Конечную точку'}
            </span>
          </p>

          <MapComponent
            center={mapCenter}
            zoom={12}
            height="400px"
            markers={[...(startMarker ? [startMarker] : []), ...(endMarker ? [endMarker] : [])]}
            onMarkerClick={(marker) => {
              if (marker.type === 'start') {
                setMapMode('start')
              } else if (marker.type === 'end') {
                setMapMode('end')
              }
            }}
            onMapClick={handleMapClick}
            interactive={true}
          />

          <div className="mt-4 flex justify-between">
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${mapMode === 'start' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setMapMode('start')}
            >
              Начальная точка
            </button>

            <button
              type="button"
              className={`px-4 py-2 rounded-md ${mapMode === 'end' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setMapMode('end')}
            >
              Конечная точка
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="routeName" className="block text-gray-700 font-medium mb-2">
              Название маршрута (опционально)
            </label>
            <input
              type="text"
              id="routeName"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Например: Прогулка по центру Москвы"
            />
          </div>

          <div className="mb-4">
            <AddressSearch
              type="start"
              onAddressSelect={handleStartAddressSelect}
              label="Начальная точка"
              placeholder="Введите адрес начальной точки"
            />
            <p className="text-xs text-gray-500 mt-1">
              Вы можете ввести адрес дома или любого другого места
            </p>
          </div>

          <div className="mb-4">
            <AddressSearch
              type="end"
              onAddressSelect={handleEndAddressSelect}
              label="Конечная точка"
              placeholder="Введите адрес конечной точки"
            />
            <p className="text-xs text-gray-500 mt-1">
              Вы можете ввести адрес дома или любого другого места
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="travelTime" className="block text-gray-700 font-medium mb-2">
              Время пути (в часах)
            </label>
            <input
              type="number"
              id="travelTime"
              value={travelTime}
              onChange={(e) => setTravelTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Например: 3"
              min="0.5"
              max="24"
              step="0.5"
              required
            />
          </div>

          <div className="mb-6">
            <p className="block text-gray-700 font-medium mb-2">Включить в маршрут:</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeRestaurants}
                  onChange={(e) => setIncludeRestaurants(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                Рестораны
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCafes}
                  onChange={(e) => setIncludeCafes(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                Кафе
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeShops}
                  onChange={(e) => setIncludeShops(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                Магазины
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeParks}
                  onChange={(e) => setIncludeParks(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                Парки
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeExhibitions}
                  onChange={(e) => setIncludeExhibitions(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-600"
                />
                Выставки
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Назад
            </Link>

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Создать маршрут
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
