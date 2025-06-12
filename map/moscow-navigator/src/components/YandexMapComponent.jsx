import { useEffect, useRef, useState } from 'react'

// Конфигурация Яндекс.Карт
const YANDEX_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_YANDEX_MAPS_API_KEY || '',
  lang: 'ru_RU',
  version: '2.1'
}

function YandexMapComponent({ center, markers, route, userLocation }) {
  const mapRef = useRef(null)
  const yandexMapRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState('')
  const objectManagerRef = useRef(null)

  // Загрузка Яндекс.Карт API
  useEffect(() => {
    const loadYandexMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.ymaps) {
          resolve(window.ymaps)
          return
        }

        const script = document.createElement('script')
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_CONFIG.apiKey}&lang=${YANDEX_MAPS_CONFIG.lang}`
        script.onload = () => {
          window.ymaps.ready(() => {
            resolve(window.ymaps)
          })
        }
        script.onerror = () => {
          reject(new Error('Не удалось загрузить Яндекс.Карты'))
        }
        document.head.appendChild(script)
      })
    }

    const initMap = async () => {
      try {
        const ymaps = await loadYandexMaps()

        if (!mapRef.current) return

        // Создаем карту
        yandexMapRef.current = new ymaps.Map(mapRef.current, {
          center: [center[0], center[1]],
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
        })

        // Создаем менеджер объектов для эффективного управления маркерами
        objectManagerRef.current = new ymaps.ObjectManager({
          clusterize: true,
          gridSize: 32,
          clusterDisableClickZoom: false
        })

        yandexMapRef.current.geoObjects.add(objectManagerRef.current)

        setIsLoaded(true)
      } catch (err) {
        console.error('Ошибка загрузки Яндекс.Карт:', err)
        setError('Не удалось загрузить Яндекс.Карты. Проверьте подключение к интернету.')
      }
    }

    initMap()
  }, [])

  // Обновление центра карты
  useEffect(() => {
    if (isLoaded && yandexMapRef.current) {
      yandexMapRef.current.setCenter([center[0], center[1]], 12)
    }
  }, [center, isLoaded])

  // Обновление маркеров
  useEffect(() => {
    if (!isLoaded || !objectManagerRef.current) return

    // Очищаем старые объекты
    objectManagerRef.current.removeAll()

    // Создаем коллекцию объектов
    const features = []

    // Добавляем маркеры результатов поиска
    markers.forEach((marker, index) => {
      features.push({
        type: 'Feature',
        id: `search-${index}`,
        geometry: {
          type: 'Point',
          coordinates: [marker.lat, marker.lon]
        },
        properties: {
          balloonContentHeader: marker.address?.road || marker.address?.amenity || 'Найденное место',
          balloonContentBody: `
            ${marker.address?.house_number ? `${marker.address.house_number}, ` : ''}
            ${marker.address?.suburb || marker.address?.city_district || ''}<br/>
            <small>${marker.display_name}</small>
          `,
          iconCaption: marker.address?.road || marker.address?.amenity || 'Место',
          preset: 'islands#redDotIcon'
        }
      })
    })

    // Добавляем маркер местоположения пользователя
    if (userLocation) {
      features.push({
        type: 'Feature',
        id: 'user-location',
        geometry: {
          type: 'Point',
          coordinates: userLocation
        },
        properties: {
          balloonContentHeader: 'Ваше местоположение',
          iconCaption: 'Вы здесь',
          preset: 'islands#blueDotIcon'
        }
      })
    }

    // Добавляем маркеры маршрута
    if (route) {
      features.push({
        type: 'Feature',
        id: 'route-start',
        geometry: {
          type: 'Point',
          coordinates: route.from
        },
        properties: {
          balloonContentHeader: 'Начальная точка',
          iconCaption: 'Старт',
          preset: 'islands#greenDotIcon'
        }
      })

      features.push({
        type: 'Feature',
        id: 'route-end',
        geometry: {
          type: 'Point',
          coordinates: route.to
        },
        properties: {
          balloonContentHeader: 'Конечная точка',
          balloonContentBody: `
            Расстояние: ${(route.distance / 1000).toFixed(1)} км<br/>
            Время в пути: ${Math.round(route.duration / 60)} мин
          `,
          iconCaption: 'Финиш',
          preset: 'islands#redDotIcon'
        }
      })
    }

    // Добавляем все объекты на карту
    if (features.length > 0) {
      objectManagerRef.current.add({
        type: 'FeatureCollection',
        features: features
      })
    }
  }, [markers, userLocation, route, isLoaded])

  // Отображение маршрута
  useEffect(() => {
    if (!isLoaded || !yandexMapRef.current || !route) return

    // Удаляем старые маршруты
    yandexMapRef.current.geoObjects.each((geoObject) => {
      if (geoObject.properties && geoObject.properties.get('type') === 'route') {
        yandexMapRef.current.geoObjects.remove(geoObject)
      }
    })

    // Создаем полилинию маршрута
    const routeLine = new window.ymaps.Polyline(
      route.coordinates,
      {
        type: 'route'
      },
      {
        strokeColor: '#2196F3',
        strokeWidth: 4,
        strokeOpacity: 0.8
      }
    )

    yandexMapRef.current.geoObjects.add(routeLine)

    // Подгоняем карту под маршрут
    yandexMapRef.current.setBounds(routeLine.geometry.getBounds(), {
      checkZoomRange: true,
      zoomMargin: 50
    })
  }, [route, isLoaded])

  if (error) {
    return (
      <div className="map-error">
        <h3>Ошибка загрузки карты</h3>
        <p>{error}</p>
        <small>
          Для лучшей работы Яндекс.Карт рекомендуется добавить API ключ в переменную окружения REACT_APP_YANDEX_MAPS_API_KEY
        </small>
      </div>
    )
  }

  return (
    <div className="yandex-map-container">
      {!isLoaded && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка Яндекс.Карт...</p>
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

export default YandexMapComponent
