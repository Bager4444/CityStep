import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Создаем кастомную иконку для стрелки навигации
const createNavigationArrow = (rotation = 0) => {
  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: #007bff;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
        transform: rotate(${rotation}deg);
        animation: pulse 2s infinite;
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 12px solid white;
          transform: translateY(-2px);
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1) rotate(${rotation}deg); }
          50% { transform: scale(1.1) rotate(${rotation}deg); }
          100% { transform: scale(1) rotate(${rotation}deg); }
        }
      </style>
    `,
    className: 'navigation-arrow-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  })
}

const FullscreenNavigationMap = ({ route, onClose, userLocation }) => {
  const mapRef = useRef(null)
  const [arrowPosition, setArrowPosition] = useState(null)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [nextTurn, setNextTurn] = useState(null)

  // Инициализация позиции стрелки
  useEffect(() => {
    if (route?.coordinates && route.coordinates.length > 0) {
      console.log('🗺️ Инициализация полноэкранной карты с маршрутом:', {
        coordinatesLength: route.coordinates.length,
        startPoint: route.coordinates[0]
      })
      setArrowPosition(route.coordinates[0])
    }
  }, [route])

  // Обновление размера карты при монтировании
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        console.log('🗺️ Обновляем размер полноэкранной карты')
        mapRef.current.invalidateSize(true)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Симуляция движения по маршруту (для демонстрации)
  useEffect(() => {
    if (!route?.coordinates || route.coordinates.length < 2) return

    const interval = setInterval(() => {
      setCurrentSegmentIndex(prev => {
        const nextIndex = prev + 1
        if (nextIndex >= route.coordinates.length) {
          return 0 // Начинаем сначала
        }
        
        setArrowPosition(route.coordinates[nextIndex])
        
        // Обновляем информацию о следующем повороте
        if (nextIndex < route.coordinates.length - 5) {
          setNextTurn({
            direction: 'Прямо',
            distance: Math.floor(Math.random() * 100) + 50 // Случайное расстояние для демо
          })
        }
        
        return nextIndex
      })
    }, 2000) // Обновляем каждые 2 секунды

    return () => clearInterval(interval)
  }, [route])

  if (!route) {
    return (
      <div className="fullscreen-navigation-error">
        <h2>Ошибка</h2>
        <p>Маршрут не найден</p>
        <button onClick={onClose}>Закрыть</button>
      </div>
    )
  }

  const mapCenter = arrowPosition || route.coordinates[0] || [55.7558, 37.6176]
  const remainingDistance = route.distance || 0
  const remainingTime = route.duration || 0

  return (
    <div className="fullscreen-navigation">
      {/* Заголовок */}
      <div className="fullscreen-nav-header">
        <button onClick={onClose} className="close-nav-btn">
          ✕ Закрыть
        </button>
        <h2>🗺️ Навигация</h2>
        <div className="scale-info">Масштаб 1:100</div>
      </div>

      {/* Карта */}
      <div className="fullscreen-nav-map">
        <MapContainer
          center={mapCenter}
          zoom={18}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Тайлы карты */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
          
          {/* Маршрут */}
          {route.coordinates && (
            <Polyline
              positions={route.coordinates}
              color="#007bff"
              weight={6}
              opacity={0.8}
            />
          )}
          
          {/* Стрелка навигации */}
          {arrowPosition && (
            <Marker
              position={arrowPosition}
              icon={createNavigationArrow(0)}
            />
          )}
          
          {/* Местоположение пользователя */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                html: `
                  <div style="
                    width: 20px;
                    height: 20px;
                    background: #28a745;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
                  "></div>
                `,
                className: 'user-location-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            />
          )}
        </MapContainer>
      </div>

      {/* Панель следующего поворота */}
      {nextTurn && (
        <div className="next-turn-info">
          <div className="turn-icon">➡️</div>
          <div className="turn-details">
            <div className="turn-direction">{nextTurn.direction}</div>
            <div className="turn-distance">{nextTurn.distance} м</div>
          </div>
        </div>
      )}

      {/* Панель оставшегося расстояния */}
      <div className="remaining-info">
        <div className="remaining-item">
          <div className="remaining-icon">🛣️</div>
          <div className="remaining-value">
            {(remainingDistance / 1000).toFixed(1)} км
          </div>
        </div>
        <div className="remaining-separator"></div>
        <div className="remaining-item">
          <div className="remaining-icon">⏱️</div>
          <div className="remaining-value">
            {Math.floor(remainingTime / 60)}ч {remainingTime % 60}м
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullscreenNavigationMap
