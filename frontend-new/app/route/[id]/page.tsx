'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { MapMarker, MapRoute } from '../../../components/map/MapComponent'
import RouteDirections from '../../../components/routes/RouteDirections'
import LocationTracker from '../../../components/map/LocationTracker'
import CurrentLocationMarker from '../../../components/map/CurrentLocationMarker'

// Динамический импорт компонента карты
const MapComponent = dynamic(
  () => import('../../../components/map/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-200 h-96 flex items-center justify-center text-gray-500">
        Загрузка карты...
      </div>
    )
  }
)

// Временные данные для демонстрации
const mockRouteData = {
  id: '1',
  name: 'Исторический центр',
  startPoint: 'Гостиница "Москва"',
  endPoint: 'Вокзал',
  duration: '4 часа',
  stops: [
    {
      id: '1',
      name: 'Красная площадь',
      type: 'attraction',
      position: [55.7539, 37.6208],
      description: 'Главная площадь Москвы',
      estimatedTime: '30 минут'
    },
    {
      id: '2',
      name: 'ГУМ',
      type: 'attraction',
      position: [55.7546, 37.6215],
      description: 'Главный универсальный магазин',
      estimatedTime: '45 минут'
    },
    {
      id: '3',
      name: 'Кафе "Пушкинъ"',
      type: 'cafe',
      position: [55.7649, 37.6049],
      description: 'Известное кафе с русской кухней',
      estimatedTime: '1 час'
    },
    {
      id: '4',
      name: 'Большой театр',
      type: 'attraction',
      position: [55.7601, 37.6186],
      description: 'Исторический театр оперы и балета',
      estimatedTime: '40 минут'
    }
  ],
  // Координаты начальной и конечной точек
  startPosition: [55.7558, 37.6173],
  endPosition: [55.7580, 37.6210],
  // Маршрут между точками
  routePoints: [
    [55.7558, 37.6173], // Начальная точка
    [55.7539, 37.6208], // Красная площадь
    [55.7546, 37.6215], // ГУМ
    [55.7649, 37.6049], // Кафе "Пушкинъ"
    [55.7601, 37.6186], // Большой театр
    [55.7580, 37.6210]  // Конечная точка
  ]
}

export default function RoutePage({ params }: { params: { id: string } }) {
  const [activeStep, setActiveStep] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null) // Текущее местоположение
  const [trackingEnabled, setTrackingEnabled] = useState(false) // Состояние отслеживания
  const mapRef = useRef<L.Map | null>(null) // Ссылка на карту

  // В реальном приложении здесь будет запрос к API для получения данных маршрута
  const routeData = mockRouteData

  const handleNextStep = () => {
    if (activeStep < routeData.stops.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  // Подготовка данных для карты
  const mapMarkers: MapMarker[] = [
    // Начальная точка
    {
      position: routeData.startPosition as [number, number],
      title: routeData.startPoint,
      description: 'Начальная точка маршрута',
      type: 'start'
    },
    // Конечная точка
    {
      position: routeData.endPosition as [number, number],
      title: routeData.endPoint,
      description: 'Конечная точка маршрута',
      type: 'end'
    },
    // Точки маршрута
    ...routeData.stops.map((stop, index) => ({
      position: stop.position as [number, number],
      title: `${index + 1}. ${stop.name}`,
      description: `${stop.description} (${stop.estimatedTime})`,
      type: stop.type as any,
      // Добавляем дополнительные свойства для активной точки
      active: index === activeStep
    }))
  ];

  // Маршрут между точками
  const mapRoutes: MapRoute[] = [
    {
      points: routeData.routePoints as [number, number][],
      color: '#16a34a' // Зеленый цвет
    }
  ];

  // Центр карты - текущая активная точка
  const activePosition = activeStep < routeData.stops.length
    ? routeData.stops[activeStep].position as [number, number]
    : routeData.startPosition as [number, number];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{routeData.name}</h1>
      <p className="text-gray-600 mb-6">
        От {routeData.startPoint} до {routeData.endPoint} • {routeData.duration}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 relative">
          <MapComponent
            center={activePosition}
            zoom={14}
            markers={mapMarkers}
            routes={mapRoutes}
            height="500px"
            onMarkerClick={(marker) => {
              // При клике на маркер точки маршрута переключаемся на нее
              const stopIndex = routeData.stops.findIndex(
                stop => stop.position[0] === marker.position[0] && stop.position[1] === marker.position[1]
              );
              if (stopIndex !== -1) {
                setActiveStep(stopIndex);
              }
            }}
            interactive={true}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />

          {/* Компонент отслеживания местоположения */}
          <LocationTracker
            onLocationUpdate={(position) => {
              setCurrentLocation(position);
              // Если отслеживание включено, центрируем карту на текущем местоположении
              if (trackingEnabled && mapRef.current) {
                mapRef.current.setView(position, mapRef.current.getZoom());
              }
            }}
            enabled={trackingEnabled}
          />

          {/* Маркер текущего местоположения */}
          <CurrentLocationMarker
            map={mapRef.current}
            position={currentLocation}
          />

          {/* Компонент с поворотами в углу карты */}
          <div className="absolute top-4 right-4 w-80 z-10">
            <RouteDirections
              startPoint={{
                name: routeData.startPoint,
                latitude: routeData.startPosition[0],
                longitude: routeData.startPosition[1]
              }}
              endPoint={{
                name: routeData.endPoint,
                latitude: routeData.endPosition[0],
                longitude: routeData.endPosition[1]
              }}
              places={routeData.stops.map((stop, index) => ({
                position: stop.position as [number, number],
                title: stop.name,
                id: stop.id,
                order: index + 1
              }))}
              onDirectionClick={(placeId) => {
                const stopIndex = routeData.stops.findIndex(stop => stop.id === placeId);
                if (stopIndex !== -1) {
                  setActiveStep(stopIndex);
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Точки маршрута</h2>

          <div className="space-y-4">
            {routeData.stops.map((stop, index) => (
              <div
                key={stop.id}
                className={`p-3 rounded-md cursor-pointer ${
                  index === activeStep
                    ? 'bg-green-100 border-l-4 border-green-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{stop.name}</h3>
                  <span className="text-sm text-gray-500">{stop.estimatedTime}</span>
                </div>
                <p className="text-sm text-gray-600">{stop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Навигация</h2>

          <button
            onClick={() => setTrackingEnabled(!trackingEnabled)}
            className={`px-4 py-2 rounded-md flex items-center ${
              trackingEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {trackingEnabled ? 'Отслеживание включено' : 'Включить отслеживание'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={activeStep === 0}
            className={`px-4 py-2 rounded-md ${
              activeStep === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Предыдущая точка
          </button>

          <div className="text-center">
            <span className="font-medium">
              {activeStep + 1} из {routeData.stops.length}
            </span>
            <p className="text-sm text-gray-600">
              {routeData.stops[activeStep].name}
            </p>
          </div>

          <button
            onClick={handleNextStep}
            disabled={activeStep === routeData.stops.length - 1}
            className={`px-4 py-2 rounded-md ${
              activeStep === routeData.stops.length - 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Следующая точка
          </button>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/saved-routes"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Назад к списку маршрутов
        </Link>
      </div>
    </div>
  )
}
