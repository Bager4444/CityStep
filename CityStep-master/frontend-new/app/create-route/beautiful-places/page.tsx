'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import MapComponent, { MapMarker, MapRoute } from '@/components/map/MapComponent'
import AddressInput from '@/components/address/AddressInput'
import { geocodeAddress, GeocodingResult } from '@/services/geocoding'
import { supabase } from '@/lib/supabase'

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
  name: string
  description: string
  points: RoutePoint[]
  total_distance: number // в метрах
  total_time: number // в минутах
  created_at: string
}

const CreateBeautifulRoutePage = () => {
  const searchParams = useSearchParams()
  const initialPlaceId = searchParams.get('place')

  // Состояния
  const [loading, setLoading] = useState(true)
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedPlaces, setSelectedPlaces] = useState<RoutePoint[]>([])
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([])
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]) // Москва
  const [mapZoom, setMapZoom] = useState(11)
  const [routeName, setRouteName] = useState('Мой маршрут по красивым местам')
  const [routeDescription, setRouteDescription] = useState('Маршрут по красивым местам Москвы')
  const [totalDistance, setTotalDistance] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [createdRouteId, setCreatedRouteId] = useState('')

  // Состояния для начальной и конечной точки
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [isGeocodingStart, setIsGeocodingStart] = useState(false)
  const [isGeocodingEnd, setIsGeocodingEnd] = useState(false)
  const [geocodingError, setGeocodingError] = useState('')

  // Загрузка данных о местах
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true)
      try {
        // В реальном приложении здесь был бы запрос к API
        // Для демонстрации используем моковые данные
        const mockData = await import('@/app/moscow-places/beautiful/mockData')
        setPlaces(mockData.default)
        setAvailablePlaces(mockData.default)
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaces()
  }, [])

  // Добавление начального места из URL-параметра
  useEffect(() => {
    if (initialPlaceId && places.length > 0 && selectedPlaces.length === 0) {
      const place = places.find(p => p.id === initialPlaceId)
      if (place) {
        addPlaceToRoute(place)
      }
    }
  }, [initialPlaceId, places])

  // Обновление маркеров и маршрутов на карте
  useEffect(() => {
    updateMapMarkersAndRoutes()
  }, [selectedPlaces, availablePlaces])

  // Обновление доступных мест (исключаем уже выбранные)
  useEffect(() => {
    const selectedIds = selectedPlaces.map(point => point.place.id)
    setAvailablePlaces(places.filter(place => !selectedIds.includes(place.id)))
  }, [places, selectedPlaces])

  // Функция для добавления места в маршрут
  const addPlaceToRoute = (place: Place) => {
    const newPoint: RoutePoint = {
      place,
      order: selectedPlaces.length + 1,
      stay_time: place.estimated_time || 60 // По умолчанию 60 минут
    }

    setSelectedPlaces([...selectedPlaces, newPoint])

    // Обновляем общее время маршрута
    const newTotalTime = totalTime + newPoint.stay_time
    setTotalTime(newTotalTime)

    // Если это первое место, центрируем карту на нем
    if (selectedPlaces.length === 0) {
      setMapCenter([place.latitude, place.longitude])
      setMapZoom(13)
    }
  }

  // Функция для удаления места из маршрута
  const removePlaceFromRoute = (index: number) => {
    const newSelectedPlaces = [...selectedPlaces]
    const removedPoint = newSelectedPlaces.splice(index, 1)[0]

    // Обновляем порядковые номера
    newSelectedPlaces.forEach((point, i) => {
      point.order = i + 1
    })

    setSelectedPlaces(newSelectedPlaces)

    // Обновляем общее время маршрута
    const newTotalTime = totalTime - removedPoint.stay_time
    setTotalTime(newTotalTime > 0 ? newTotalTime : 0)
  }

  // Функция для изменения времени пребывания в месте
  const updateStayTime = (index: number, time: number) => {
    const newSelectedPlaces = [...selectedPlaces]
    const oldTime = newSelectedPlaces[index].stay_time
    newSelectedPlaces[index].stay_time = time
    setSelectedPlaces(newSelectedPlaces)

    // Обновляем общее время маршрута
    const newTotalTime = totalTime - oldTime + time
    setTotalTime(newTotalTime > 0 ? newTotalTime : 0)
  }

  // Функция для изменения порядка мест в маршруте
  const movePlace = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedPlaces.length - 1)
    ) {
      return // Нельзя переместить первый элемент вверх или последний вниз
    }

    const newSelectedPlaces = [...selectedPlaces]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    // Меняем местами элементы
    const temp = newSelectedPlaces[index];
    newSelectedPlaces[index] = newSelectedPlaces[swapIndex];
    newSelectedPlaces[swapIndex] = temp;

    // Обновляем порядковые номера
    newSelectedPlaces.forEach((point, i) => {
      point.order = i + 1
    })

    setSelectedPlaces(newSelectedPlaces)
  }

  // Функция для обновления маркеров и маршрутов на карте
  const updateMapMarkersAndRoutes = () => {
    const markers: MapMarker[] = []

    // Добавляем маркер начальной точки, если она задана
    if (startPoint) {
      markers.push({
        position: [startPoint.lat, startPoint.lng],
        title: 'Начальная точка',
        description: startAddress,
        type: 'start',
        active: true
      })
    }

    // Добавляем маркер конечной точки, если она задана
    if (endPoint) {
      markers.push({
        position: [endPoint.lat, endPoint.lng],
        title: 'Конечная точка',
        description: endAddress,
        type: 'end',
        active: true
      })
    }

    // Создаем маркеры для выбранных мест
    const routeMarkers: MapMarker[] = selectedPlaces.map((point, index) => ({
      position: [point.place.latitude, point.place.longitude],
      title: `${index + 1}. ${point.place.name}`,
      description: point.place.description,
      type: point.place.type,
      active: true,
      image_url: point.place.image_url,
      beauty_score: point.place.beauty_score,
      estimated_time: point.place.estimated_time
    }))

    // Добавляем маркеры для доступных мест (с ограничением, чтобы не перегружать карту)
    const availableMarkers: MapMarker[] = availablePlaces.slice(0, 20).map(place => ({
      position: [place.latitude, place.longitude],
      title: place.name,
      description: place.description,
      type: place.type,
      active: false,
      image_url: place.image_url,
      beauty_score: place.beauty_score,
      estimated_time: place.estimated_time
    }))

    setMapMarkers([...markers, ...routeMarkers, ...availableMarkers])

    // Создаем маршрут
    const routes: MapRoute[] = []

    // Маршрут между начальной и конечной точками
    if (startPoint && endPoint) {
      routes.push({
        points: [
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng]
        ],
        color: '#3b82f6' // Синий цвет
      })
    }

    // Маршрут между выбранными местами
    if (selectedPlaces.length >= 2) {
      const routePoints: [number, number][] = selectedPlaces.map(point =>
        [point.place.latitude, point.place.longitude]
      )

      routes.push({
        points: routePoints,
        color: '#16a34a' // Зеленый цвет
      })

      // Рассчитываем примерное расстояние (в реальном приложении использовали бы API маршрутизации)
      calculateRouteDistance(routePoints)
    } else if (selectedPlaces.length === 0) {
      setTotalDistance(0)
    }

    setMapRoutes(routes)
  }

  // Функция для расчета примерного расстояния маршрута
  const calculateRouteDistance = (points: [number, number][]) => {
    let totalDistance = 0

    for (let i = 0; i < points.length - 1; i++) {
      const distance = getDistanceFromLatLonInKm(
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1]
      )
      totalDistance += distance
    }

    setTotalDistance(totalDistance)
  }

  // Функция для расчета расстояния между двумя точками по координатам
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Радиус Земли в км
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Расстояние в км
    return distance
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
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

  // Функция для сохранения маршрута
  const saveRoute = async () => {
    if (selectedPlaces.length < 1) {
      setSaveError('Маршрут должен содержать минимум 1 место')
      return
    }

    if (!routeName.trim()) {
      setSaveError('Введите название маршрута')
      return
    }

    if (!startPoint) {
      setSaveError('Укажите начальную точку маршрута')
      return
    }

    if (!endPoint) {
      setSaveError('Укажите конечную точку маршрута')
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      // Создаем начальную и конечную точки как места
      const startPlaceId = `start-${Date.now()}`
      const endPlaceId = `end-${Date.now()}`

      const startPlace: Place = {
        id: startPlaceId,
        name: 'Начальная точка',
        description: startAddress,
        type: 'home',
        latitude: startPoint.lat,
        longitude: startPoint.lng,
        estimated_time: 0,
        image_url: ''
      }

      const endPlace: Place = {
        id: endPlaceId,
        name: 'Конечная точка',
        description: endAddress,
        type: 'home',
        latitude: endPoint.lat,
        longitude: endPoint.lng,
        estimated_time: 0,
        image_url: ''
      }

      // Создаем точки маршрута для начальной и конечной точек
      const startRoutePoint: RoutePoint = {
        place: startPlace,
        order: 0,
        stay_time: 0
      }

      const endRoutePoint: RoutePoint = {
        place: endPlace,
        order: selectedPlaces.length + 1,
        stay_time: 0
      }

      // Объединяем все точки маршрута
      const allPoints = [
        startRoutePoint,
        ...selectedPlaces,
        endRoutePoint
      ]

      const routeData: RouteData = {
        name: routeName,
        description: routeDescription,
        points: allPoints,
        total_distance: totalDistance,
        total_time: totalTime,
        created_at: new Date().toISOString()
      }

      // В реальном приложении здесь был бы запрос к API для сохранения маршрута
      // Для демонстрации просто имитируем успешное сохранение
      console.log('Сохраняем маршрут:', routeData)

      // Имитация задержки сохранения
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Генерируем случайный ID маршрута
      const demoRouteId = Math.floor(Math.random() * 1000).toString()
      setCreatedRouteId(demoRouteId)

      setSaveSuccess(true)
      setShowModal(true)
    } catch (error) {
      console.error('Ошибка при сохранении маршрута:', error)
      setSaveError('Не удалось сохранить маршрут. Попробуйте позже.')
    } finally {
      setIsSaving(false)
    }
  }

  // Обработчик клика по маркеру на карте
  const handleMarkerClick = (marker: MapMarker) => {
    const place = availablePlaces.find(
      p => p.latitude === marker.position[0] && p.longitude === marker.position[1]
    )

    if (place) {
      addPlaceToRoute(place)
    }
  }

  // Функция для геокодирования начального адреса
  const handleStartAddressChange = async (address: string) => {
    setStartAddress(address)
    setGeocodingError('')

    if (address.length < 3) {
      return
    }

    if (address.length < 5 && !address.toLowerCase().includes('москва') &&
        !address.toLowerCase().includes('кремль') && !address.toLowerCase().includes('арбат')) {
      return
    }

    setIsGeocodingStart(true)

    try {
      const result = await geocodeAddress(address)

      if (result.success) {
        setStartPoint({ lat: result.latitude, lng: result.longitude })

        // Добавляем маркер начальной точки
        updateMapMarkersAndRoutes()

        // Центрируем карту на начальной точке
        setMapCenter([result.latitude, result.longitude])
        setMapZoom(13)
      } else {
        // Не сбрасываем точку, если она уже была установлена
        if (!startPoint) {
          setGeocodingError(result.error || 'Не удалось определить координаты адреса')
        }
      }
    } catch (error) {
      console.error('Ошибка при геокодировании начального адреса:', error)
      if (!startPoint) {
        setGeocodingError('Произошла ошибка при определении координат адреса')
      }
    } finally {
      setIsGeocodingStart(false)
    }
  }

  // Функция для геокодирования конечного адреса
  const handleEndAddressChange = async (address: string) => {
    setEndAddress(address)
    setGeocodingError('')

    if (address.length < 3) {
      return
    }

    if (address.length < 5 && !address.toLowerCase().includes('москва') &&
        !address.toLowerCase().includes('кремль') && !address.toLowerCase().includes('арбат')) {
      return
    }

    setIsGeocodingEnd(true)

    try {
      const result = await geocodeAddress(address)

      if (result.success) {
        setEndPoint({ lat: result.latitude, lng: result.longitude })

        // Добавляем маркер конечной точки
        updateMapMarkersAndRoutes()

        // Если есть начальная точка, центрируем карту между начальной и конечной точками
        if (startPoint) {
          const centerLat = (startPoint.lat + result.latitude) / 2
          const centerLng = (startPoint.lng + result.longitude) / 2
          setMapCenter([centerLat, centerLng])
          setMapZoom(12)
        } else {
          // Иначе центрируем на конечной точке
          setMapCenter([result.latitude, result.longitude])
          setMapZoom(13)
        }
      } else {
        // Не сбрасываем точку, если она уже была установлена
        if (!endPoint) {
          setGeocodingError(result.error || 'Не удалось определить координаты адреса')
        }
      }
    } catch (error) {
      console.error('Ошибка при геокодировании конечного адреса:', error)
      if (!endPoint) {
        setGeocodingError('Произошла ошибка при определении координат адреса')
      }
    } finally {
      setIsGeocodingEnd(false)
    }
  }

  // Функция для обработки изменения координат начальной точки
  const handleStartCoordinatesChange = (lat: number, lng: number) => {
    setStartPoint({ lat, lng })
    updateMapMarkersAndRoutes()
  }

  // Функция для обработки изменения координат конечной точки
  const handleEndCoordinatesChange = (lat: number, lng: number) => {
    setEndPoint({ lat, lng })
    updateMapMarkersAndRoutes()
  }

  // Функция для поиска ближайшего места к указанным координатам
  const findNearestPlace = (lat: number, lng: number): Place | null => {
    if (availablePlaces.length === 0) return null

    // Максимальное расстояние для поиска (в км)
    const maxDistance = 1.0

    // Находим ближайшее место
    let nearestPlace: Place | null = null
    let minDistance = Number.MAX_VALUE

    for (const place of availablePlaces) {
      const distance = getDistanceFromLatLonInKm(
        lat, lng,
        place.latitude, place.longitude
      )

      if (distance < minDistance && distance < maxDistance) {
        minDistance = distance
        nearestPlace = place
      }
    }

    return nearestPlace
  }

  // Модальное окно с информацией о созданном маршруте
  const RouteCreatedModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Маршрут создан!</h2>
        <p className="mb-4">
          Ваш маршрут "{routeName}" успешно создан. Вы можете просмотреть его детали или создать новый маршрут.
        </p>
        <div className="flex flex-col space-y-3">
          <Link
            href={`/routes/${createdRouteId}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-center hover:bg-green-700 transition-colors"
          >
            Просмотреть маршрут
          </Link>
          <button
            onClick={() => {
              setShowModal(false)
              // Сбрасываем форму
              setSelectedPlaces([])
              setRouteName('Мой маршрут по красивым местам')
              setRouteDescription('Маршрут по красивым местам Москвы')
              setTotalDistance(0)
              setTotalTime(0)
              setSaveSuccess(false)
              setMapCenter([55.7558, 37.6173])
              setMapZoom(11)
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-center hover:bg-gray-300 transition-colors"
          >
            Создать новый маршрут
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-700 mb-2">Создание маршрута по красивым местам</h1>
      <p className="text-gray-600 mb-6">Составьте свой маршрут по самым красивым местам Москвы</p>

      {showModal && <RouteCreatedModal />}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка - выбранные места и настройки маршрута */}
        <div className="lg:w-1/3 space-y-6">
          {/* Настройки маршрута */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Настройки маршрута</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="routeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Название маршрута
                </label>
                <input
                  type="text"
                  id="routeName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Введите название маршрута"
                />
              </div>

              <div>
                <label htmlFor="routeDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание маршрута
                </label>
                <textarea
                  id="routeDescription"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={routeDescription}
                  onChange={(e) => setRouteDescription(e.target.value)}
                  placeholder="Введите описание маршрута"
                  rows={3}
                />
              </div>

              {/* Начальная и конечная точки */}
              <div className="space-y-3 border-t border-gray-200 pt-3">
                <h3 className="text-md font-medium text-gray-700">Начальная и конечная точки</h3>

                <AddressInput
                  label="Начальная точка"
                  placeholder="Введите адрес начальной точки"
                  value={startAddress}
                  onChange={handleStartAddressChange}
                  onCoordinatesChange={handleStartCoordinatesChange}
                  className="mb-3"
                />

                <AddressInput
                  label="Конечная точка"
                  placeholder="Введите адрес конечной точки"
                  value={endAddress}
                  onChange={handleEndAddressChange}
                  onCoordinatesChange={handleEndCoordinatesChange}
                />

                {geocodingError && (
                  <div className="p-2 bg-red-100 text-red-800 rounded-md text-sm">
                    {geocodingError}
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Вы также можете выбрать точки на карте</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Общее расстояние:</p>
                  <p className="font-semibold">{formatDistance(totalDistance)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Общее время:</p>
                  <p className="font-semibold">{formatTime(totalTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Количество мест:</p>
                  <p className="font-semibold">{selectedPlaces.length}</p>
                </div>
              </div>

              <button
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={saveRoute}
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить маршрут'}
              </button>

              {saveSuccess && !showModal && (
                <div className="p-2 bg-green-100 text-green-800 rounded-md text-center">
                  Маршрут успешно сохранен!
                </div>
              )}

              {saveError && (
                <div className="p-2 bg-red-100 text-red-800 rounded-md text-center">
                  {saveError}
                </div>
              )}
            </div>
          </div>

          {/* Выбранные места */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Выбранные места</h2>

            {selectedPlaces.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Выберите места на карте или из списка доступных мест</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {selectedPlaces.map((point, index) => (
                  <div key={point.place.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold mr-2">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium">{point.place.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(point.place.type)}`}>
                            {getTypeName(point.place.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          className="p-1 text-gray-500 hover:text-gray-700"
                          onClick={() => movePlace(index, 'up')}
                          disabled={index === 0}
                          title="Переместить вверх"
                        >
                          ↑
                        </button>
                        <button
                          className="p-1 text-gray-500 hover:text-gray-700"
                          onClick={() => movePlace(index, 'down')}
                          disabled={index === selectedPlaces.length - 1}
                          title="Переместить вниз"
                        >
                          ↓
                        </button>
                        <button
                          className="p-1 text-red-500 hover:text-red-700"
                          onClick={() => removePlaceFromRoute(index)}
                          title="Удалить из маршрута"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Время пребывания:
                      </label>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="15"
                          max="240"
                          step="15"
                          value={point.stay_time}
                          onChange={(e) => updateStayTime(index, parseInt(e.target.value))}
                          className="w-full mr-2"
                        />
                        <span className="text-sm font-medium w-20 text-right">
                          {formatTime(point.stay_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - карта и доступные места */}
        <div className="lg:w-2/3 space-y-6">
          {/* Карта */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Карта маршрута</h2>

            {/* Кнопки для выбора режима карты */}
            <div className="flex mb-3 space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded-md ${
                  !startPoint ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => {
                  // Включаем режим выбора начальной точки
                  if (startPoint) {
                    if (confirm('Вы уверены, что хотите изменить начальную точку?')) {
                      setStartPoint(null)
                      setStartAddress('')
                    }
                  }
                }}
                disabled={!startPoint}
              >
                Выбрать начальную точку
              </button>

              <button
                className={`px-3 py-1 text-sm rounded-md ${
                  startPoint && !endPoint ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => {
                  // Включаем режим выбора конечной точки
                  if (endPoint) {
                    if (confirm('Вы уверены, что хотите изменить конечную точку?')) {
                      setEndPoint(null)
                      setEndAddress('')
                    }
                  }
                }}
                disabled={!endPoint || !startPoint}
              >
                Выбрать конечную точку
              </button>
            </div>

            <MapComponent
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              routes={mapRoutes}
              height="500px"
              onMarkerClick={handleMarkerClick}
              onMapClick={(position) => {
                // Если нет начальной точки, устанавливаем её
                if (!startPoint) {
                  setStartPoint({ lat: position[0], lng: position[1] })
                  // Обновляем адрес через обратное геокодирование (в реальном приложении)
                  setStartAddress(`Точка [${position[0].toFixed(6)}, ${position[1].toFixed(6)}]`)
                  updateMapMarkersAndRoutes()
                }
                // Если есть начальная точка, но нет конечной, устанавливаем конечную
                else if (!endPoint) {
                  setEndPoint({ lat: position[0], lng: position[1] })
                  // Обновляем адрес через обратное геокодирование (в реальном приложении)
                  setEndAddress(`Точка [${position[0].toFixed(6)}, ${position[1].toFixed(6)}]`)
                  updateMapMarkersAndRoutes()
                }
                // Если обе точки уже установлены, добавляем место из доступных
                else {
                  // Ищем ближайшее место к клику
                  const nearestPlace = findNearestPlace(position[0], position[1])
                  if (nearestPlace) {
                    addPlaceToRoute(nearestPlace)
                  }
                }
              }}
              interactive={true}
            />

            <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 mt-2">
              <p>
                Нажмите на маркер на карте, чтобы добавить место в маршрут
              </p>
              <p>
                {!startPoint
                  ? 'Выберите начальную точку на карте'
                  : !endPoint
                    ? 'Выберите конечную точку на карте'
                    : 'Выбирайте места для добавления в маршрут'}
              </p>
            </div>
          </div>

          {/* Доступные места */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Доступные места</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Загрузка мест...</p>
              </div>
            ) : availablePlaces.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Все места уже добавлены в маршрут</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {availablePlaces.map((place) => (
                  <div
                    key={place.id}
                    className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={() => addPlaceToRoute(place)}
                  >
                    <h3 className="font-medium">{place.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(place.type)}`}>
                        {getTypeName(place.type)}
                      </span>
                      {place.beauty_score && (
                        <span className="text-xs text-green-600 font-semibold">
                          {place.beauty_score}/10
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateBeautifulRoutePage
