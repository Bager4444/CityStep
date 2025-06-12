import { useState } from 'react'
import './WaypointsPanel.css'

/**
 * 📍 Панель управления промежуточными точками
 * Позволяет добавлять, удалять и изменять порядок промежуточных точек маршрута
 */
const WaypointsPanel = ({ 
  waypoints, 
  onWaypointsChange, 
  onAddWaypoint,
  onRemoveWaypoint,
  onReorderWaypoints,
  isVisible,
  onClose 
}) => {
  const [newWaypointQuery, setNewWaypointQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Поиск места для новой промежуточной точки
  const handleSearchWaypoint = async () => {
    if (!newWaypointQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newWaypointQuery + ', Москва')}&limit=5&addressdetails=1`
      )
      
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results.map(result => ({
          id: result.place_id,
          name: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
        })))
      }
    } catch (error) {
      console.error('Ошибка поиска промежуточной точки:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Добавление промежуточной точки
  const handleAddWaypoint = (location) => {
    const waypoint = {
      id: Date.now(),
      name: location.name,
      coordinates: [location.lat, location.lon],
      order: waypoints.length
    }
    
    onAddWaypoint(waypoint)
    setNewWaypointQuery('')
    setSearchResults([])
  }

  // Удаление промежуточной точки
  const handleRemoveWaypoint = (waypointId) => {
    onRemoveWaypoint(waypointId)
  }

  // Начало перетаскивания
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Обработка перетаскивания
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Завершение перетаскивания
  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newWaypoints = [...waypoints]
    const draggedWaypoint = newWaypoints[draggedIndex]
    
    // Удаляем элемент из старой позиции
    newWaypoints.splice(draggedIndex, 1)
    
    // Вставляем в новую позицию
    newWaypoints.splice(dropIndex, 0, draggedWaypoint)
    
    // Обновляем порядок
    const reorderedWaypoints = newWaypoints.map((wp, index) => ({
      ...wp,
      order: index
    }))
    
    onReorderWaypoints(reorderedWaypoints)
    setDraggedIndex(null)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="waypoints-overlay">
      <div className="waypoints-panel">
        <div className="waypoints-header">
          <h2>📍 Промежуточные точки</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="waypoints-content">
          {/* Добавление новой точки */}
          <div className="add-waypoint-section">
            <h3>➕ Добавить точку</h3>
            <div className="search-waypoint">
              <input
                type="text"
                placeholder="Введите адрес или название места..."
                value={newWaypointQuery}
                onChange={(e) => setNewWaypointQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchWaypoint()}
                className="waypoint-search-input"
              />
              <button 
                onClick={handleSearchWaypoint}
                disabled={isSearching || !newWaypointQuery.trim()}
                className="search-waypoint-btn"
              >
                {isSearching ? '🔍' : '🔍'}
              </button>
            </div>

            {/* Результаты поиска */}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(result => (
                  <div 
                    key={result.id} 
                    className="search-result-item"
                    onClick={() => handleAddWaypoint(result)}
                  >
                    <span className="result-icon">📍</span>
                    <span className="result-name">{result.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Список промежуточных точек */}
          <div className="waypoints-list-section">
            <h3>🗺️ Маршрут ({waypoints.length + 2} точек)</h3>
            
            {waypoints.length === 0 ? (
              <div className="no-waypoints">
                <p>Промежуточные точки не добавлены</p>
                <p className="hint">Добавьте точки, чтобы маршрут проходил через них</p>
              </div>
            ) : (
              <div className="waypoints-list">
                {/* Начальная точка */}
                <div className="waypoint-item start-point">
                  <span className="waypoint-icon">🚀</span>
                  <span className="waypoint-name">Начальная точка</span>
                  <span className="waypoint-type">Старт</span>
                </div>

                {/* Промежуточные точки */}
                {waypoints.map((waypoint, index) => (
                  <div
                    key={waypoint.id}
                    className={`waypoint-item ${draggedIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <span className="waypoint-icon">📍</span>
                    <div className="waypoint-info">
                      <span className="waypoint-name">{waypoint.name}</span>
                      <span className="waypoint-coords">
                        {waypoint.coordinates[0].toFixed(4)}, {waypoint.coordinates[1].toFixed(4)}
                      </span>
                    </div>
                    <div className="waypoint-actions">
                      <span className="drag-handle">⋮⋮</span>
                      <button 
                        className="remove-waypoint-btn"
                        onClick={() => handleRemoveWaypoint(waypoint.id)}
                        title="Удалить точку"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {/* Конечная точка */}
                <div className="waypoint-item end-point">
                  <span className="waypoint-icon">🏁</span>
                  <span className="waypoint-name">Конечная точка</span>
                  <span className="waypoint-type">Финиш</span>
                </div>
              </div>
            )}
          </div>

          {/* Информация о маршруте */}
          {waypoints.length > 0 && (
            <div className="route-info-section">
              <h3>ℹ️ Информация</h3>
              <div className="route-stats">
                <div className="stat-item">
                  <span className="stat-label">Всего точек:</span>
                  <span className="stat-value">{waypoints.length + 2}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Промежуточных:</span>
                  <span className="stat-value">{waypoints.length}</span>
                </div>
              </div>
              
              <div className="route-tips">
                <p>💡 <strong>Советы:</strong></p>
                <ul>
                  <li>Перетаскивайте точки для изменения порядка</li>
                  <li>Маршрут будет проходить через все точки по порядку</li>
                  <li>Больше точек = более точный, но длинный маршрут</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="waypoints-actions">
          <button 
            className="clear-all-btn"
            onClick={() => onWaypointsChange([])}
            disabled={waypoints.length === 0}
          >
            🗑️ Очистить все
          </button>
          <button className="apply-btn" onClick={onClose}>
            ✅ Применить
          </button>
        </div>
      </div>
    </div>
  )
}

export default WaypointsPanel
