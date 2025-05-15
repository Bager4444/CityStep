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

    // Добавляем плагин для вращения маркеров
    const script = document.createElement('script')
    script.src = '/js/leaflet.rotatedMarker.js'
    script.async = false // Изменяем на синхронную загрузку
    document.head.appendChild(script)

    // Проверяем, что скрипт загрузился
    script.onload = () => {
      console.log('Leaflet Rotated Marker plugin loaded successfully')
    }

    script.onerror = () => {
      console.error('Failed to load Leaflet Rotated Marker plugin')
    }

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
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        }),
        start: L.icon({
          ...iconOptions,
          iconUrl: '/markers/start-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        end: L.icon({
          ...iconOptions,
          iconUrl: '/markers/end-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        attraction: L.icon({
          ...iconOptions,
          iconUrl: '/markers/attraction-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        cafe: L.icon({
          ...iconOptions,
          iconUrl: '/markers/cafe-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        restaurant: L.icon({
          ...iconOptions,
          iconUrl: '/markers/restaurant-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        shop: L.icon({
          ...iconOptions,
          iconUrl: '/markers/shop-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        park: L.icon({
          ...iconOptions,
          iconUrl: '/markers/park-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        exhibition: L.icon({
          ...iconOptions,
          iconUrl: '/markers/exhibition-marker.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
        home: L.icon({
          ...iconOptions,
          iconUrl: '/markers/home-marker.svg',
          iconSize: [36, 36], // Увеличиваем размер иконки для домов
          iconAnchor: [18, 36],
          className: 'home-marker' // Добавляем класс для стилизации
        })
      }

      setIcons(newIcons)
    })

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }

      // Удаляем скрипт плагина при размонтировании
      const scriptElement = document.querySelector('script[src="/js/leaflet.rotatedMarker.js"]')
      if (scriptElement && document.head.contains(scriptElement)) {
        document.head.removeChild(scriptElement)
      }
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

  // Компонент для обработки кликов по карте и маркерам
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

    // Добавляем обработчики кликов для всех маркеров
    useEffect(() => {
      if (map && markers.length > 0 && onMarkerClick) {
        console.log('Setting up marker click handlers');

        // Находим все маркеры на карте
        const markerElements = document.querySelectorAll('.leaflet-marker-icon');

        markerElements.forEach((markerElement, index) => {
          if (index < markers.length) {
            markerElement.addEventListener('click', (e) => {
              console.log('Marker element clicked:', markers[index]);
              e.stopPropagation();
              onMarkerClick(markers[index]);
            });
          }
        });

        return () => {
          // Удаляем обработчики при размонтировании
          markerElements.forEach((markerElement, index) => {
            if (index < markers.length) {
              markerElement.removeEventListener('click', () => {});
            }
          });
        };
      }
    }, [map, markers, onMarkerClick]);

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
        <MapClickHandler />

        {/* Маркеры */}
        {markers.map((marker, index) => {
          // Создаем уникальный id для маркера
          const markerId = `marker-${index}-${marker.type}-${marker.title.replace(/\s+/g, '-').toLowerCase()}`;

          return (
            <Marker
              key={markerId}
              position={marker.position}
              icon={marker.type && icons[marker.type] ? icons[marker.type] : icons.default || undefined}
              eventHandlers={{
                click: (e) => {
                  console.log('Marker clicked:', marker);
                  // Останавливаем всплытие события, чтобы не срабатывал клик по карте
                  e.originalEvent.stopPropagation();
                  if (onMarkerClick) {
                    onMarkerClick(marker);
                  }
                }
              }}
              // Добавляем класс для активного маркера и тип маркера
              className={`${marker.active ? 'active-marker' : ''} marker-${marker.type || 'default'}`}
            >
              <Popup>
                <div>
                  <h3 className="font-bold text-green-700">{marker.title}</h3>
                  {marker.description && <p className="text-sm">{marker.description}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Маршруты */}
        {routes.map((route, index) => (
          <Polyline
            key={`route-${index}`}
            positions={route.points}
            color="#8b5cf6" // Фиолетовый цвет
            weight={5}
            opacity={0.9}
            className="purple-route"
            smoothFactor={1}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default MapComponent
