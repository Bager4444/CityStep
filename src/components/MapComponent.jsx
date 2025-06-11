import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
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

// Иконка для промежуточных точек маршрута
const waypointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Функция для создания кастомной иконки с номером
const createNumberedWaypointIcon = (number) => {
  return new L.DivIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${number}
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #ff6b35;
        "></div>
      </div>
    `,
    className: 'numbered-waypoint-icon',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38]
  })
}

// Компонент для обновления центра карты
function ChangeView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

// Компонент для отслеживания движений карты
function MapEventHandler({ onMapMove }) {
  const map = useMap()

  useEffect(() => {
    if (!onMapMove) return

    const handleMoveEnd = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      console.log('🗺️ Карта перемещена:', { center: [center.lat, center.lng], zoom })
      onMapMove([center.lat, center.lng], zoom)
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [map, onMapMove])

  return null
}

// Компонент для обновления размера карты
function ResizeMap({ className }) {
  const map = useMap()
  useEffect(() => {
    if (className?.includes('fullscreen')) {
      console.log('🗺️ Обновляем размер карты для полноэкранного режима')

      // Принудительное обновление размера с несколькими попытками
      const updateSize = () => {
        console.log('🗺️ Принудительное обновление размера карты')
        map.invalidateSize(true) // true = принудительное обновление

        // Также попробуем установить размер вручную
        const container = map.getContainer()
        if (container) {
          console.log('🗺️ Размеры контейнера:', {
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight,
            clientWidth: container.clientWidth,
            clientHeight: container.clientHeight
          })
        }
      }

      // Несколько попыток с разными задержками
      setTimeout(updateSize, 50)
      setTimeout(updateSize, 200)
      setTimeout(updateSize, 500)
      setTimeout(updateSize, 1000)

      // Также обновляем при изменении размера окна
      const handleResize = () => {
        console.log('🗺️ Изменение размера окна - обновляем карту')
        updateSize()
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
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

// Компонент для динамического поворота карты на основе направления маршрута - ВРЕМЕННО ОТКЛЮЧЕН
function DynamicRotateMap({ route, className, arrowPosition }) {
  const map = useMap()

  useEffect(() => {
    // ВРЕМЕННО ОТКЛЮЧАЕМ ПОВОРОТ КАРТЫ ДЛЯ ОТЛАДКИ МАРШРУТА
    console.log('🗺️ DynamicRotateMap временно отключен для отладки маршрута')

    // Всегда сбрасываем поворот
    if (map.getContainer()) {
      map.getContainer().style.transform = 'rotate(0deg)'
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

// Компонент для автоматического центрирования карты на стрелке - ОТКЛЮЧЕН
function FollowArrow({ arrowPosition, className }) {
  // Карта остается статичной даже в полноэкранном режиме
  console.log('🗺️ FollowArrow отключен - карта остается неподвижной даже при навигации')
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

// Функция для расчета тайлов, покрывающих маршрут
function calculateRouteTiles(route, zoomLevel) {
  if (!route) return []

  const tiles = new Set()

  // Функция для преобразования координат в номер тайла
  const coordToTile = (lat, lon, zoom) => {
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom))
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    return { x, y, z: zoom }
  }

  // Добавляем буферную зону вокруг маршрута (в тайлах)
  const bufferTiles = 2 // Увеличиваем буфер для лучшего покрытия

  let allCoordinates = []

  // Собираем координаты из сегментов или обычного маршрута
  if (route.segments && route.segments.length > 0) {
    route.segments.forEach(segment => {
      segment.geometry.coordinates.forEach(coord => {
        // Координаты от OSRM приходят в формате [lon, lat]
        allCoordinates.push([coord[1], coord[0]]) // Преобразуем в [lat, lon]
      })
    })
  } else if (route.coordinates) {
    allCoordinates = route.coordinates.map(coord => [coord[1], coord[0]]) // [lat, lon]
  }

  console.log(`🗺️ Обрабатываем ${allCoordinates.length} координат маршрута для зума ${zoomLevel}`)

  // Проходим по всем точкам маршрута
  allCoordinates.forEach((coord, index) => {
    const lat = coord[0]
    const lon = coord[1]

    if (index < 3) {
      console.log(`🗺️ Координата ${index + 1}: [${lat}, ${lon}]`)
    }

    const tile = coordToTile(lat, lon, zoomLevel)

    // Добавляем основной тайл и буферные тайлы вокруг него
    for (let dx = -bufferTiles; dx <= bufferTiles; dx++) {
      for (let dy = -bufferTiles; dy <= bufferTiles; dy++) {
        const tileKey = `${tile.z}/${tile.x + dx}/${tile.y + dy}`
        tiles.add(tileKey)
      }
    }
  })

  console.log(`🗺️ Рассчитано ${tiles.size} тайлов для маршрута на зуме ${zoomLevel}`)
  return Array.from(tiles)
}

// Компонент для оптимизированной загрузки тайлов только по маршруту
function OptimizedTileLayer({ route, currentProviderConfig, mapKey }) {
  const map = useMap()
  const [routeTiles, setRouteTiles] = useState([])
  const tileLayerRef = useRef(null)

  useEffect(() => {
    if (!route || !map) return

    const currentZoom = map.getZoom()
    console.log('🗺️ Оптимизируем загрузку тайлов для маршрута...')

    // Рассчитываем тайлы для текущего зума
    const tiles = calculateRouteTiles(route, currentZoom)
    setRouteTiles(tiles)

    // Создаем кастомный TileLayer с ограниченной загрузкой
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    // Создаем новый слой с фильтрацией тайлов
    tileLayerRef.current = L.tileLayer(currentProviderConfig.url, {
      attribution: currentProviderConfig.attribution,
      maxZoom: currentProviderConfig.maxZoom,
      crossOrigin: true,
      // Кастомная функция для фильтрации тайлов
      createTile: function(coords, done) {
        const tileKey = `${coords.z}/${coords.x}/${coords.y}`

        // Проверяем, нужен ли этот тайл для маршрута
        if (!tiles.includes(tileKey)) {
          // Возвращаем пустой div вместо загрузки тайла
          const emptyTile = document.createElement('div')
          emptyTile.style.backgroundColor = '#f8f8f8'
          emptyTile.style.border = '1px solid #e0e0e0'
          emptyTile.style.width = '256px'
          emptyTile.style.height = '256px'
          emptyTile.style.display = 'flex'
          emptyTile.style.alignItems = 'center'
          emptyTile.style.justifyContent = 'center'
          emptyTile.style.fontSize = '12px'
          emptyTile.style.color = '#999'
          emptyTile.textContent = '🚀'
          done(null, emptyTile)
          return emptyTile
        }

        // Загружаем тайл как обычно
        const tile = document.createElement('img')
        tile.onload = () => done(null, tile)
        tile.onerror = () => {
          console.warn(`🗺️ Ошибка загрузки тайла ${tileKey}`)
          done(new Error('Ошибка загрузки тайла'))
        }
        tile.src = this.getTileUrl(coords)
        return tile
      }
    })

    map.addLayer(tileLayerRef.current)

    // Обработчик изменения зума
    const handleZoomEnd = () => {
      const newZoom = map.getZoom()
      const newTiles = calculateRouteTiles(route, newZoom)
      setRouteTiles(newTiles)
    }

    map.on('zoomend', handleZoomEnd)

    return () => {
      map.off('zoomend', handleZoomEnd)
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }
    }
  }, [route, currentProviderConfig, map, mapKey])

  return null
}

function MapComponent({
  center,
  markers,
  route,
  waypoints = [], // Промежуточные точки
  userLocation,
  zoom = 12,
  onMapClick,
  onMapMove, // Новый пропс для отслеживания движений карты
  className
}) {
  const mapRef = useRef()
  const [currentProvider, setCurrentProvider] = useState('osm')
  const [mapKey, setMapKey] = useState(0) // Для принудительного обновления карты
  const [arrowPosition, setArrowPosition] = useState(null)
  const [useOptimizedTiles, setUseOptimizedTiles] = useState(false) // Переключатель оптимизации

  // Инициализация позиции стрелки при загрузке маршрута
  useEffect(() => {
    console.log('🗺️ Инициализация стрелки:', {
      isFullscreen: className?.includes('fullscreen'),
      hasRoute: !!route,
      hasCoordinates: !!route?.coordinates,
      coordinatesLength: route?.coordinates?.length
    })

    if (className?.includes('fullscreen') && route?.coordinates && route.coordinates.length >= 2) {
      // Стрелка всегда начинает с начала маршрута
      const startPosition = route.coordinates[0]
      console.log('🗺️ Устанавливаем позицию стрелки на начало маршрута:', startPosition)
      setArrowPosition(startPosition)
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

  // Центрирование карты на маршруте
  useEffect(() => {
    if (route?.segments && route.segments.length > 0 && mapRef.current) {
      console.log('🗺️ Центрируем карту на маршруте...')
      console.log('🗺️ Количество сегментов:', route.segments.length)

      // Собираем все координаты из всех сегментов
      const allCoordinates = []
      route.segments.forEach((segment, index) => {
        console.log(`🗺️ Сегмент ${index + 1}: ${segment.geometry.coordinates.length} координат`)
        segment.geometry.coordinates.forEach(coord => {
          allCoordinates.push([coord[1], coord[0]]) // [lat, lon]
        })
      })

      console.log('🗺️ Всего координат для центрирования:', allCoordinates.length)
      console.log('🗺️ Первые 3 координаты:', allCoordinates.slice(0, 3))

      if (allCoordinates.length > 0) {
        const bounds = L.latLngBounds(allCoordinates)
        console.log('🗺️ Границы маршрута:', bounds)
        mapRef.current.fitBounds(bounds, { padding: [20, 20] })
        console.log('🗺️ Карта отцентрирована на маршруте')
      }
    } else if (route?.coordinates && route.coordinates.length > 0 && mapRef.current) {
      console.log('🗺️ Центрируем карту на простом маршруте...')
      const routeCoordinates = route.coordinates.map(coord => [coord[1], coord[0]]) // [lat, lon]
      const bounds = L.latLngBounds(routeCoordinates)
      mapRef.current.fitBounds(bounds, { padding: [20, 20] })
      console.log('🗺️ Карта отцентрирована на простом маршруте')
    }
  }, [route])

  // Автоматическое включение оптимизации тайлов при наличии маршрута - ОТКЛЮЧЕНО ПО УМОЛЧАНИЮ
  useEffect(() => {
    if (route?.coordinates && route.coordinates.length > 0) {
      // setUseOptimizedTiles(true) // Отключаем автоматическое включение
      console.log('🗺️ Маршрут загружен, оптимизация тайлов доступна (но отключена по умолчанию)')
    } else {
      setUseOptimizedTiles(false)
      console.log('🗺️ Отключена оптимизированная загрузка тайлов')
    }
  }, [route])

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

  const isFullscreen = className?.includes('fullscreen')

  console.log('🗺️ MapComponent render:', {
    center: validCenter,
    zoom,
    className,
    isFullscreen,
    routeExists: !!route,
    routeCoordinatesLength: route?.coordinates?.length,
    routeStartCoords: route?.coordinates?.[0],
    routeEndCoords: route?.coordinates?.[route?.coordinates?.length - 1],
    routeFrom: route?.from,
    routeTo: route?.to,
    routeDistance: route?.distance,
    routeDuration: route?.duration,
    routeSegments: route?.segments?.length,
    arrowPosition
  })

  return (
    <div className={`map-wrapper ${className || ''}`}>
      {/* Селектор типа карты */}
      <MapLayerSelector
        currentProvider={currentProvider}
        onProviderChange={handleProviderChange}
      />

      {/* Переключатель оптимизации тайлов */}
      {route && (
        <div className="tile-optimization-toggle" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '12px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useOptimizedTiles}
              onChange={(e) => {
                setUseOptimizedTiles(e.target.checked)
                console.log('🗺️ Оптимизация тайлов:', e.target.checked ? 'включена' : 'отключена')
              }}
            />
            <span>🚀 Оптимизация тайлов</span>
          </label>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
            {useOptimizedTiles ? 'Загружаются только тайлы маршрута' : 'Загружаются все тайлы'}
          </div>
        </div>
      )}

      <MapContainer
        center={validCenter}
        zoom={zoom}
        style={{
          height: '100%',
          width: '100%',
          minHeight: isFullscreen ? '100vh' : '100%',
          minWidth: isFullscreen ? '100vw' : '100%'
        }}
        ref={mapRef}
        eventHandlers={{
          ...(onMapClick ? {
            click: (e) => {
              console.log('🗺️ Клик по карте:', e.latlng)
              onMapClick(e.latlng)
            }
          } : {}),
          whenReady: () => {
            console.log('🗺️ MapContainer готов к работе')
            if (mapRef.current) {
              setTimeout(() => {
                console.log('🗺️ Принудительное обновление размера карты')
                mapRef.current.invalidateSize()
              }, 100)
            }
          }
        }}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={true}
      >
        <ChangeView center={validCenter} zoom={zoom} />
        <MapEventHandler onMapMove={onMapMove} />
        <ResizeMap className={className} />
        <DynamicRotateMap route={route} className={className} arrowPosition={arrowPosition} />

        {/* Динамический слой карты - ВРЕМЕННО ТОЛЬКО ОБЫЧНАЯ ЗАГРУЗКА */}
        <TileLayer
          key={`${mapKey}-${isFullscreen ? 'fullscreen' : 'normal'}`}
          attribution={currentProviderConfig.attribution}
          url={currentProviderConfig.url}
          maxZoom={currentProviderConfig.maxZoom}
          crossOrigin={true}
          updateWhenIdle={false}
          updateWhenZooming={true}
          keepBuffer={2}
          eventHandlers={{
            tileerror: (e) => {
              console.warn('🗺️ Ошибка загрузки тайла:', e)
              console.warn('🗺️ URL тайла:', e.tile?.src)
              console.warn('🗺️ Попробуйте сменить тип карты в левом верхнем углу')
            },
            tileload: (e) => {
              console.log('🗺️ Тайл загружен успешно:', e.tile?.src)
            },
            loading: (e) => {
              console.log('🗺️ Начинается загрузка тайлов... (режим:', isFullscreen ? 'полноэкранный' : 'обычный', ')')
            },
            load: (e) => {
              console.log('🗺️ Все тайлы загружены! (режим:', isFullscreen ? 'полноэкранный' : 'обычный', ')')
            },
            add: (e) => {
              console.log('🗺️ TileLayer добавлен на карту')
            }
          }}
        />

        {/* ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА ВРЕМЕННО ОТКЛЮЧЕНА */}
        {/* {useOptimizedTiles && route ? (
          <OptimizedTileLayer
            route={route}
            currentProviderConfig={currentProviderConfig}
            mapKey={mapKey}
          />
        ) : null} */}

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
            {console.log('🗺️ Отображаем маршрут на карте:', {
              coordinates: route.coordinates?.length,
              segments: route.segments?.length,
              from: route.from,
              to: route.to,
              firstCoord: route.coordinates?.[0],
              lastCoord: route.coordinates?.[route.coordinates?.length - 1],
              coordinatesType: typeof route.coordinates,
              coordinatesIsArray: Array.isArray(route.coordinates)
            })}
            {/* Линия маршрута */}
            {route.segments && route.segments.length > 0 ? (
              // Отображаем каждый сегмент отдельным цветом
              route.segments.map((segment, index) => {
                const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'] // Синий, зеленый, оранжевый, фиолетовый, красный
                const segmentColor = colors[index % colors.length]

                console.log(`🗺️ *** СОЗДАЕМ СЕГМЕНТ ${index + 1} ***`)
                console.log(`🗺️ Цвет сегмента: ${segmentColor}`)
                console.log(`🗺️ Координат в сегменте: ${segment.geometry.coordinates.length}`)
                console.log(`🗺️ Первые 3 координаты сегмента:`, segment.geometry.coordinates.slice(0, 3))

                const segmentPositions = segment.geometry.coordinates.map(coord => [coord[1], coord[0]])
                console.log(`🗺️ Преобразованные позиции (первые 3):`, segmentPositions.slice(0, 3))

                return (
                  <Polyline
                    key={`segment-${index}`}
                    positions={segmentPositions}
                    color={segmentColor}
                    weight={8}
                    opacity={1.0}
                  >
                    <Popup>
                      <strong>🛣️ Сегмент {index + 1}</strong>
                      <br />
                      📏 Расстояние: {(segment.distance / 1000).toFixed(1)} км
                      <br />
                      ⏱️ Время: {Math.round(segment.duration / 60)} мин ({segment.duration}с)
                      <br />
                      🚶 Скорость: {((segment.distance / 1000) / (segment.duration / 3600)).toFixed(1)} км/ч
                      <br />
                      🎨 Цвет: {segmentColor}
                      <br />
                      📍 Точек маршрута: {segment.geometry.coordinates.length}
                    </Popup>
                  </Polyline>
                )
              })
            ) : (
              // Обычный единый маршрут без промежуточных точек
              (() => {
                const positions = route.coordinates.map(coord => [coord[1], coord[0]]) // Меняем местами lon,lat -> lat,lon
                console.log('🗺️ *** СОЗДАЕМ ЕДИНЫЙ МАРШРУТ ***')
                console.log('🗺️ Исходные координаты (первые 3):', route.coordinates.slice(0, 3))
                console.log('🗺️ Преобразованные позиции (первые 3):', positions.slice(0, 3))
                console.log('🗺️ Общее количество позиций:', positions.length)

                return (
                  <Polyline
                    positions={positions}
                    color="#2196F3"
                    weight={6}
                    opacity={0.9}
                  >
                    <Popup>
                      <strong>🛣️ Прямой маршрут</strong>
                      <br />
                      📏 Расстояние: {(route.distance / 1000).toFixed(1)} км
                      <br />
                      ⏱️ Время: {Math.round(route.duration / 60)} мин ({route.duration}с)
                      <br />
                      🚶 Скорость: {((route.distance / 1000) / (route.duration / 3600)).toFixed(1)} км/ч
                    </Popup>
                  </Polyline>
                )
              })()
            )}

            {/* Маркер начальной точки */}
            <Marker position={route.from} icon={startIcon}>
              <Popup>
                <strong>Начальная точка</strong>
              </Popup>
            </Marker>

            {/* Промежуточные точки */}
            {waypoints.map((waypoint, index) => (
              <Marker
                key={waypoint.id}
                position={waypoint.coordinates}
                icon={createNumberedWaypointIcon(index + 1)}
              >
                <Popup>
                  <strong>📍 Промежуточная точка {index + 1}</strong>
                  <br />
                  <div style={{ maxWidth: '200px', fontSize: '13px' }}>
                    {waypoint.name}
                  </div>
                  <br />
                  <small style={{ color: '#666' }}>
                    Координаты: {waypoint.coordinates[0].toFixed(4)}, {waypoint.coordinates[1].toFixed(4)}
                  </small>
                  <br />
                  <small style={{ color: '#888', fontSize: '11px' }}>
                    Порядок в маршруте: {index + 1} из {waypoints.length}
                  </small>
                </Popup>
              </Marker>
            ))}

            {/* Отладочные маркеры для сегментов (только если есть сегменты) */}
            {route.segments && route.segments.length > 1 && route.segments.map((segment, index) => {
              const startCoord = segment.geometry.coordinates[0]
              const endCoord = segment.geometry.coordinates[segment.geometry.coordinates.length - 1]

              return (
                <React.Fragment key={`segment-debug-${index}`}>
                  {/* Маркер начала сегмента */}
                  <CircleMarker
                    center={[startCoord[1], startCoord[0]]}
                    radius={4}
                    color={index % 2 === 0 ? "#2196F3" : "#4CAF50"}
                    fillColor={index % 2 === 0 ? "#2196F3" : "#4CAF50"}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <strong>🚀 Начало сегмента {index + 1}</strong>
                      <br />
                      Координаты: {startCoord[1].toFixed(4)}, {startCoord[0].toFixed(4)}
                    </Popup>
                  </CircleMarker>

                  {/* Маркер конца сегмента */}
                  <CircleMarker
                    center={[endCoord[1], endCoord[0]]}
                    radius={4}
                    color={index % 2 === 0 ? "#1976D2" : "#388E3C"}
                    fillColor={index % 2 === 0 ? "#1976D2" : "#388E3C"}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <strong>🏁 Конец сегмента {index + 1}</strong>
                      <br />
                      Координаты: {endCoord[1].toFixed(4)}, {endCoord[0].toFixed(4)}
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              )
            })}

            {/* Маркер конечной точки */}
            <Marker position={route.to} icon={endIcon}>
              <Popup>
                <strong>🏁 Конечная точка</strong>
                <br />
                📏 Общее расстояние: {(route.distance / 1000).toFixed(1)} км
                <br />
                ⏱️ Общее время: {Math.round(route.duration / 60)} мин ({route.duration}с)
                <br />
                🚶 Средняя скорость: {((route.distance / 1000) / (route.duration / 3600)).toFixed(1)} км/ч
                <br />
                🗺️ Сегментов: {route.segments ? route.segments.length : 1}
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
