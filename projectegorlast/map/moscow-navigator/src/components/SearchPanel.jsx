import { useState, useCallback } from 'react'

function SearchPanel({ searchQuery, setSearchQuery, onSearch, markers, setMapCenter }) {
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setError('Введите запрос для поиска')
      return
    }

    setIsSearching(true)
    setError('')

    try {
      await onSearch(searchQuery)
    } catch (err) {
      setError('Ошибка при поиске. Попробуйте еще раз.')
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = useCallback((e) => {
    setSearchQuery(e.target.value)
    setError('')
  }, [setSearchQuery])

  const handleMarkerClick = (marker) => {
    setMapCenter([marker.lat, marker.lon])
  }

  const formatAddress = (marker) => {
    const addr = marker.address
    if (!addr) return marker.display_name

    const parts = []
    if (addr.road) parts.push(addr.road)
    if (addr.house_number) parts.push(addr.house_number)
    if (addr.suburb || addr.city_district) parts.push(addr.suburb || addr.city_district)

    return parts.length > 0 ? parts.join(', ') : marker.display_name
  }

  return (
    <div className="search-panel">
      <h3>Поиск мест</h3>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Введите адрес или название места в Москве..."
            className="search-input"
            disabled={isSearching}
            autoComplete="off"
          />
          <button
            type="submit"
            className="search-button"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? 'Поиск...' : 'Найти'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </form>

      {markers.length > 0 && (
        <div className="search-results">
          <h4>Результаты поиска:</h4>
          <ul className="results-list">
            {markers.map((marker, index) => (
              <li
                key={index}
                className="result-item"
                onClick={() => handleMarkerClick(marker)}
              >
                <div className="result-title">
                  {marker.address?.amenity || marker.address?.road || 'Место'}
                </div>
                <div className="result-address">
                  {formatAddress(marker)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="search-tips">
        <h4>Примеры поиска:</h4>
        <ul>
          <li>Красная площадь</li>
          <li>Тверская улица</li>
          <li>Метро Сокольники</li>
          <li>Парк Горького</li>
          <li>Московский Кремль</li>
        </ul>
      </div>
    </div>
  )
}

export default SearchPanel
