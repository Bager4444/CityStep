'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Icon, Map as LeafletMap } from 'leaflet'

// Динамический импорт компонентов Leaflet для работы на стороне клиента
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

const useMapEvents = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMapEvents),
  { ssr: false }
)

// Типы для маркеров и маршрутов
export interface MapMarker {
  position: [number, number];
  title: string;
  description?: string;
  type?: 'start' | 'end' | 'attraction' | 'cafe' | 'restaurant' | 'shop' | 'park' | 'exhibition' | 'home';
  active?: boolean; // Для выделения активной точки
  image_url?: string; // URL изображения
  beauty_score?: number; // Оценка красоты
  estimated_time?: number; // Примерное время посещения в минутах
  popularity?: number; // Популярность
  historical_value?: number; // Историческая ценность
  architectural_value?: number; // Архитектурная ценность
}

export interface MapRoute {
  points: [number, number][];
  color?: string;
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (position: [number, number]) => void;
  onMapReady?: (map: LeafletMap) => void;
  interactive?: boolean; // Разрешить взаимодействие с картой (клики, перетаскивание и т.д.)
}

const MapComponent = ({
  center = [55.7558, 37.6173], // Москва по умолчанию
  zoom = 13,
  markers = [],
  routes = [],
  height = '500px',
  onMarkerClick,
  onMapClick,
  onMapReady,
  interactive = true
}: MapComponentProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const mapRef = useRef<LeafletMap | null>(null)
  const [icons, setIcons] = useState<Record<string, Icon>>({})

  useEffect(() => {
    setIsMounted(true)

    // Добавляем стили Leaflet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    document.head.appendChild(link)

    // Импортируем иконки Leaflet
    import('leaflet').then((L) => {
      // Исправляем проблему с иконками в Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Создаем разные иконки для разных типов маркеров
      const iconOptions = {
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }

      const newIcons: Record<string, Icon> = {
        default: L.icon({
          ...iconOptions,
          iconUrl: '/markers/default-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0], // Убираем тень для SVG-иконок
        }),
        start: L.icon({
          ...iconOptions,
          iconUrl: '/markers/start-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        end: L.icon({
          ...iconOptions,
          iconUrl: '/markers/end-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        attraction: L.icon({
          ...iconOptions,
          iconUrl: '/markers/attraction-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        cafe: L.icon({
          ...iconOptions,
          iconUrl: '/markers/cafe-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        restaurant: L.icon({
          ...iconOptions,
          iconUrl: '/markers/restaurant-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        shop: L.icon({
          ...iconOptions,
          iconUrl: '/markers/shop-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        park: L.icon({
          ...iconOptions,
          iconUrl: '/markers/park-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        exhibition: L.icon({
          ...iconOptions,
          iconUrl: '/markers/exhibition-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          shadowSize: [0, 0],
        }),
        home: L.icon({
          ...iconOptions,
          iconUrl: '/markers/home-marker.svg',
          iconSize: [36, 36], // Увеличиваем размер иконки для домов
          iconAnchor: [18, 18],
          shadowSize: [0, 0],
          className: 'home-marker' // Добавляем класс для стилизации
        })
      }

      setIcons(newIcons)
    })

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  if (!isMounted) {
    return (
      <div
        className="bg-gray-200 flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        Загрузка карты...
      </div>
    )
  }

  // Компонент для обработки кликов по карте
  const MapClickHandler = () => {
    const map = useMapEvents({
      click: (e) => {
        if (onMapClick && interactive) {
          const { lat, lng } = e.latlng;
          onMapClick([lat, lng]);
        }
      },
      load: (e) => {
        mapRef.current = e.target;
        if (onMapReady) {
          onMapReady(e.target);
        }
      }
    });
    return null;
  };

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        attributionControl={true}
        zoomControl={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Компонент для обработки кликов */}
        {onMapClick && <MapClickHandler />}

        {/* Маркеры */}
        {markers.map((marker, index) => (
          <Marker
            key={`marker-${index}`}
            position={marker.position}
            icon={marker.type && icons[marker.type] ? icons[marker.type] : icons.default || undefined}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(marker)
            }}
            // Добавляем класс для активного маркера
            className={marker.active ? 'active-marker' : ''}
          >
            <Popup>
              <div className="popup-content" style={{ maxWidth: '250px' }}>
                <h3 className="font-bold text-green-700 mb-2">{marker.title}</h3>

                {/* Добавляем изображение, если оно есть */}
                {(marker as any).image_url && (
                  <div className="mb-2">
                    <img
                      src={(marker as any).image_url}
                      alt={marker.title}
                      className="w-full h-32 object-cover rounded-md mb-2"
                      onError={(e) => {
                        // Если изображение не загрузилось, заменяем на заглушку
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x100?text=Нет+фото';
                      }}
                    />
                  </div>
                )}

                {marker.description && <p className="text-sm mb-2">{marker.description}</p>}

                {/* Добавляем дополнительную информацию, если она есть */}
                {(marker as any).beauty_score && (
                  <p className="text-sm">
                    <span className="font-semibold">Оценка красоты:</span> {(marker as any).beauty_score}/10
                  </p>
                )}

                {(marker as any).estimated_time && (
                  <p className="text-sm">
                    <span className="font-semibold">Время посещения:</span> {(marker as any).estimated_time} мин.
                  </p>
                )}

                {marker.type && (
                  <p className="text-xs text-gray-500 mt-2">
                    {marker.type === 'start' && 'Начальная точка'}
                    {marker.type === 'end' && 'Конечная точка'}
                    {marker.type === 'attraction' && 'Достопримечательность'}
                    {marker.type === 'cafe' && 'Кафе'}
                    {marker.type === 'restaurant' && 'Ресторан'}
                    {marker.type === 'shop' && 'Магазин'}
                    {marker.type === 'park' && 'Парк'}
                    {marker.type === 'exhibition' && 'Выставка'}
                    {marker.type === 'home' && 'Дом'}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Маршруты */}
        {routes.map((route, index) => (
          <Polyline
            key={`route-${index}`}
            positions={route.points}
            color={route.color || '#16a34a'} // Зеленый цвет по умолчанию
            weight={4}
            opacity={0.7}
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default MapComponent
