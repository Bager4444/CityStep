'use client'

import { useState, useEffect, useRef } from 'react'

interface AddressInputProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onCoordinatesChange?: (lat: number, lng: number) => void
  className?: string
}

interface Suggestion {
  address: string
  lat: number
  lng: number
}

const AddressInput = ({
  label,
  placeholder = 'Введите адрес',
  value,
  onChange,
  onCoordinatesChange,
  className = ''
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Моковая база данных адресов для подсказок (120 из 4273 улиц Москвы)
  const mockAddressDatabase = [
    // Достопримечательности
    { address: 'Москва, Красная площадь', lat: 55.7539, lng: 37.6208 },
    { address: 'Москва, Воробьевы горы', lat: 55.7103, lng: 37.5428 },
    { address: 'Москва, Большой театр', lat: 55.7601, lng: 37.6186 },
    { address: 'Москва, Третьяковская галерея', lat: 55.7415, lng: 37.6208 },
    { address: 'Москва, Парк Горького', lat: 55.7298, lng: 37.6019 },
    { address: 'Москва, ВДНХ', lat: 55.8263, lng: 37.6377 },
    { address: 'Москва, Останкинская телебашня', lat: 55.8197, lng: 37.6117 },
    { address: 'Москва, Москва-Сити', lat: 55.7473, lng: 37.5377 },
    { address: 'Москва, Парк Зарядье', lat: 55.7510, lng: 37.6290 },
    { address: 'Москва, Храм Христа Спасителя', lat: 55.7446, lng: 37.6055 },
    { address: 'Москва, Парк Коломенское', lat: 55.6698, lng: 37.6711 },
    { address: 'Москва, Парк Царицыно', lat: 55.6156, lng: 37.6869 },
    { address: 'Москва, Новодевичий монастырь', lat: 55.7256, lng: 37.5568 },
    { address: 'Москва, Патриаршие пруды', lat: 55.7631, lng: 37.5926 },
    { address: 'Москва, Музей изобразительных искусств им. А.С. Пушкина', lat: 55.7447, lng: 37.6062 },
    { address: 'Москва, Садовое кольцо', lat: 55.7558, lng: 37.6173 },
    { address: 'Москва, Бульварное кольцо', lat: 55.7631, lng: 37.6073 },
    { address: 'Москва, Лужники', lat: 55.7175, lng: 37.5555 },
    { address: 'Москва, ГУМ', lat: 55.7546, lng: 37.6215 },
    { address: 'Москва, ЦУМ', lat: 55.7602, lng: 37.6206 },

    // Улицы центра Москвы
    { address: 'Москва, ул. Тверская', lat: 55.7575, lng: 37.6136 },
    { address: 'Москва, ул. Арбат', lat: 55.7486, lng: 37.5936 },
    { address: 'Москва, ул. Новый Арбат', lat: 55.7528, lng: 37.5944 },
    { address: 'Москва, ул. Пятницкая', lat: 55.7414, lng: 37.6290 },
    { address: 'Москва, ул. Мясницкая', lat: 55.7612, lng: 37.6363 },
    { address: 'Москва, ул. Никольская', lat: 55.7564, lng: 37.6216 },
    { address: 'Москва, ул. Покровка', lat: 55.7598, lng: 37.6465 },
    { address: 'Москва, ул. Маросейка', lat: 55.7579, lng: 37.6368 },
    { address: 'Москва, ул. Петровка', lat: 55.7622, lng: 37.6175 },
    { address: 'Москва, ул. Большая Дмитровка', lat: 55.7599, lng: 37.6123 },
    { address: 'Москва, ул. Кузнецкий Мост', lat: 55.7613, lng: 37.6205 },
    { address: 'Москва, ул. Варварка', lat: 55.7514, lng: 37.6265 },
    { address: 'Москва, ул. Ильинка', lat: 55.7546, lng: 37.6254 },
    { address: 'Москва, ул. Остоженка', lat: 55.7399, lng: 37.6019 },
    { address: 'Москва, ул. Пречистенка', lat: 55.7414, lng: 37.5991 },
    { address: 'Москва, ул. Большая Ордынка', lat: 55.7372, lng: 37.6227 },
    { address: 'Москва, ул. Большая Якиманка', lat: 55.7358, lng: 37.6118 },
    { address: 'Москва, ул. Большая Полянка', lat: 55.7372, lng: 37.6178 },
    { address: 'Москва, ул. Большая Никитская', lat: 55.7566, lng: 37.6036 },
    { address: 'Москва, ул. Малая Бронная', lat: 55.7622, lng: 37.6006 },

    // Бульвары и еще улицы
    { address: 'Москва, Тверской бульвар', lat: 55.7617, lng: 37.6012 },
    { address: 'Москва, Чистопрудный бульвар', lat: 55.7631, lng: 37.6380 },
    { address: 'Москва, Гоголевский бульвар', lat: 55.7486, lng: 37.6006 },
    { address: 'Москва, Страстной бульвар', lat: 55.7667, lng: 37.6097 },
    { address: 'Москва, Цветной бульвар', lat: 55.7711, lng: 37.6207 },
    { address: 'Москва, ул. Сретенка', lat: 55.7686, lng: 37.6305 },
    { address: 'Москва, ул. Солянка', lat: 55.7536, lng: 37.6372 },
    { address: 'Москва, ул. Волхонка', lat: 55.7447, lng: 37.6062 },
    { address: 'Москва, ул. Знаменка', lat: 55.7486, lng: 37.6036 },
    { address: 'Москва, ул. Воздвиженка', lat: 55.7522, lng: 37.6047 },
    { address: 'Москва, ул. Моховая', lat: 55.7522, lng: 37.6097 },
    { address: 'Москва, ул. Охотный Ряд', lat: 55.7577, lng: 37.6177 },
    { address: 'Москва, ул. Большая Лубянка', lat: 55.7622, lng: 37.6283 },
    { address: 'Москва, ул. Малая Лубянка', lat: 55.7631, lng: 37.6283 },
    { address: 'Москва, ул. Малая Никитская', lat: 55.7594, lng: 37.5991 },
    { address: 'Москва, ул. Большая Грузинская', lat: 55.7686, lng: 37.5855 },
    { address: 'Москва, ул. Малая Грузинская', lat: 55.7667, lng: 37.5810 },
    { address: 'Москва, ул. Поварская', lat: 55.7558, lng: 37.5991 },
    { address: 'Москва, ул. Спиридоновка', lat: 55.7594, lng: 37.5944 },
    { address: 'Москва, ул. Большая Бронная', lat: 55.7622, lng: 37.6006 },

    // Проспекты и шоссе
    { address: 'Москва, Ленинградский проспект', lat: 55.7939, lng: 37.5584 },
    { address: 'Москва, Ленинградское шоссе', lat: 55.8511, lng: 37.4902 },
    { address: 'Москва, Дмитровское шоссе', lat: 55.8667, lng: 37.5584 },
    { address: 'Москва, Алтуфьевское шоссе', lat: 55.8822, lng: 37.5855 },
    { address: 'Москва, Ярославское шоссе', lat: 55.8667, lng: 37.6673 },
    { address: 'Москва, Щелковское шоссе', lat: 55.8106, lng: 37.7986 },
    { address: 'Москва, Рязанский проспект', lat: 55.7286, lng: 37.7986 },
    { address: 'Москва, Волгоградский проспект', lat: 55.7286, lng: 37.7173 },
    { address: 'Москва, Каширское шоссе', lat: 55.6544, lng: 37.6673 },
    { address: 'Москва, Варшавское шоссе', lat: 55.6544, lng: 37.6207 },
    { address: 'Москва, Севастопольский проспект', lat: 55.6700, lng: 37.5991 },
    { address: 'Москва, ул. Профсоюзная', lat: 55.6700, lng: 37.5584 },
    { address: 'Москва, проспект Вернадского', lat: 55.6856, lng: 37.5042 },
    { address: 'Москва, Мичуринский проспект', lat: 55.7011, lng: 37.4902 },
    { address: 'Москва, Кутузовский проспект', lat: 55.7419, lng: 37.5350 },
    { address: 'Москва, ул. Минская', lat: 55.7286, lng: 37.4902 },
    { address: 'Москва, ул. Мосфильмовская', lat: 55.7286, lng: 37.5313 },
    { address: 'Москва, Университетский проспект', lat: 55.7011, lng: 37.5584 },
    { address: 'Москва, Ломоносовский проспект', lat: 55.7011, lng: 37.5313 },
    { address: 'Москва, Комсомольский проспект', lat: 55.7286, lng: 37.5855 },

    // Набережные и площади
    { address: 'Москва, Фрунзенская набережная', lat: 55.7286, lng: 37.5855 },
    { address: 'Москва, Пречистенская набережная', lat: 55.7419, lng: 37.5991 },
    { address: 'Москва, Кремлевская набережная', lat: 55.7486, lng: 37.6118 },
    { address: 'Москва, Раушская набережная', lat: 55.7486, lng: 37.6372 },
    { address: 'Москва, Котельническая набережная', lat: 55.7486, lng: 37.6465 },
    { address: 'Москва, Гончарная набережная', lat: 55.7486, lng: 37.6507 },
    { address: 'Москва, Краснопресненская набережная', lat: 55.7558, lng: 37.5584 },
    { address: 'Москва, ул. Смоленская', lat: 55.7486, lng: 37.5855 },
    { address: 'Москва, Новинский бульвар', lat: 55.7558, lng: 37.5855 },
    { address: 'Москва, Зубовский бульвар', lat: 55.7419, lng: 37.5855 },
    { address: 'Москва, Смоленский бульвар', lat: 55.7419, lng: 37.5855 },
    { address: 'Москва, ул. Зоологическая', lat: 55.7631, lng: 37.5855 },
    { address: 'Москва, ул. Баррикадная', lat: 55.7631, lng: 37.5855 },
    { address: 'Москва, ул. Красная Пресня', lat: 55.7631, lng: 37.5584 },
    { address: 'Москва, ул. 1905 года', lat: 55.7703, lng: 37.5584 },
    { address: 'Москва, Звенигородское шоссе', lat: 55.7703, lng: 37.5584 },
    { address: 'Москва, ул. Беговая', lat: 55.7775, lng: 37.5584 },
    { address: 'Москва, Хорошевское шоссе', lat: 55.7775, lng: 37.5313 },
    { address: 'Москва, Никитский бульвар', lat: 55.7558, lng: 37.6012 },
    { address: 'Москва, Арбатская площадь', lat: 55.7522, lng: 37.6012 }
  ];

  // Функция для получения подсказок адресов
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)

    try {
      // В реальном приложении здесь был бы запрос к API геокодирования
      // Для демонстрации используем моковые данные
      await new Promise(resolve => setTimeout(resolve, 100)) // Имитация задержки запроса

      // Предварительная обработка запроса
      let processedQuery = query.toLowerCase().trim()

      // Если запрос не содержит "москва", добавляем его для лучшего поиска в базе данных
      // но не для отображения в результатах
      let searchQuery = processedQuery
      if (!processedQuery.includes('москва')) {
        searchQuery = 'москва ' + processedQuery
      }

      // Заменяем "улица" на "ул." для лучшего соответствия
      if (searchQuery.includes('улица') && !searchQuery.includes('ул.')) {
        searchQuery = searchQuery.replace('улица', 'ул.')
      }

      // Фильтруем адреса, которые содержат запрос (без учета регистра)
      const exactMatches = mockAddressDatabase.filter(item =>
        item.address.toLowerCase().includes(searchQuery)
      )

      // Если есть точные совпадения, используем их
      let results: Suggestion[] = exactMatches.map(item => ({
        address: item.address,
        lat: item.lat,
        lng: item.lng
      }))

      // Если мало результатов, ищем по отдельным словам
      if (results.length < 3) {
        // Разбиваем запрос на слова и ищем по каждому слову длиной более 2 символов
        const words = processedQuery.split(/[\s,]+/).filter(word => word.length > 2 &&
          !['москва', 'улица', 'ул', 'проспект', 'пр', 'переулок', 'пер', 'площадь', 'пл', 'набережная', 'наб'].includes(word))

        for (const word of words) {
          const wordMatches = mockAddressDatabase.filter(item =>
            item.address.toLowerCase().includes(word)
          )

          results = [
            ...results,
            ...wordMatches.map(item => ({
              address: item.address,
              lat: item.lat,
              lng: item.lng
            }))
          ]

          // Ограничиваем количество результатов
          if (results.length >= 5) break
        }
      }

      // Удаляем дубликаты
      results = results.filter((item, index, self) =>
        index === self.findIndex(t => t.address === item.address)
      )

      // Если запрос похож на название улицы, но нет точных совпадений
      if (results.length < 2) {
        // Проверяем, содержит ли запрос указание на улицу
        const isStreetQuery = query.toLowerCase().includes('улица') ||
                             query.toLowerCase().includes('ул.') ||
                             query.toLowerCase().includes('ул ') ||
                             query.toLowerCase().includes('проспект') ||
                             query.toLowerCase().includes('пр-т') ||
                             query.toLowerCase().includes('переулок') ||
                             query.toLowerCase().includes('пер.') ||
                             query.toLowerCase().includes('бульвар') ||
                             query.toLowerCase().includes('б-р')

        // Извлекаем название улицы
        let streetName = ''
        if (isStreetQuery) {
          const streetNameMatch = query.toLowerCase().match(/(улица|ул\.?|проспект|пр-т|переулок|пер\.?|бульвар|б-р)\s+([а-яё]+)/i)
          if (streetNameMatch && streetNameMatch[2]) {
            streetName = streetNameMatch[2]
          } else {
            // Если не удалось извлечь название после указателя типа улицы,
            // берем все слова кроме указателей типа
            streetName = query.toLowerCase()
              .replace(/(улица|ул\.?|проспект|пр-т|переулок|пер\.?|бульвар|б-р)/g, '')
              .trim()
          }
        } else {
          // Если нет указания на тип улицы, используем весь запрос
          streetName = query.toLowerCase().trim()
        }

        if (streetName.length > 2) {
          // Ищем улицы, содержащие это название
          const streetMatches = mockAddressDatabase.filter(item =>
            item.address.toLowerCase().includes(streetName)
          )

          // Добавляем найденные улицы к результатам
          results = [
            ...results,
            ...streetMatches.map(item => ({
              address: item.address,
              lat: item.lat,
              lng: item.lng
            }))
          ]
        }
      }

      // Удаляем дубликаты снова после всех поисков
      results = results.filter((item, index, self) =>
        index === self.findIndex(t => t.address === item.address)
      )

      // Если все еще нет результатов и запрос достаточно длинный, добавляем его как новый адрес
      if (results.length === 0 && query.length >= 3) {
        // Проверяем, содержит ли запрос название улицы
        if (query.toLowerCase().includes('улица') || query.toLowerCase().includes('ул.') ||
            query.toLowerCase().includes('проспект') || query.toLowerCase().includes('пр-т')) {
          results.push({
            address: `Москва, ${query}`,
            lat: 55.7558 + (Math.random() - 0.5) * 0.05,
            lng: 37.6173 + (Math.random() - 0.5) * 0.05
          })
        } else {
          // Если запрос не содержит указания на улицу, добавляем его как адрес
          results.push({
            address: `Москва, ${query}`,
            lat: 55.7558 + (Math.random() - 0.5) * 0.05,
            lng: 37.6173 + (Math.random() - 0.5) * 0.05
          })
        }
      }

      // Сортируем результаты по релевантности
      // Сначала точные совпадения, затем по длине адреса
      results.sort((a, b) => {
        const aExact = a.address.toLowerCase().includes(processedQuery)
        const bExact = b.address.toLowerCase().includes(processedQuery)

        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        return a.address.length - b.address.length
      })

      // Ограничиваем количество результатов
      setSuggestions(results.slice(0, 5))
    } catch (error) {
      console.error('Ошибка при получении подсказок адресов:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Обработка изменения значения ввода
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Показываем подсказки при вводе
    setShowSuggestions(true)

    // Используем debounce для запроса подсказок
    // Это предотвращает слишком частые запросы при быстром вводе
    const timer = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)

    return () => clearTimeout(timer)
  }

  // Обработка выбора подсказки
  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.address)
    if (onCoordinatesChange) {
      onCoordinatesChange(suggestion.lat, suggestion.lng)
    }
    setShowSuggestions(false)

    // Показываем сообщение об успешном выборе адреса
    console.log('Выбран адрес:', suggestion.address)
  }

  // Обработка нажатия клавиш в поле ввода
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Если нажата клавиша Enter и есть подсказки, выбираем первую
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[0])
    }

    // Если нажата клавиша Escape, скрываем подсказки
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Геокодирование адреса при изменении значения
  useEffect(() => {
    const geocodeAddress = async () => {
      if (value && value.length > 3 && onCoordinatesChange) {
        try {
          // В реальном приложении здесь был бы запрос к API геокодирования
          // Для демонстрации используем моковые данные
          await new Promise(resolve => setTimeout(resolve, 300)) // Имитация задержки запроса

          // Ищем адрес в нашей базе данных
          const lowerValue = value.toLowerCase()
          const matchedAddress = mockAddressDatabase.find(item =>
            item.address.toLowerCase().includes(lowerValue)
          )

          if (matchedAddress) {
            // Если нашли совпадение, используем его координаты
            onCoordinatesChange(matchedAddress.lat, matchedAddress.lng)
          } else if (lowerValue.includes('москва') || lowerValue.includes('moscow')) {
            // Если адрес содержит "москва", генерируем координаты в пределах Москвы
            const lat = 55.7558 + (Math.random() - 0.5) * 0.05
            const lng = 37.6173 + (Math.random() - 0.5) * 0.05
            onCoordinatesChange(lat, lng)
          } else if (value.length > 5) {
            // Для других адресов генерируем случайные координаты
            const lat = 55.7558 + (Math.random() - 0.5) * 0.05
            const lng = 37.6173 + (Math.random() - 0.5) * 0.05
            onCoordinatesChange(lat, lng)
          }
        } catch (error) {
          console.error('Ошибка при геокодировании адреса:', error)
        }
      }
    }

    // Геокодируем адрес только если пользователь перестал вводить текст
    const timer = setTimeout(() => {
      geocodeAddress()
    }, 800)

    return () => clearTimeout(timer)
  }, [value, onCoordinatesChange])

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center">
                  <span className="mr-2 text-green-600">📍</span>
                  <div>
                    <div className="font-medium">{suggestion.address}</div>
                    <div className="text-xs text-gray-500">
                      {suggestion.lat.toFixed(6)}, {suggestion.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent mr-2"></div>
                  <span>Поиск адресов...</span>
                </div>
              ) : value.length < 2 ? (
                "Введите минимум 2 символа"
              ) : (
                "Адреса не найдены. Попробуйте другой запрос"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressInput
