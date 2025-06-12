import { useState, useEffect } from 'react'
import geolocationService from '../services/GeolocationService'

function LocationDebug({ userLocation }) {
  const [debugInfo, setDebugInfo] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (userLocation) {
      // Получаем дополнительную информацию о местоположении
      const lastPosition = geolocationService.getLastKnownPosition()
      if (lastPosition) {
        setDebugInfo(lastPosition)
      }
    }
  }, [userLocation])

  const testGeolocation = async () => {
    console.log('🧪 Запускаем тест геолокации...')

    try {
      // Тест 1: Быстрая геолокация (сеть)
      console.log('📡 Тест 1: Сетевая геолокация...')
      const networkPos = await geolocationService.getCurrentPosition(false)
      console.log('📡 Сетевая геолокация:', networkPos)

      // Тест 2: Высокоточная геолокация (GPS)
      console.log('🛰️ Тест 2: GPS геолокация...')
      const gpsPos = await geolocationService.getCurrentPosition(true)
      console.log('🛰️ GPS геолокация:', gpsPos)

      // Сравнение
      if (networkPos && gpsPos) {
        const distance = geolocationService.calculateDistance(
          networkPos.latitude, networkPos.longitude,
          gpsPos.latitude, gpsPos.longitude
        )
        console.log(`📏 Разница между сетевой и GPS: ${distance.toFixed(0)}м`)
      }

    } catch (error) {
      console.error('❌ Ошибка теста геолокации:', error)
    }
  }

  const checkLocationPermissions = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        console.log('🔐 Статус разрешения геолокации:', permission.state)

        permission.addEventListener('change', () => {
          console.log('🔄 Разрешение изменилось на:', permission.state)
        })
      } catch (error) {
        console.log('❌ Не удалось проверить разрешения:', error)
      }
    }
  }

  useEffect(() => {
    checkLocationPermissions()
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px',
          zIndex: 1000
        }}
        title="Отладка геолокации"
      >
        🔍
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '300px',
      fontSize: '12px',
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>🔍 Отладка геолокации</strong>
        <button
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
        >
          ✕
        </button>
      </div>

      {userLocation && (
        <div style={{ marginBottom: '10px' }}>
          <div><strong>📍 Координаты:</strong></div>
          <div>Широта: {userLocation[0].toFixed(6)}</div>
          <div>Долгота: {userLocation[1].toFixed(6)}</div>
        </div>
      )}

      {debugInfo && (
        <div style={{ marginBottom: '10px' }}>
          <div><strong>🎯 Точность:</strong> {debugInfo.accuracy}м</div>
          <div><strong>📊 Уровень:</strong> {debugInfo.accuracyText}</div>
          {debugInfo.speed && <div><strong>🚗 Скорость:</strong> {debugInfo.speedKmh} км/ч</div>}
          {debugInfo.heading && <div><strong>🧭 Направление:</strong> {debugInfo.headingText}</div>}
          <div><strong>⏰ Время:</strong> {new Date(debugInfo.timestamp).toLocaleTimeString()}</div>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={testGeolocation}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '5px'
          }}
        >
          🧪 Тест геолокации
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#666' }}>
        <div><strong>💡 Советы для точности:</strong></div>
        <div>• Разрешите доступ к GPS</div>
        <div>• Выйдите на открытое место</div>
        <div>• Используйте HTTPS</div>
        <div>• Обновите браузер</div>
      </div>

      {userLocation && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
          <div><strong>🗺️ Проверка местоположения:</strong></div>
          <div>
            {userLocation[0] > 55.1 && userLocation[0] < 56.0 &&
             userLocation[1] > 36.8 && userLocation[1] < 38.2
              ? '✅ В пределах Москвы'
              : `❌ Вне Москвы [${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}]`}
          </div>
          <div>
            <a
              href={`https://www.google.com/maps?q=${userLocation[0]},${userLocation[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              🔗 Открыть в Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationDebug
