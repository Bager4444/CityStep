import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import MapLayerSelector, { MAP_PROVIDERS } from './MapLayerSelector'
import 'leaflet/dist/leaflet.css'

// Исправляем иконки маркеров для Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Кастомная иконка для пользователя
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Иконка для начальной точки маршрута
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Иконка для конечной точки маршрута
const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Компонент для обновления центра карты
function ChangeView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

// Компонент для обновления размера карты
function ResizeMap({ className }) {
  const map = useMap()
  useEffect(() => {
    if (className?.includes('fullscreen')) {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
  }, [className, map])
  return null
}

// Функция для расчета угла между двумя точками
function calculateBearing(start, end) {
  const lat1 = start[0] * Math.PI / 180
  const lat2 = end[0] * Math.PI / 180
  const deltaLng = (end[1] - start[1]) * Math.PI / 180

  const x = Math.sin(deltaLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  const bearing = Math.atan2(x, y) * 180 / Math.PI
  return (bearing + 360) % 360 // Нормализуем к 0-360 градусов
}

// Функция для проецирования GPS позиции на ближайшую точку маршрута
function projectPositionOnRoute(gpsPosition, routeCoordinates) {
  if (!gpsPosition || !routeCoordinates || routeCoordinates.length < 2) {
    return routeCoordinates?.[0] || null
  }

  let minDistance = Infinity
  let nearestPoint = routeCoordinates[0]
  let nearestIndex = 0

  // Ищем ближайшую точку на маршруте
  for (let i = 0; i < routeCoordinates.length; i++) {
    const routePoint = routeCoordinates[i]
    const distance = Math.sqrt(
      Math.pow(gpsPosition[0] - routePoint[0], 2) +
      Math.pow(gpsPosition[1] - routePoint[1], 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      nearestPoint = routePoint
      nearestIndex = i
    }
  }

  return { point: nearestPoint, index: nearestIndex }
}

// Функция для проецирования GPS позиции на ближайшую точку маршрута
function projectGPSOnRoute(gpsPosition, routeCoordinates) {
  if (!gpsPosition || !routeCoordinates || routeCoordinates.length < 2) {
    return { point: routeCoordinates?.[0] || null, index: 0 }
  }

  let minDistance = Infinity
  let nearestPoint = routeCoordinates[0]
  let nearestIndex = 0

  // Ищем ближайшую точку на маршруте к GPS позиции
  for (let i = 0; i < routeCoordinates.length; i++) {
    const routePoint = routeCoordinates[i]
    const distance = Math.sqrt(
      Math.pow(gpsPosition[0] - routePoint[0], 2) +
      Math.pow(gpsPosition[1] - routePoint[1], 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      nearestPoint = routePoint
      nearestIndex = i
    }
  }

  return { point: nearestPoint, index: nearestIndex }
}

// Функция для расчета расстояния между двумя точками в метрах
function calculateDistance(point1, point2) {
  const R = 6371000 // Радиус Земли в метрах
  const lat1 = point1[0] * Math.PI / 180
  const lat2 = point2[0] * Math.PI / 180
  const deltaLat = (point2[0] - point1[0]) * Math.PI / 180
  const deltaLng = (point2[1] - point1[1]) * Math.PI / 180

  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

// Функция для определения типа поворота
function getTurnDirection(bearing1, bearing2) {
  let diff = bearing2 - bearing1
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360

  if (Math.abs(diff) < 15) return 'прямо'
  if (diff > 15 && diff < 45) return 'слегка направо'
  if (diff >= 45 && diff < 135) return 'направо'
  if (diff >= 135) return 'резко направо'
  if (diff < -15 && diff > -45) return 'слегка налево'
  if (diff <= -45 && diff > -135) return 'налево'
  if (diff <= -135) return 'резко налево'

  return 'прямо'
}

// Функция для поиска следующего поворота
function findNextTurn(currentIndex, routeCoordinates) {
  if (!routeCoordinates || routeCoordinates.length < 3 || currentIndex >= routeCoordinates.length - 2) {
    return null
  }

  const currentPoint = routeCoordinates[currentIndex]
  let currentBearing = null

  // Находим текущее направление
  if (currentIndex < routeCoordinates.length - 1) {
    currentBearing = calculateBearing(currentPoint, routeCoordinates[currentIndex + 1])
  }

  // Ищем значительный поворот
  for (let i = currentIndex + 1; i < routeCoordinates.length - 1; i++) {
    const nextBearing = calculateBearing(routeCoordinates[i], routeCoordinates[i + 1])

    if (currentBearing !== null) {
      const turnDirection = getTurnDirection(currentBearing, nextBearing)

      if (turnDirection !== 'прямо') {
        const distance = calculateDistance(currentPoint, routeCoordinates[i])
        return {
          direction: turnDirection,
          distance: Math.round(distance),
          point: routeCoordinates[i]
        }
      }
    }

    currentBearing = nextBearing
  }

  return null
}

// Компонент для динамического поворота карты на основе направления маршрута
function DynamicRotateMap({ route, className, arrowPosition }) {
  const map = useMap()

  useEffect(() => {
    if (className?.includes('fullscreen') && route?.coordinates && route.coordinates.length >= 2 && arrowPosition) {
      setTimeout(() => {
        // Находим ближайшую точку на маршруте к текущей позиции стрелки
        const projection = projectGPSOnRoute(arrowPosition, route.coordinates)
        const nearestIndex = projection.index

        // Определяем следующую точку для расчета направления
        const nextIndex = Math.min(nearestIndex + 1, route.coordinates.length - 1)
        const start = route.coordinates[nearestIndex]
        const end = route.coordinates[nextIndex]

        // Если это последняя точка, используем предыдущую для направления
        if (nearestIndex === nextIndex && nearestIndex > 0) {
          const prevIndex = nearestIndex - 1
          const prevStart = route.coordinates[prevIndex]
          const bearing = calculateBearing(prevStart, start)
          const rotationAngle = -bearing

          console.log('Rotating map (last point):', { bearing, rotationAngle, prevStart, start })

          if (map.getContainer()) {
            map.getContainer().style.transform = `rotate(${rotationAngle}deg)`
          }
        } else {
          // Рассчитываем угол направления маршрута в текущей точке
          const bearing = calculateBearing(start, end)

          // Поворачиваем карту так, чтобы направление маршрута совпадало с направлением стрелки
          // Стрелка направлена вверх (0°), поэтому маршрут должен идти вверх (0°)
          const rotationAngle = -bearing

          console.log('Rotating map:', { bearing, rotationAngle, start, end, nearestIndex, arrowPosition })

          // Применяем поворот к карте
          if (map.getContainer()) {
            map.getContainer().style.transform = `rotate(${rotationAngle}deg)`
          }
        }
      }, 200)
    } else if (!className?.includes('fullscreen')) {
      // Сбрасываем поворот при выходе из полноэкранного режима
      if (map.getContainer()) {
        map.getContainer().style.transform = 'rotate(0deg)'
      }
    }
  }, [route, className, arrowPosition, map])

  return null
}

// Создаем кастомную иконку стрелки для Leaflet
const createArrowIcon = () => {
  return L.divIcon({
    className: 'navigation-arrow-marker',
    html: '<div class="navigation-arrow-triangle"></div>',
    iconSize: [60, 52],
    iconAnchor: [30, 26],
    popupAnchor: [0, -26]
  })
}

// Компонент стрелки навигации как маркер на карте
function NavigationArrowMarker({ route, className, arrowPosition }) {
  if (!className?.includes('fullscreen') || !route?.coordinates || route.coordinates.length < 2 || !arrowPosition) {
    return null
  }

  const arrowIcon = createArrowIcon()

  return (
    <Marker
      position={arrowPosition}
      icon={arrowIcon}
      interactive={false}
      zIndexOffset={1000}
    >
      <Popup>
        <strong>🧭 Местоположение человека</strong>
        <br />
        Стрелка указывает направление движения
      </Popup>
    </Marker>
  )
}

// Компонент панели следующего поворота
function NextTurnPanel({ route, arrowPosition }) {
  const [nextTurn, setNextTurn] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!route?.coordinates || !arrowPosition) return

    // Находим текущую позицию на маршруте
    const projection = projectGPSOnRoute(arrowPosition, route.coordinates)
    setCurrentIndex(projection.index)

    // Ищем следующий поворот
    const turn = findNextTurn(projection.index, route.coordinates)
    setNextTurn(turn)
  }, [route, arrowPosition])

  if (!nextTurn) {
    return (
      <div className="next-turn-panel">
        <div className="turn-icon">🎯</div>
        <div className="turn-info">
          <div className="turn-direction">Прямо</div>
          <div className="turn-distance">до цели</div>
        </div>
      </div>
    )
  }

  // Выбираем иконку в зависимости от направления поворота
  const getTurnIcon = (direction) => {
    if (direction.includes('налево')) return '⬅️'
    if (direction.includes('направо')) return '➡️'
    if (direction.includes('резко налево')) return '↩️'
    if (direction.includes('резко направо')) return '↪️'
    return '⬆️'
  }

  return (
    <div className="next-turn-panel">
      <div className="turn-icon">{getTurnIcon(nextTurn.direction)}</div>
      <div className="turn-info">
        <div className="turn-direction">{nextTurn.direction}</div>
        <div className="turn-distance">{nextTurn.distance} м</div>
      </div>
    </div>
  )
}

// Компонент для автоматического центрирования карты на стрелке
function FollowArrow({ arrowPosition, className }) {
  const map = useMap()

  useEffect(() => {
    if (className?.includes('fullscreen') && arrowPosition) {
      // Плавно перемещаем карту к позиции стрелки
      map.setView(arrowPosition, map.getZoom(), {
        animate: true,
        duration: 0.5
      })
    }
  }, [arrowPosition, className, map])

  return null
}

// Функция для расчета оставшегося расстояния от текущей позиции до конца маршрута
function calculateRemainingDistance(currentIndex, routeCoordinates) {
  if (!routeCoordinates || currentIndex >= routeCoordinates.length - 1) {
    return 0
  }

  let totalDistance = 0

  // Суммируем расстояния от текущей позиции до конца маршрута
  for (let i = currentIndex; i < routeCoordinates.length - 1; i++) {
    totalDistance += calculateDistance(routeCoordinates[i], routeCoordinates[i + 1])
  }

  return totalDistance
}

// Компонент панели оставшегося расстояния и времени
function RemainingInfoPanel({ route, arrowPosition }) {
  const [remainingInfo, setRemainingInfo] = useState({ distance: 0, time: 0 })

  useEffect(() => {
    if (!route?.coordinates || !arrowPosition) return

    // Находим текущую позицию на маршруте
    const projection = projectGPSOnRoute(arrowPosition, route.coordinates)

    // Рассчитываем оставшееся расстояние
    const remainingDistance = calculateRemainingDistance(projection.index, route.coordinates)

    // Рассчитываем оставшееся время (средняя скорость пешехода 5 км/ч = 1.39 м/с)
    const walkingSpeedMps = 1.39 // метров в секунду
    const remainingTimeSeconds = remainingDistance / walkingSpeedMps

    setRemainingInfo({
      distance: Math.round(remainingDistance),
      time: Math.round(remainingTimeSeconds / 60) // в минутах
    })
  }, [route, arrowPosition])

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} км`
    }
    return `${meters} м`
  }

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}ч ${mins}м`
    }
    return `${minutes} мин`
  }

  return (
    <div className="remaining-info-panel">
      <div className="remaining-item">
        <div className="remaining-icon">📏</div>
        <div className="remaining-details">
          <div className="remaining-label">Осталось</div>
          <div className="remaining-value">{formatDistance(remainingInfo.distance)}</div>
        </div>
      </div>
      <div className="remaining-separator"></div>
      <div className="remaining-item">
        <div className="remaining-icon">⏱️</div>
        <div className="remaining-details">
          <div className="remaining-label">Время</div>
          <div className="remaining-value">{formatTime(remainingInfo.time)}</div>
        </div>
      </div>
    </div>
  )
}

function MapComponent({
  center,
  markers,
  route,
  userLocation,
  zoom = 12,
  onMapClick,
  className
}) {
  const mapRef = useRef()
  const [currentProvider, setCurrentProvider] = useState('osm')
  const [mapKey, setMapKey] = useState(0) // Для принудительного обновления карты
  const [arrowPosition, setArrowPosition] = useState(null)

  // Инициализация позиции стрелки при загрузке маршрута
  useEffect(() => {
    if (className?.includes('fullscreen') && route?.coordinates && route.coordinates.length >= 2) {
      // Стрелка всегда начинает с начала маршрута
      setArrowPosition(route.coordinates[0])
    }
  }, [route, className])

  // Обновление позиции стрелки при изменении местоположения пользователя
  // Стрелка проецируется на ближайшую точку маршрута только если есть GPS
  useEffect(() => {
    if (className?.includes('fullscreen') && userLocation && route?.coordinates) {
      const projection = projectGPSOnRoute(userLocation, route.coordinates)
      setArrowPosition(projection.point)
    } else if (className?.includes('fullscreen') && !userLocation && route?.coordinates) {
      // Если нет GPS, стрелка остается в начале маршрута
      setArrowPosition(route.coordinates[0])
    }
  }, [userLocation, className, route])

  // Обработчик смены провайдера карты
  const handleProviderChange = (providerId) => {
    setCurrentProvider(providerId)
    // Увеличиваем ключ для принудительного обновления TileLayer
    setMapKey(prev => prev + 1)
  }

  const currentProviderConfig = MAP_PROVIDERS[currentProvider]

  // Проверяем, что center является валидным массивом координат
  // В полноэкранном режиме карта центрируется точно на начальной точке маршрута
  const validCenter = className?.includes('fullscreen') && route?.coordinates?.[0]
    ? route.coordinates[0] // Прямо используем первую точку маршрута
    : (Array.isArray(center) && center.length === 2 ? center : [55.7558, 37.6176])

  console.log('MapComponent render:', {
    center: validCenter,
    zoom,
    className,
    routeStartCoords: route?.coordinates?.[0],
    arrowPosition,
    isFullscreen: className?.includes('fullscreen')
  })

  return (
    <div className={`map-wrapper ${className || ''}`}>
      {/* Селектор типа карты */}
      <MapLayerSelector
        currentProvider={currentProvider}
        onProviderChange={handleProviderChange}
      />

      <MapContainer
        center={validCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        eventHandlers={onMapClick ? {
          click: onMapClick
        } : {}}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={false}
      >
        <ChangeView center={validCenter} zoom={zoom} />
        <ResizeMap className={className} />
        <DynamicRotateMap route={route} className={className} arrowPosition={arrowPosition} />

        {/* Динамический слой карты */}
        <TileLayer
          key={mapKey}
          attribution={currentProviderConfig.attribution}
          url={currentProviderConfig.url}
          maxZoom={currentProviderConfig.maxZoom}
        />

        {/* Маркеры результатов поиска */}
        {markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lon]}>
            <Popup>
              <div>
                <strong>{marker.address?.road || marker.address?.amenity || 'Найденное место'}</strong>
                <br />
                {marker.address?.house_number && `${marker.address.house_number}, `}
                {marker.address?.suburb || marker.address?.city_district || ''}
                <br />
                <small>{marker.display_name}</small>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Маркер местоположения пользователя */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>Ваше местоположение</strong>
            </Popup>
          </Marker>
        )}

        {/* Маршрут */}
        {route && (
          <>
            {/* Линия маршрута */}
            <Polyline
              positions={route.coordinates}
              color="blue"
              weight={5}
              opacity={0.7}
            />

            {/* Маркер начальной точки */}
            <Marker position={route.from} icon={startIcon}>
              <Popup>
                <strong>Начальная точка</strong>
              </Popup>
            </Marker>

            {/* Маркер конечной точки */}
            <Marker position={route.to} icon={endIcon}>
              <Popup>
                <strong>Конечная точка</strong>
                <br />
                Расстояние: {(route.distance / 1000).toFixed(1)} км
                <br />
                Время в пути: {Math.round(route.duration / 60)} мин
              </Popup>
            </Marker>

            {/* Стрелка навигации убрана с карты - теперь фиксированная в центре экрана */}
          </>
        )}

        {/* Стрелки направления для навигации - временно отключено */}
        {/* TODO: Добавить DirectionArrows компонент */}

        {/* Компас пользователя при навигации - временно отключено */}
        {/* TODO: Добавить UserCompass компонент */}
      </MapContainer>

      {/* Фиксированная стрелка в центре экрана */}
      {className?.includes('fullscreen') && arrowPosition && (
        <div className="fixed-navigation-arrow">
          <div className="navigation-arrow-triangle"></div>
        </div>
      )}

      {/* Панель следующего поворота */}
      {className?.includes('fullscreen') && route?.coordinates && (
        <NextTurnPanel route={route} arrowPosition={arrowPosition} />
      )}

      {/* Панель оставшегося расстояния и времени */}
      {className?.includes('fullscreen') && route?.coordinates && (
        <RemainingInfoPanel route={route} arrowPosition={arrowPosition} />
      )}
    </div>
  )
}

export default MapComponent
