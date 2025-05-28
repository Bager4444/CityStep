import { useState } from 'react'
import MapComponent from './MapComponent' // Leaflet карты
import GoogleMapComponent from './GoogleMapComponent'
import YandexMapComponent from './YandexMapComponent'

// Типы карт
export const MAP_TYPES = {
  leaflet: {
    name: 'Leaflet Maps',
    component: MapComponent,
    description: 'OpenStreetMap и другие провайдеры через Leaflet'
  },
  google: {
    name: 'Google Maps',
    component: GoogleMapComponent,
    description: 'Google Maps с высоким качеством изображений'
  },
  yandex: {
    name: 'Яндекс.Карты',
    component: YandexMapComponent,
    description: 'Подробные карты России от Яндекса'
  }
}

function MapTypeSelector({ currentType, onTypeChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTypeSelect = (typeId) => {
    onTypeChange(typeId)
    setIsOpen(false)
  }

  return (
    <div className="map-type-selector">
      <button 
        className="type-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Выбрать картографический сервис"
      >
        🌍 {MAP_TYPES[currentType]?.name || 'Карта'}
      </button>
      
      {isOpen && (
        <div className="type-selector-dropdown">
          <div className="type-selector-header">
            <h4>Картографические сервисы:</h4>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="type-options">
            {Object.entries(MAP_TYPES).map(([id, mapType]) => (
              <button
                key={id}
                className={`type-option ${currentType === id ? 'active' : ''}`}
                onClick={() => handleTypeSelect(id)}
              >
                <div className="type-info">
                  <span className="type-name">{mapType.name}</span>
                  <small className="type-description">{mapType.description}</small>
                </div>
                {currentType === id && <span className="checkmark">✓</span>}
              </button>
            ))}
          </div>
          
          <div className="type-selector-footer">
            <small>
              Google Maps и Яндекс.Карты могут требовать API ключи для полной функциональности
            </small>
          </div>
        </div>
      )}
    </div>
  )
}

function UniversalMapComponent({ center, markers, route, userLocation }) {
  const [currentMapType, setCurrentMapType] = useState('leaflet')

  const CurrentMapComponent = MAP_TYPES[currentMapType]?.component || MapComponent

  return (
    <div className="universal-map-wrapper">
      {/* Селектор типа картографического сервиса */}
      <MapTypeSelector 
        currentType={currentMapType}
        onTypeChange={setCurrentMapType}
      />
      
      {/* Текущая карта */}
      <CurrentMapComponent
        center={center}
        markers={markers}
        route={route}
        userLocation={userLocation}
      />
    </div>
  )
}

export default UniversalMapComponent
