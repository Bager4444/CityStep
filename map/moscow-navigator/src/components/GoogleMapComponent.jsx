import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

// Конфигурация Google Maps
const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
  version: 'weekly',
  libraries: ['places', 'geometry']
}

function GoogleMapComponent({ center, markers, route, userLocation }) {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState('')
  const markersRef = useRef([])
  const routePolylineRef = useRef(null)

  // Инициализация Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader(GOOGLE_MAPS_CONFIG)
        await loader.load()

        if (!mapRef.current) return

        // Создаем карту
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 12,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels.text',
              stylers: [{ visibility: 'on' }]
            }
          ]
        })

        setIsLoaded(true)
      } catch (err) {
        console.error('Ошибка загрузки Google Maps:', err)
        setError('Не удалось загрузить Google Maps. Проверьте API ключ.')
      }
    }

    initMap()
  }, [])

  // Обновление центра карты
  useEffect(() => {
    if (isLoaded && googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: center[0], lng: center[1] })
    }
  }, [center, isLoaded])

  // Обновление маркеров
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return

    // Очищаем старые маркеры
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Добавляем новые маркеры
    markers.forEach((marker, index) => {
      const googleMarker = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lon },
        map: googleMapRef.current,
        title: marker.address?.road || marker.address?.amenity || 'Найденное место',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${marker.address?.road || marker.address?.amenity || 'Найденное место'}</strong><br/>
            ${marker.address?.house_number ? `${marker.address.house_number}, ` : ''}
            ${marker.address?.suburb || marker.address?.city_district || ''}<br/>
            <small>${marker.display_name}</small>
          </div>
        `
      })

      googleMarker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, googleMarker)
      })

      markersRef.current.push(googleMarker)
    })
  }, [markers, isLoaded])

  // Добавление маркера местоположения пользователя
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current || !userLocation) return

    const userMarker = new window.google.maps.Marker({
      position: { lat: userLocation[0], lng: userLocation[1] },
      map: googleMapRef.current,
      title: 'Ваше местоположение',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      }
    })

    const infoWindow = new window.google.maps.InfoWindow({
      content: '<strong>Ваше местоположение</strong>'
    })

    userMarker.addListener('click', () => {
      infoWindow.open(googleMapRef.current, userMarker)
    })

    markersRef.current.push(userMarker)
  }, [userLocation, isLoaded])

  // Отображение маршрута
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return

    // Удаляем старый маршрут
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null)
    }

    if (!route) return

    // Создаем новый маршрут
    const path = route.coordinates.map(coord => ({
      lat: coord[0],
      lng: coord[1]
    }))

    routePolylineRef.current = new window.google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#2196F3',
      strokeOpacity: 1.0,
      strokeWeight: 4
    })

    routePolylineRef.current.setMap(googleMapRef.current)

    // Добавляем маркеры начала и конца маршрута
    const startMarker = new window.google.maps.Marker({
      position: { lat: route.from[0], lng: route.from[1] },
      map: googleMapRef.current,
      title: 'Начальная точка',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      }
    })

    const endMarker = new window.google.maps.Marker({
      position: { lat: route.to[0], lng: route.to[1] },
      map: googleMapRef.current,
      title: 'Конечная точка',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      }
    })

    const endInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div>
          <strong>Конечная точка</strong><br/>
          Расстояние: ${(route.distance / 1000).toFixed(1)} км<br/>
          Время в пути: ${Math.round(route.duration / 60)} мин
        </div>
      `
    })

    endMarker.addListener('click', () => {
      endInfoWindow.open(googleMapRef.current, endMarker)
    })

    markersRef.current.push(startMarker, endMarker)
  }, [route, isLoaded])

  if (error) {
    return (
      <div className="map-error">
        <h3>Ошибка загрузки карты</h3>
        <p>{error}</p>
        <small>
          Для использования Google Maps необходимо добавить API ключ в переменную окружения REACT_APP_GOOGLE_MAPS_API_KEY
        </small>
      </div>
    )
  }

  return (
    <div className="google-map-container">
      {!isLoaded && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка Google Maps...</p>
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          display: isLoaded ? 'block' : 'none'
        }}
      />
    </div>
  )
}

export default GoogleMapComponent
