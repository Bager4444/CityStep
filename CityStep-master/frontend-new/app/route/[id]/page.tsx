'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { MapMarker, MapRoute } from '../../../components/map/MapComponent'
import type L from 'leaflet'
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid'

// Динамический импорт компонентов, которые должны работать только на клиенте

const LocationTracker = dynamic(
  () => import('../../../components/map/LocationTracker'),
  { ssr: false }
)

const CurrentLocationMarker = dynamic(
  () => import('../../../components/map/CurrentLocationMarker'),
  { ssr: false }
)

const DirectionArrow = dynamic(
  () => import('../../../components/navigation/DirectionArrow'),
  { ssr: false }
)

const NavigationPanel = dynamic(
  () => import('../../../components/navigation/NavigationPanel'),
  { ssr: false }
)

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

// Функция для расчета расстояния между двумя точками в километрах
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export default function RoutePage({ params }: { params: { id: string } }) {
  const [activeStep, setActiveStep] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null) // Текущее местоположение
  const [trackingEnabled, setTrackingEnabled] = useState(false) // Состояние отслеживания
  const mapRef = useRef<L.Map | null>(null) // Ссылка на карту

  // Состояние навигации
  const [navigationMode, setNavigationMode] = useState(false)
  const [nextStopDistance, setNextStopDistance] = useState<number | null>(null)

  // Состояние модального окна с информацией о доме
  const [homeInfo, setHomeInfo] = useState<{ title: string; description: string } | null>(null)

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

  // Запуск/остановка режима навигации
  const toggleNavigationMode = () => {
    if (!navigationMode) {
      // Запускаем режим навигации
      setNavigationMode(true)
      setTrackingEnabled(true) // Автоматически включаем отслеживание
    } else {
      // Останавливаем режим навигации
      setNavigationMode(false)
    }
  }

  // Расчет расстояния до следующей точки
  useEffect(() => {
    if (currentLocation && navigationMode) {
      const nextStopPosition = routeData.stops[activeStep].position as [number, number]
      const distance = calculateDistance(
        currentLocation[0],
        currentLocation[1],
        nextStopPosition[0],
        nextStopPosition[1]
      )
      setNextStopDistance(distance)

      // Если расстояние меньше 50 метров, переходим к следующей точке
      if (distance < 0.05 && activeStep < routeData.stops.length - 1) {
        setActiveStep(activeStep + 1)
      }
    }
  }, [currentLocation, activeStep, navigationMode])

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
    })),
    // Дома рядом с маршрутом
    {
      position: [55.7535, 37.6190],
      title: 'Жилой дом',
      description: 'Исторический жилой дом в центре Москвы, построенный в начале XX века. Здание имеет богатую архитектуру с элементами модерна и классицизма.',
      type: 'home'
    },
    {
      position: [55.7620, 37.6100],
      title: 'Жилой комплекс "Современный"',
      description: 'Современный жилой комплекс с апартаментами, построенный в 2015 году. Включает в себя фитнес-центр, подземную парковку и зону отдыха.',
      type: 'home'
    },
    {
      position: [55.7580, 37.6150],
      title: 'Доходный дом Шаховских',
      description: 'Исторический доходный дом XIX века, принадлежавший княжеской семье Шаховских. Отреставрирован в 2010 году с сохранением исторического облика.',
      type: 'home'
    },
    {
      position: [55.7550, 37.6170],
      title: 'Усадьба Морозовых',
      description: 'Историческая усадьба купеческой семьи Морозовых, построенная в конце XIX века. Сейчас здесь располагается музей быта московского купечества.',
      type: 'home'
    },
    {
      position: [55.7590, 37.6220],
      title: 'Дом архитектора',
      description: 'Особняк известного архитектора Федора Шехтеля, построенный в стиле модерн. Является памятником архитектуры федерального значения.',
      type: 'home'
    },
    {
      position: [55.7510, 37.6130],
      title: 'Жилой дом "Сталинка"',
      description: 'Жилой дом в стиле сталинского ампира, построенный в 1950-х годах. Отличается монументальностью и характерным декором фасада.',
      type: 'home'
    },
    {
      position: [55.7630, 37.6180],
      title: 'Современные апартаменты',
      description: 'Современный комплекс апартаментов бизнес-класса с панорамными окнами и видом на центр города. Построен в 2020 году.',
      type: 'home'
    },
    {
      position: [55.7560, 37.6080],
      title: 'Историческая коммуналка',
      description: 'Бывший доходный дом, в советское время разделенный на коммунальные квартиры. Сохранил атмосферу старой Москвы и уникальную планировку.',
      type: 'home'
    }
  ];

  // Маршрут между точками
  const mapRoutes: MapRoute[] = [
    {
      points: routeData.routePoints as [number, number][],
      color: '#16a34a' // Зеленый цвет
    }
  ];

  // Центр карты - текущая активная точка или текущее местоположение в режиме навигации
  const activePosition = navigationMode && currentLocation
    ? currentLocation
    : activeStep < routeData.stops.length
      ? routeData.stops[activeStep].position as [number, number]
      : routeData.startPosition as [number, number];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{routeData.name}</h1>
      <p className="text-gray-600 mb-6">
        От {routeData.startPoint} до {routeData.endPoint} • {routeData.duration}
      </p>

      <div className="flex flex-col lg:flex-row-reverse gap-6 mb-8 items-start">
        <div className="lg:w-1/2 relative z-10">
          <MapComponent
            center={activePosition}
            zoom={13}
            markers={mapMarkers}
            routes={mapRoutes}
            height="400px"
            onMarkerClick={(marker) => {
              if (marker.type === 'home') {
                // При клике на дом показываем модальное окно с информацией
                setHomeInfo({
                  title: marker.title,
                  description: marker.description || ''
                });

                // Центрируем карту на выбранном доме
                if (mapRef.current) {
                  mapRef.current.setView(marker.position, 15);
                }
              } else {
                // При клике на маркер точки маршрута переключаемся на нее
                const stopIndex = routeData.stops.findIndex(
                  stop => stop.position[0] === marker.position[0] && stop.position[1] === marker.position[1]
                );
                if (stopIndex !== -1) {
                  setActiveStep(stopIndex);
                }
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

          {/* Стрелка направления в режиме навигации */}
          <DirectionArrow
            currentPosition={currentLocation}
            targetPosition={activeStep < routeData.stops.length
              ? routeData.stops[activeStep].position as [number, number]
              : null}
            visible={navigationMode && currentLocation !== null}
          />

          {/* Кнопка "В путь" */}
          <div className="absolute bottom-4 right-4 z-50">
            <button
              onClick={toggleNavigationMode}
              className={`px-6 py-3 rounded-full shadow-lg flex items-center ${
                navigationMode ? 'bg-red-600' : 'bg-blue-600'
              } text-white font-medium`}
            >
              {navigationMode ? (
                <>
                  <PauseIcon className="h-5 w-5 mr-2" />
                  Остановить
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  В путь
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 space-y-6">
          {/* Точки маршрута */}
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

          {/* Дома рядом с маршрутом */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Интересные здания рядом</h2>

            <div className="space-y-3">
              {mapMarkers
                .filter(marker => marker.type === 'home')
                .map((home, index) => (
                  <div
                    key={`home-${index}`}
                    className="p-3 rounded-md cursor-pointer bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-300"
                    onClick={() => {
                      setHomeInfo({
                        title: home.title,
                        description: home.description || ''
                      });

                      // Центрируем карту на выбранном доме
                      if (mapRef.current) {
                        mapRef.current.setView(home.position, 15);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-1 rounded-full mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-blue-800">{home.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{home.description}</p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {!navigationMode ? (
        <div className="bg-white p-4 rounded-lg shadow-md mb-8 relative z-40">
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
      ) : (
        <NavigationPanel
          currentPosition={currentLocation}
          nextStopName={routeData.stops[activeStep].name}
          nextStopDistance={nextStopDistance}
          estimatedTime={routeData.stops[activeStep].estimatedTime}
          onExit={() => setNavigationMode(false)}
        />
      )}

      {!navigationMode && (
        <div className="text-center">
        <Link
          href="/saved-routes"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Назад к списку маршрутов
        </Link>
      </div>
      )}

      {/* Информация о доме */}
      {homeInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative animate-scaleIn">
            <button
              onClick={() => setHomeInfo(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">{homeInfo.title}</h2>
            </div>

            <div className="border-l-4 border-blue-200 pl-4 mb-6">
              <p className="text-gray-600">{homeInfo.description}</p>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <span>Нажмите на карту, чтобы продолжить просмотр</span>
              </div>
              <button
                onClick={() => setHomeInfo(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
