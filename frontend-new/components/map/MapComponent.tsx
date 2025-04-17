'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

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

// Типы для маркеров и маршрутов
export interface MapMarker {
  position: [number, number];
  title: string;
  description?: string;
  type?: 'start' | 'end' | 'attraction' | 'cafe' | 'restaurant' | 'shop' | 'park' | 'exhibition';
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
}

const MapComponent = ({
  center = [55.7558, 37.6173], // Москва по умолчанию
  zoom = 13,
  markers = [],
  routes = [],
  height = '500px',
  onMarkerClick
}: MapComponentProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [leafletIcon, setLeafletIcon] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Добавляем стили Leaflet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    document.head.appendChild(link)
    
    // Импортируем иконку Leaflet
    import('leaflet').then((L) => {
      // Исправляем проблему с иконками в Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      
      setLeafletIcon(L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
      }))
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

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker, index) => (
          <Marker 
            key={`marker-${index}`} 
            position={marker.position}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(marker)
            }}
          >
            <Popup>
              <div>
                <h3 className="font-bold text-green-700">{marker.title}</h3>
                {marker.description && <p className="text-sm">{marker.description}</p>}
                {marker.type && (
                  <p className="text-xs text-gray-500 mt-1">
                    {marker.type === 'start' && 'Начальная точка'}
                    {marker.type === 'end' && 'Конечная точка'}
                    {marker.type === 'attraction' && 'Достопримечательность'}
                    {marker.type === 'cafe' && 'Кафе'}
                    {marker.type === 'restaurant' && 'Ресторан'}
                    {marker.type === 'shop' && 'Магазин'}
                    {marker.type === 'park' && 'Парк'}
                    {marker.type === 'exhibition' && 'Выставка'}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
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
