'use client'

import { useState, useEffect, useRef } from 'react'
import { MapMarker } from '../map/MapComponent'

// Типы зданий, которые считаются домами
const HOME_TYPES = [
  'house',
  'apartments',
  'residential',
  'apartment',
  'building',
  'dormitory',
  'hotel',
  'hostel'
]

interface AddressSearchProps {
  onAddressSelect: (marker: MapMarker) => void
  placeholder?: string
  label?: string
  type: 'start' | 'end'
}

export default function AddressSearch({
  onAddressSelect,
  placeholder = 'Введите адрес...',
  label = 'Поиск адреса',
  type
}: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Функция для определения, является ли адрес домом
  const isHomeAddress = (result: any): boolean => {
    // Проверяем наличие детальной информации об адресе
    if (result.address) {
      // Проверяем наличие номера дома
      if (result.address.house_number) {
        return true;
      }

      // Проверяем тип здания
      if (result.type === 'building' ||
          (result.class === 'building' && result.type !== 'yes') ||
          HOME_TYPES.some(type => result.type === type)) {
        return true;
      }
    }

    // Проверяем наличие слова дом/улица в названии
    const displayName = result.display_name.toLowerCase();
    return displayName.includes(' д.') ||
           displayName.includes(' дом ') ||
           displayName.includes(' ул.') ||
           displayName.includes(' улица ');
  }

  // Обработчик клика вне компонента поиска
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Функция для поиска адресов через Nominatim API (OpenStreetMap)
  const searchAddress = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
      )

      if (!response.ok) {
        throw new Error('Ошибка при поиске адреса')
      }

      const data = await response.json()
      setResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Ошибка при поиске адреса:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Обработчик выбора адреса
  const handleSelectAddress = (result: any) => {
    const position: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)]
    const marker: MapMarker = {
      position,
      title: result.display_name.split(',')[0],
      description: result.display_name,
      // Если в результате есть тип здания, то устанавливаем тип дома
      type: isHomeAddress(result) ? 'home' : type
    }

    onAddressSelect(marker)
    setQuery(result.display_name.split(',')[0])
    setShowResults(false)
  }

  // Обработчик изменения поискового запроса
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Добавляем небольшую задержку перед отправкой запроса
    const timeoutId = setTimeout(() => {
      searchAddress(value)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="relative" ref={searchRef}>
      <label className="block text-gray-700 font-medium mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
          <ul className="py-1">
            {results.map((result) => (
              <li
                key={result.place_id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectAddress(result)}
              >
                <div className="font-medium">{result.display_name.split(',')[0]}</div>
                <div className="text-xs text-gray-500 truncate">{result.display_name}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
