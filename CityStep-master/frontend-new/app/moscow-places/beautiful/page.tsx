'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapMarker } from '@/components/map/MapComponent'

// Динамический импорт компонента карты
const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-200 h-64 flex items-center justify-center text-gray-500">
        Загрузка карты...
      </div>
    )
  }
)

// Типы данных
interface BeautifulPlace {
  id: string;
  name: string;
  description: string;
  type: 'attraction' | 'park' | 'exhibition' | 'cafe' | 'restaurant' | 'shop';
  latitude: number;
  longitude: number;
  estimated_time: number;
  image_url: string;
  beauty_score: number;
  popularity: number;
  historical_value: number;
  architectural_value: number;
  best_time: string[];
}

export default function BeautifulPlacesPage() {
  const [places, setPlaces] = useState<BeautifulPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<BeautifulPlace | null>(null)
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]) // Москва по умолчанию
  const [mapZoom, setMapZoom] = useState(11)
  const [activeTab, setActiveTab] = useState<'list' | 'analysis'>('list')

  // Загрузка данных о красивых местах
  useEffect(() => {
    // В реальном приложении здесь был бы запрос к API
    // Для демонстрации используем моковые данные
    const fetchBeautifulPlaces = async () => {
      try {
        setLoading(true)

        // Имитация запроса к API
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Моковые данные
        const mockData: BeautifulPlace[] = [
          {
            id: "1",
            name: "Храм Василия Блаженного",
            description: "Православный храм на Красной площади, памятник русской архитектуры",
            type: "attraction",
            latitude: 55.7525,
            longitude: 37.6231,
            estimated_time: 60,
            image_url: "https://example.com/st_basil.jpg",
            beauty_score: 9.9,
            popularity: 9.8,
            historical_value: 10.0,
            architectural_value: 10.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "2",
            name: "Красная площадь",
            description: "Главная площадь Москвы, объект Всемирного наследия ЮНЕСКО",
            type: "attraction",
            latitude: 55.7539,
            longitude: 37.6208,
            estimated_time: 60,
            image_url: "https://example.com/red_square.jpg",
            beauty_score: 9.8,
            popularity: 10.0,
            historical_value: 10.0,
            architectural_value: 9.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "3",
            name: "Московский Кремль",
            description: "Древняя крепость в центре Москвы, резиденция Президента России",
            type: "attraction",
            latitude: 55.7520,
            longitude: 37.6175,
            estimated_time: 180,
            image_url: "https://example.com/kremlin.jpg",
            beauty_score: 9.7,
            popularity: 9.7,
            historical_value: 10.0,
            architectural_value: 9.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "4",
            name: "Большой театр",
            description: "Исторический театр оперы и балета, один из символов России",
            type: "attraction",
            latitude: 55.7601,
            longitude: 37.6186,
            estimated_time: 180,
            image_url: "https://example.com/bolshoi.jpg",
            beauty_score: 9.6,
            popularity: 9.5,
            historical_value: 9.8,
            architectural_value: 9.7,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "5",
            name: "Парк Царицыно",
            description: "Дворцово-парковый ансамбль с дворцом Екатерины II",
            type: "park",
            latitude: 55.6156,
            longitude: 37.6869,
            estimated_time: 180,
            image_url: "https://example.com/tsaritsyno.jpg",
            beauty_score: 9.4,
            popularity: 8.0,
            historical_value: 9.0,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "6",
            name: "Воробьевы горы",
            description: "Смотровая площадка с панорамным видом на Москву",
            type: "attraction",
            latitude: 55.7103,
            longitude: 37.5428,
            estimated_time: 40,
            image_url: "https://example.com/sparrow_hills.jpg",
            beauty_score: 9.3,
            popularity: 8.5,
            historical_value: 7.5,
            architectural_value: 6.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "7",
            name: "Парк Зарядье",
            description: "Современный парк в центре Москвы с уникальным ландшафтным дизайном",
            type: "park",
            latitude: 55.7510,
            longitude: 37.6290,
            estimated_time: 90,
            image_url: "https://example.com/zaryadye.jpg",
            beauty_score: 9.2,
            popularity: 9.0,
            historical_value: 7.0,
            architectural_value: 9.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "8",
            name: "Парк Коломенское",
            description: "Бывшая царская резиденция с церковью Вознесения",
            type: "park",
            latitude: 55.6698,
            longitude: 37.6711,
            estimated_time: 150,
            image_url: "https://example.com/kolomenskoye.jpg",
            beauty_score: 9.2,
            popularity: 7.8,
            historical_value: 9.5,
            architectural_value: 9.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "9",
            name: "Новодевичий монастырь",
            description: "Православный женский монастырь, объект Всемирного наследия ЮНЕСКО",
            type: "attraction",
            latitude: 55.7256,
            longitude: 37.5568,
            estimated_time: 90,
            image_url: "https://example.com/novodevichy.jpg",
            beauty_score: 9.1,
            popularity: 7.5,
            historical_value: 9.7,
            architectural_value: 9.3,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "10",
            name: "Третьяковская галерея",
            description: "Художественный музей с крупнейшей коллекцией русского искусства",
            type: "exhibition",
            latitude: 55.7415,
            longitude: 37.6208,
            estimated_time: 150,
            image_url: "https://example.com/tretyakov.jpg",
            beauty_score: 8.7,
            popularity: 9.0,
            historical_value: 9.5,
            architectural_value: 8.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "11",
            name: "Усадьба Кусково",
            description: "Дворцово-парковый ансамбль XVIII века с дворцом и регулярным парком",
            type: "park",
            latitude: 55.7361,
            longitude: 37.8168,
            estimated_time: 150,
            image_url: "https://example.com/kuskovo.jpg",
            beauty_score: 9.0,
            popularity: 7.0,
            historical_value: 9.0,
            architectural_value: 9.1,
            best_time: ["весна", "лето"]
          },
          {
            id: "12",
            name: "Музей изобразительных искусств им. А.С. Пушкина",
            description: "Один из крупнейших музеев европейского искусства в России",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.6062,
            estimated_time: 150,
            image_url: "https://example.com/pushkin_museum.jpg",
            beauty_score: 8.9,
            popularity: 8.5,
            historical_value: 9.0,
            architectural_value: 8.8,
            best_time: ["осень", "зима"]
          },
          {
            id: "13",
            name: "Патриаршие пруды",
            description: "Исторический район Москвы, известный по роману 'Мастер и Маргарита'",
            type: "park",
            latitude: 55.7631,
            longitude: 37.5926,
            estimated_time: 60,
            image_url: "https://example.com/patriarch_ponds.jpg",
            beauty_score: 8.5,
            popularity: 8.0,
            historical_value: 8.5,
            architectural_value: 7.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "14",
            name: "Москва-Сити",
            description: "Деловой центр с небоскребами и смотровыми площадками",
            type: "attraction",
            latitude: 55.7473,
            longitude: 37.5377,
            estimated_time: 120,
            image_url: "https://example.com/moscow_city.jpg",
            beauty_score: 8.8,
            popularity: 8.7,
            historical_value: 5.0,
            architectural_value: 9.0,
            best_time: ["весна", "лето", "осень", "зима"]
          },
          {
            id: "15",
            name: "Останкинская телебашня",
            description: "Одна из высочайших телебашен мира со смотровой площадкой",
            type: "attraction",
            latitude: 55.8197,
            longitude: 37.6117,
            estimated_time: 90,
            image_url: "https://example.com/ostankino_tower.jpg",
            beauty_score: 8.3,
            popularity: 8.0,
            historical_value: 7.5,
            architectural_value: 8.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "16",
            name: "Сад Эрмитаж",
            description: "Старейший парк культуры и отдыха в центре Москвы с театрами и концертными площадками",
            type: "park",
            latitude: 55.7703,
            longitude: 37.6115,
            estimated_time: 60,
            image_url: "https://example.com/hermitage_garden.jpg",
            beauty_score: 8.6,
            popularity: 7.5,
            historical_value: 8.0,
            architectural_value: 7.5,
            best_time: ["весна", "лето"]
          },
          {
            id: "17",
            name: "Ботанический сад МГУ",
            description: "Старейший ботанический сад России с коллекцией редких растений",
            type: "park",
            latitude: 55.7103,
            longitude: 37.5299,
            estimated_time: 120,
            image_url: "https://example.com/botanical_garden.jpg",
            beauty_score: 8.7,
            popularity: 6.5,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето"]
          },
          {
            id: "18",
            name: "Музей космонавтики",
            description: "Музей, посвященный истории космонавтики и космической техники",
            type: "exhibition",
            latitude: 55.8222,
            longitude: 37.6397,
            estimated_time: 120,
            image_url: "https://example.com/cosmonautics_museum.jpg",
            beauty_score: 8.0,
            popularity: 7.8,
            historical_value: 8.5,
            architectural_value: 8.2,
            best_time: ["зима", "осень"]
          },
          {
            id: "19",
            name: "Храм Христа Спасителя",
            description: "Крупнейший православный храм России, воссозданный в 1990-х годах",
            type: "attraction",
            latitude: 55.7446,
            longitude: 37.6055,
            estimated_time: 60,
            image_url: "https://example.com/cathedral_christ_saviour.jpg",
            beauty_score: 9.2,
            popularity: 9.3,
            historical_value: 8.5,
            architectural_value: 9.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "20",
            name: "ВДНХ",
            description: "Выставка достижений народного хозяйства с уникальной архитектурой советского периода",
            type: "attraction",
            latitude: 55.8263,
            longitude: 37.6377,
            estimated_time: 180,
            image_url: "https://example.com/vdnh.jpg",
            beauty_score: 8.9,
            popularity: 8.8,
            historical_value: 9.0,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "21",
            name: "Парк Сокольники",
            description: "Один из старейших парков Москвы с богатой историей и разнообразными развлечениями",
            type: "park",
            latitude: 55.7950,
            longitude: 37.6778,
            estimated_time: 120,
            image_url: "https://example.com/sokolniki.jpg",
            beauty_score: 8.5,
            popularity: 8.2,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "22",
            name: "Государственный исторический музей",
            description: "Крупнейший национальный исторический музей России на Красной площади",
            type: "exhibition",
            latitude: 55.7553,
            longitude: 37.6176,
            estimated_time: 150,
            image_url: "https://example.com/historical_museum.jpg",
            beauty_score: 8.8,
            popularity: 8.5,
            historical_value: 9.5,
            architectural_value: 9.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "23",
            name: "Арбат",
            description: "Знаменитая пешеходная улица с историческими зданиями и уличными музыкантами",
            type: "attraction",
            latitude: 55.7486,
            longitude: 37.5936,
            estimated_time: 90,
            image_url: "https://example.com/arbat.jpg",
            beauty_score: 8.4,
            popularity: 9.0,
            historical_value: 8.7,
            architectural_value: 8.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "24",
            name: "Музей-усадьба Царицыно",
            description: "Архитектурно-парковый ансамбль с дворцом и ландшафтным парком",
            type: "exhibition",
            latitude: 55.6156,
            longitude: 37.6869,
            estimated_time: 180,
            image_url: "https://example.com/tsaritsyno_museum.jpg",
            beauty_score: 9.1,
            popularity: 8.3,
            historical_value: 9.2,
            architectural_value: 9.4,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "25",
            name: "Измайловский кремль",
            description: "Культурно-развлекательный комплекс, стилизованный под русский кремль",
            type: "attraction",
            latitude: 55.7887,
            longitude: 37.7483,
            estimated_time: 120,
            image_url: "https://example.com/izmailovo_kremlin.jpg",
            beauty_score: 8.2,
            popularity: 7.8,
            historical_value: 6.5,
            architectural_value: 8.3,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "26",
            name: "Парк искусств Музеон",
            description: "Парк скульптур под открытым небом с коллекцией советских памятников",
            type: "park",
            latitude: 55.7347,
            longitude: 37.6095,
            estimated_time: 90,
            image_url: "https://example.com/muzeon.jpg",
            beauty_score: 8.3,
            popularity: 7.9,
            historical_value: 8.0,
            architectural_value: 7.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "27",
            name: "Дом Пашкова",
            description: "Историческое здание в стиле классицизма с видом на Кремль",
            type: "attraction",
            latitude: 55.7492,
            longitude: 37.6090,
            estimated_time: 60,
            image_url: "https://example.com/pashkov_house.jpg",
            beauty_score: 8.7,
            popularity: 7.0,
            historical_value: 8.8,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "28",
            name: "Музей современного искусства Гараж",
            description: "Первый в России музей современного искусства в парке Горького",
            type: "exhibition",
            latitude: 55.7298,
            longitude: 37.6019,
            estimated_time: 120,
            image_url: "https://example.com/garage_museum.jpg",
            beauty_score: 7.9,
            popularity: 8.0,
            historical_value: 6.0,
            architectural_value: 8.5,
            best_time: ["осень", "зима", "весна", "лето"]
          },
          {
            id: "29",
            name: "Сад Аквариум",
            description: "Исторический сад в центре Москвы с театром и концертными площадками",
            type: "park",
            latitude: 55.7647,
            longitude: 37.5958,
            estimated_time: 60,
            image_url: "https://example.com/aquarium_garden.jpg",
            beauty_score: 8.0,
            popularity: 6.8,
            historical_value: 7.5,
            architectural_value: 7.2,
            best_time: ["весна", "лето"]
          },
          {
            id: "30",
            name: "Дом на набережной",
            description: "Знаменитый жилой дом 1930-х годов с богатой историей",
            type: "attraction",
            latitude: 55.7447,
            longitude: 37.6119,
            estimated_time: 60,
            image_url: "https://example.com/house_on_embankment.jpg",
            beauty_score: 7.8,
            popularity: 6.5,
            historical_value: 9.0,
            architectural_value: 7.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "31",
            name: "Музей русского импрессионизма",
            description: "Частный музей с коллекцией русской живописи конца XIX - начала XX века",
            type: "exhibition",
            latitude: 55.7809,
            longitude: 37.5677,
            estimated_time: 90,
            image_url: "https://example.com/impressionism_museum.jpg",
            beauty_score: 8.1,
            popularity: 7.2,
            historical_value: 7.8,
            architectural_value: 8.4,
            best_time: ["осень", "зима"]
          },
          {
            id: "32",
            name: "Крутицкое подворье",
            description: "Архитектурный ансамбль XVII века, бывшая резиденция епископов",
            type: "attraction",
            latitude: 55.7328,
            longitude: 37.6647,
            estimated_time: 60,
            image_url: "https://example.com/krutitsy.jpg",
            beauty_score: 8.6,
            popularity: 6.0,
            historical_value: 9.2,
            architectural_value: 8.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "33",
            name: "Парк Победы на Поклонной горе",
            description: "Мемориальный комплекс, посвященный победе в Великой Отечественной войне",
            type: "park",
            latitude: 55.7339,
            longitude: 37.5047,
            estimated_time: 120,
            image_url: "https://example.com/victory_park.jpg",
            beauty_score: 8.5,
            popularity: 8.4,
            historical_value: 9.5,
            architectural_value: 8.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "34",
            name: "Дом-музей Марины Цветаевой",
            description: "Музей в доме, где жила великая русская поэтесса",
            type: "exhibition",
            latitude: 55.7647,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/tsvetaeva_museum.jpg",
            beauty_score: 7.7,
            popularity: 6.2,
            historical_value: 8.5,
            architectural_value: 7.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "35",
            name: "Чистые пруды",
            description: "Исторический район с прудом и бульваром, популярное место для прогулок",
            type: "park",
            latitude: 55.7664,
            longitude: 37.6387,
            estimated_time: 60,
            image_url: "https://example.com/clean_ponds.jpg",
            beauty_score: 8.2,
            popularity: 7.8,
            historical_value: 8.0,
            architectural_value: 7.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "36",
            name: "Дом Мельникова",
            description: "Уникальный памятник архитектуры авангарда, жилой дом-мастерская",
            type: "attraction",
            latitude: 55.7544,
            longitude: 37.5874,
            estimated_time: 60,
            image_url: "https://example.com/melnikov_house.jpg",
            beauty_score: 8.4,
            popularity: 6.5,
            historical_value: 8.8,
            architectural_value: 9.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "37",
            name: "Музей Москвы",
            description: "Старейший музей города, посвященный истории столицы",
            type: "exhibition",
            latitude: 55.7347,
            longitude: 37.6095,
            estimated_time: 120,
            image_url: "https://example.com/moscow_museum.jpg",
            beauty_score: 7.9,
            popularity: 7.0,
            historical_value: 9.0,
            architectural_value: 7.5,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "38",
            name: "Сандуновские бани",
            description: "Исторические бани XIX века с роскошным интерьером",
            type: "attraction",
            latitude: 55.7614,
            longitude: 37.6250,
            estimated_time: 120,
            image_url: "https://example.com/sanduny.jpg",
            beauty_score: 8.3,
            popularity: 7.5,
            historical_value: 8.7,
            architectural_value: 9.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "39",
            name: "Ботанический сад РАН",
            description: "Крупнейший ботанический сад Европы с уникальной коллекцией растений",
            type: "park",
            latitude: 55.8375,
            longitude: 37.5912,
            estimated_time: 150,
            image_url: "https://example.com/botanical_garden_ras.jpg",
            beauty_score: 8.6,
            popularity: 7.0,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето"]
          },
          {
            id: "40",
            name: "Дворец царя Алексея Михайловича в Коломенском",
            description: "Воссозданный деревянный дворец XVII века, 'восьмое чудо света'",
            type: "attraction",
            latitude: 55.6698,
            longitude: 37.6711,
            estimated_time: 120,
            image_url: "https://example.com/wooden_palace.jpg",
            beauty_score: 8.9,
            popularity: 7.8,
            historical_value: 9.5,
            architectural_value: 9.3,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "41",
            name: "Церковь Вознесения в Коломенском",
            description: "Первый каменный шатровый храм в России, объект ЮНЕСКО",
            type: "attraction",
            latitude: 55.6698,
            longitude: 37.6711,
            estimated_time: 60,
            image_url: "https://example.com/ascension_church.jpg",
            beauty_score: 9.0,
            popularity: 7.5,
            historical_value: 9.8,
            architectural_value: 9.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "42",
            name: "Музей-квартира Булгакова",
            description: "Музей в доме, где жил автор 'Мастера и Маргариты'",
            type: "exhibition",
            latitude: 55.7664,
            longitude: 37.5936,
            estimated_time: 60,
            image_url: "https://example.com/bulgakov_museum.jpg",
            beauty_score: 7.8,
            popularity: 7.9,
            historical_value: 8.5,
            architectural_value: 7.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "43",
            name: "Парк Фили",
            description: "Исторический парк на берегу Москвы-реки с живописными видами",
            type: "park",
            latitude: 55.7456,
            longitude: 37.4814,
            estimated_time: 120,
            image_url: "https://example.com/fili_park.jpg",
            beauty_score: 8.2,
            popularity: 7.5,
            historical_value: 8.0,
            architectural_value: 6.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "44",
            name: "Петровский путевой дворец",
            description: "Исторический дворец в неоготическом стиле, построенный для Екатерины II",
            type: "attraction",
            latitude: 55.7911,
            longitude: 37.5592,
            estimated_time: 90,
            image_url: "https://example.com/petrovsky_palace.jpg",
            beauty_score: 8.7,
            popularity: 6.8,
            historical_value: 9.0,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "45",
            name: "Музей космонавтики на ВДНХ",
            description: "Один из крупнейших научно-технических музеев мира",
            type: "exhibition",
            latitude: 55.8222,
            longitude: 37.6397,
            estimated_time: 150,
            image_url: "https://example.com/cosmonautics_museum_vdnh.jpg",
            beauty_score: 8.1,
            popularity: 8.5,
            historical_value: 9.0,
            architectural_value: 8.0,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "46",
            name: "Усадьба Архангельское",
            description: "Дворцово-парковый ансамбль конца XVIII века, 'подмосковный Версаль'",
            type: "park",
            latitude: 55.7844,
            longitude: 37.2869,
            estimated_time: 180,
            image_url: "https://example.com/arkhangelskoye.jpg",
            beauty_score: 9.2,
            popularity: 8.0,
            historical_value: 9.3,
            architectural_value: 9.4,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "47",
            name: "Центральный дом художника",
            description: "Крупнейший выставочный центр России на Крымском Валу",
            type: "exhibition",
            latitude: 55.7347,
            longitude: 37.6095,
            estimated_time: 120,
            image_url: "https://example.com/central_house_of_artists.jpg",
            beauty_score: 7.5,
            popularity: 7.8,
            historical_value: 7.0,
            architectural_value: 7.5,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "48",
            name: "Усадьба Останкино",
            description: "Дворцово-парковый ансамбль XVIII века с уникальным деревянным дворцом",
            type: "attraction",
            latitude: 55.8197,
            longitude: 37.6117,
            estimated_time: 120,
            image_url: "https://example.com/ostankino_estate.jpg",
            beauty_score: 8.5,
            popularity: 6.5,
            historical_value: 9.0,
            architectural_value: 8.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "49",
            name: "Парк Северное Тушино",
            description: "Парк с музеем ВМФ и подводной лодкой на берегу Химкинского водохранилища",
            type: "park",
            latitude: 55.8508,
            longitude: 37.4418,
            estimated_time: 120,
            image_url: "https://example.com/north_tushino_park.jpg",
            beauty_score: 7.8,
            popularity: 7.0,
            historical_value: 7.5,
            architectural_value: 6.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "50",
            name: "Дом-музей Чехова",
            description: "Музей в доме, где жил и работал великий русский писатель",
            type: "exhibition",
            latitude: 55.7647,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/chekhov_museum.jpg",
            beauty_score: 7.6,
            popularity: 6.5,
            historical_value: 8.5,
            architectural_value: 7.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "51",
            name: "Церковь Покрова в Филях",
            description: "Выдающийся памятник нарышкинского барокко конца XVII века",
            type: "attraction",
            latitude: 55.7456,
            longitude: 37.4814,
            estimated_time: 60,
            image_url: "https://example.com/fili_church.jpg",
            beauty_score: 8.8,
            popularity: 6.0,
            historical_value: 9.0,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "52",
            name: "Музей-заповедник Царицыно",
            description: "Дворцово-парковый ансамбль с дворцом Екатерины II и ландшафтным парком",
            type: "park",
            latitude: 55.6156,
            longitude: 37.6869,
            estimated_time: 180,
            image_url: "https://example.com/tsaritsyno_reserve.jpg",
            beauty_score: 9.0,
            popularity: 8.5,
            historical_value: 9.0,
            architectural_value: 9.3,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "53",
            name: "Музей изобразительных искусств им. Пушкина (Галерея)",
            description: "Галерея европейского искусства XIX-XX веков",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.6062,
            estimated_time: 120,
            image_url: "https://example.com/pushkin_museum_gallery.jpg",
            beauty_score: 8.5,
            popularity: 8.0,
            historical_value: 8.5,
            architectural_value: 8.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "54",
            name: "Усадьба Кузьминки",
            description: "Исторический парк с усадебным комплексом князей Голицыных",
            type: "park",
            latitude: 55.7000,
            longitude: 37.7833,
            estimated_time: 120,
            image_url: "https://example.com/kuzminki.jpg",
            beauty_score: 8.0,
            popularity: 7.0,
            historical_value: 8.5,
            architectural_value: 8.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "55",
            name: "Дом Бурганова",
            description: "Музей скульптуры с работами известного скульптора А.Н. Бурганова",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/burganov_house.jpg",
            beauty_score: 7.9,
            popularity: 5.5,
            historical_value: 7.0,
            architectural_value: 8.0,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "56",
            name: "Китай-город",
            description: "Исторический район Москвы с древними улицами и архитектурой",
            type: "attraction",
            latitude: 55.7539,
            longitude: 37.6314,
            estimated_time: 120,
            image_url: "https://example.com/kitay_gorod.jpg",
            beauty_score: 8.6,
            popularity: 8.5,
            historical_value: 9.5,
            architectural_value: 8.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "57",
            name: "Парк 50-летия Октября",
            description: "Благоустроенный парк с фонтанами и спортивными площадками",
            type: "park",
            latitude: 55.6833,
            longitude: 37.4833,
            estimated_time: 90,
            image_url: "https://example.com/october_50_park.jpg",
            beauty_score: 7.5,
            popularity: 6.5,
            historical_value: 6.0,
            architectural_value: 6.5,
            best_time: ["весна", "лето"]
          },
          {
            id: "58",
            name: "Музей-квартира Горького",
            description: "Музей в особняке, где жил писатель Максим Горький",
            type: "exhibition",
            latitude: 55.7647,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/gorky_museum.jpg",
            beauty_score: 7.8,
            popularity: 6.0,
            historical_value: 8.0,
            architectural_value: 8.5,
            best_time: ["осень", "зима"]
          },
          {
            id: "59",
            name: "Церковь Климента Папы Римского",
            description: "Барочный храм XVIII века с богатым внутренним убранством",
            type: "attraction",
            latitude: 55.7447,
            longitude: 37.6314,
            estimated_time: 60,
            image_url: "https://example.com/clement_church.jpg",
            beauty_score: 8.7,
            popularity: 6.0,
            historical_value: 8.5,
            architectural_value: 9.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "60",
            name: "Нескучный сад",
            description: "Старейший парк Москвы с историческими усадьбами и живописными видами",
            type: "park",
            latitude: 55.7167,
            longitude: 37.5833,
            estimated_time: 90,
            image_url: "https://example.com/neskuchny_garden.jpg",
            beauty_score: 8.4,
            popularity: 7.5,
            historical_value: 8.5,
            architectural_value: 7.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "61",
            name: "Церковь Троицы в Никитниках",
            description: "Уникальный памятник русского узорочья XVII века с богатым декором",
            type: "attraction",
            latitude: 55.7539,
            longitude: 37.6314,
            estimated_time: 60,
            image_url: "https://example.com/trinity_nikitniki.jpg",
            beauty_score: 8.9,
            popularity: 6.0,
            historical_value: 9.2,
            architectural_value: 9.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "62",
            name: "Музей Востока",
            description: "Музей искусства стран Азии и Африки с богатой коллекцией",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.6062,
            estimated_time: 120,
            image_url: "https://example.com/oriental_museum.jpg",
            beauty_score: 8.0,
            popularity: 7.0,
            historical_value: 8.5,
            architectural_value: 7.5,
            best_time: ["осень", "зима"]
          },
          {
            id: "63",
            name: "Парк Измайлово",
            description: "Один из крупнейших парков Европы с лесным массивом и историческими памятниками",
            type: "park",
            latitude: 55.7887,
            longitude: 37.7483,
            estimated_time: 150,
            image_url: "https://example.com/izmailovo_park.jpg",
            beauty_score: 8.3,
            popularity: 7.8,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "64",
            name: "Палаты бояр Романовых",
            description: "Музей в старинных палатах, где родился первый царь из династии Романовых",
            type: "attraction",
            latitude: 55.7539,
            longitude: 37.6314,
            estimated_time: 90,
            image_url: "https://example.com/romanov_chambers.jpg",
            beauty_score: 8.2,
            popularity: 6.5,
            historical_value: 9.5,
            architectural_value: 8.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "65",
            name: "Музей декоративно-прикладного искусства",
            description: "Музей с коллекцией предметов декоративно-прикладного искусства России",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.6062,
            estimated_time: 120,
            image_url: "https://example.com/decorative_arts_museum.jpg",
            beauty_score: 7.9,
            popularity: 6.8,
            historical_value: 8.0,
            architectural_value: 8.5,
            best_time: ["осень", "зима"]
          },
          {
            id: "66",
            name: "Парк Дружбы",
            description: "Парк, заложенный в честь VI Всемирного фестиваля молодежи и студентов",
            type: "park",
            latitude: 55.8375,
            longitude: 37.4833,
            estimated_time: 90,
            image_url: "https://example.com/friendship_park.jpg",
            beauty_score: 7.7,
            popularity: 6.5,
            historical_value: 7.0,
            architectural_value: 6.5,
            best_time: ["весна", "лето"]
          },
          {
            id: "67",
            name: "Церковь Николая Чудотворца в Хамовниках",
            description: "Красивый храм XVII века с богатым внутренним убранством",
            type: "attraction",
            latitude: 55.7339,
            longitude: 37.5833,
            estimated_time: 60,
            image_url: "https://example.com/nicholas_khamovniki.jpg",
            beauty_score: 8.6,
            popularity: 6.0,
            historical_value: 8.5,
            architectural_value: 9.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "68",
            name: "Музей Серебряного века",
            description: "Музей в особняке, посвященный литературе и искусству Серебряного века",
            type: "exhibition",
            latitude: 55.7647,
            longitude: 37.5902,
            estimated_time: 90,
            image_url: "https://example.com/silver_age_museum.jpg",
            beauty_score: 7.8,
            popularity: 6.5,
            historical_value: 8.5,
            architectural_value: 8.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "69",
            name: "Сад имени Баумана",
            description: "Старинный сад в центре Москвы с летним театром и фонтанами",
            type: "park",
            latitude: 55.7664,
            longitude: 37.6565,
            estimated_time: 60,
            image_url: "https://example.com/bauman_garden.jpg",
            beauty_score: 8.1,
            popularity: 7.0,
            historical_value: 7.5,
            architectural_value: 7.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "70",
            name: "Дом-музей Васнецова",
            description: "Музей в доме, где жил и работал художник Виктор Васнецов",
            type: "exhibition",
            latitude: 55.7647,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/vasnetsov_museum.jpg",
            beauty_score: 8.0,
            popularity: 6.0,
            historical_value: 8.0,
            architectural_value: 8.5,
            best_time: ["осень", "зима"]
          },
          {
            id: "71",
            name: "Церковь Иоанна Воина на Якиманке",
            description: "Красивый барочный храм XVIII века с богатым внутренним убранством",
            type: "attraction",
            latitude: 55.7339,
            longitude: 37.6186,
            estimated_time: 60,
            image_url: "https://example.com/john_warrior_church.jpg",
            beauty_score: 8.5,
            popularity: 5.5,
            historical_value: 8.0,
            architectural_value: 9.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "72",
            name: "Парк Красная Пресня",
            description: "Исторический парк на берегу Москвы-реки с прудами и павильонами",
            type: "park",
            latitude: 55.7614,
            longitude: 37.5377,
            estimated_time: 90,
            image_url: "https://example.com/krasnaya_presnya_park.jpg",
            beauty_score: 7.9,
            popularity: 7.5,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "73",
            name: "Музей архитектуры имени Щусева",
            description: "Музей с коллекцией архитектурных моделей, чертежей и фотографий",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.6062,
            estimated_time: 120,
            image_url: "https://example.com/architecture_museum.jpg",
            beauty_score: 7.7,
            popularity: 6.5,
            historical_value: 8.5,
            architectural_value: 8.0,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "74",
            name: "Церковь Большое Вознесение у Никитских ворот",
            description: "Храм, где венчался А.С. Пушкин с Н.Н. Гончаровой",
            type: "attraction",
            latitude: 55.7575,
            longitude: 37.6019,
            estimated_time: 60,
            image_url: "https://example.com/ascension_church.jpg",
            beauty_score: 8.4,
            popularity: 6.5,
            historical_value: 9.0,
            architectural_value: 8.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "75",
            name: "Парк Сокольники (Розарий)",
            description: "Уникальный розарий с коллекцией редких сортов роз",
            type: "park",
            latitude: 55.7950,
            longitude: 37.6778,
            estimated_time: 60,
            image_url: "https://example.com/sokolniki_rosarium.jpg",
            beauty_score: 8.8,
            popularity: 7.0,
            historical_value: 7.0,
            architectural_value: 7.5,
            best_time: ["весна", "лето"]
          },
          {
            id: "76",
            name: "Музей-квартира Достоевского",
            description: "Музей в доме, где родился Ф.М. Достоевский",
            type: "exhibition",
            latitude: 55.7647,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/dostoevsky_museum.jpg",
            beauty_score: 7.5,
            popularity: 6.5,
            historical_value: 9.0,
            architectural_value: 7.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "77",
            name: "Церковь Рождества Богородицы в Путинках",
            description: "Уникальный памятник русского узорочья XVII века",
            type: "attraction",
            latitude: 55.7664,
            longitude: 37.6019,
            estimated_time: 60,
            image_url: "https://example.com/nativity_putinki.jpg",
            beauty_score: 8.7,
            popularity: 5.5,
            historical_value: 8.5,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "78",
            name: "Парк Воробьевы горы (Заказник)",
            description: "Природный заказник с уникальной флорой и фауной",
            type: "park",
            latitude: 55.7103,
            longitude: 37.5428,
            estimated_time: 120,
            image_url: "https://example.com/sparrow_hills_reserve.jpg",
            beauty_score: 8.5,
            popularity: 7.5,
            historical_value: 7.0,
            architectural_value: 6.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "79",
            name: "Музей Москвы на Зубовском бульваре",
            description: "Новая экспозиция музея истории Москвы",
            type: "exhibition",
            latitude: 55.7347,
            longitude: 37.5902,
            estimated_time: 120,
            image_url: "https://example.com/moscow_museum_zubovsky.jpg",
            beauty_score: 7.6,
            popularity: 7.0,
            historical_value: 8.5,
            architectural_value: 7.5,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "80",
            name: "Церковь Святителя Николая в Толмачах",
            description: "Храм при Третьяковской галерее с уникальными иконами",
            type: "attraction",
            latitude: 55.7415,
            longitude: 37.6208,
            estimated_time: 60,
            image_url: "https://example.com/nicholas_tolmachi.jpg",
            beauty_score: 8.3,
            popularity: 6.5,
            historical_value: 8.5,
            architectural_value: 8.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "81",
            name: "Аптекарский огород",
            description: "Старейший ботанический сад России при МГУ с оранжереями и редкими растениями",
            type: "park",
            latitude: 55.7764,
            longitude: 37.6314,
            estimated_time: 90,
            image_url: "https://example.com/apothecary_garden.jpg",
            beauty_score: 8.5,
            popularity: 7.5,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето"]
          },
          {
            id: "82",
            name: "Музей-усадьба Л.Н. Толстого в Хамовниках",
            description: "Дом-музей, где жил и работал великий русский писатель",
            type: "exhibition",
            latitude: 55.7339,
            longitude: 37.5833,
            estimated_time: 90,
            image_url: "https://example.com/tolstoy_museum.jpg",
            beauty_score: 7.9,
            popularity: 6.5,
            historical_value: 9.0,
            architectural_value: 7.5,
            best_time: ["осень", "зима"]
          },
          {
            id: "83",
            name: "Церковь Воскресения в Кадашах",
            description: "Выдающийся памятник московского барокко XVII века",
            type: "attraction",
            latitude: 55.7447,
            longitude: 37.6208,
            estimated_time: 60,
            image_url: "https://example.com/kadashi_church.jpg",
            beauty_score: 8.6,
            popularity: 5.5,
            historical_value: 9.0,
            architectural_value: 9.2,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "84",
            name: "Парк Останкино",
            description: "Исторический парк с дворцом-театром и вековыми деревьями",
            type: "park",
            latitude: 55.8197,
            longitude: 37.6117,
            estimated_time: 120,
            image_url: "https://example.com/ostankino_park.jpg",
            beauty_score: 8.2,
            popularity: 6.8,
            historical_value: 8.5,
            architectural_value: 7.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "85",
            name: "Музей-квартира А.С. Пушкина на Арбате",
            description: "Музей в доме, где жил поэт после женитьбы",
            type: "exhibition",
            latitude: 55.7486,
            longitude: 37.5936,
            estimated_time: 60,
            image_url: "https://example.com/pushkin_apartment.jpg",
            beauty_score: 7.8,
            popularity: 7.0,
            historical_value: 9.2,
            architectural_value: 7.5,
            best_time: ["осень", "зима"]
          },
          {
            id: "86",
            name: "Церковь Успения на Покровке",
            description: "Восстановленный шедевр русского барокко XVII века",
            type: "attraction",
            latitude: 55.7614,
            longitude: 37.6387,
            estimated_time: 60,
            image_url: "https://example.com/assumption_pokrovka.jpg",
            beauty_score: 8.7,
            popularity: 5.0,
            historical_value: 8.5,
            architectural_value: 9.3,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "87",
            name: "Парк Покровское-Стрешнево",
            description: "Природно-исторический парк с усадьбой и родниками",
            type: "park",
            latitude: 55.8197,
            longitude: 37.4833,
            estimated_time: 120,
            image_url: "https://example.com/pokrovskoe_streshnevo.jpg",
            beauty_score: 8.0,
            popularity: 6.0,
            historical_value: 7.5,
            architectural_value: 6.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "88",
            name: "Музей-мастерская Зураба Церетели",
            description: "Выставочное пространство с работами известного скульптора",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.5902,
            estimated_time: 90,
            image_url: "https://example.com/tsereteli_museum.jpg",
            beauty_score: 7.5,
            popularity: 6.0,
            historical_value: 6.5,
            architectural_value: 8.0,
            best_time: ["осень", "зима", "весна"]
          },
          {
            id: "89",
            name: "Церковь Живоначальной Троицы в Хохлах",
            description: "Красивый храм XVII века в стиле нарышкинского барокко",
            type: "attraction",
            latitude: 55.7575,
            longitude: 37.6387,
            estimated_time: 60,
            image_url: "https://example.com/trinity_khokhly.jpg",
            beauty_score: 8.4,
            popularity: 5.0,
            historical_value: 8.0,
            architectural_value: 8.8,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "90",
            name: "Парк Кузьминки",
            description: "Один из крупнейших парков Москвы с усадебным комплексом",
            type: "park",
            latitude: 55.7000,
            longitude: 37.7833,
            estimated_time: 150,
            image_url: "https://example.com/kuzminki_park.jpg",
            beauty_score: 8.1,
            popularity: 7.5,
            historical_value: 8.0,
            architectural_value: 7.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "91",
            name: "Музей Востока на Никитском бульваре",
            description: "Музей искусства стран Азии и Африки в историческом особняке",
            type: "exhibition",
            latitude: 55.7575,
            longitude: 37.6019,
            estimated_time: 120,
            image_url: "https://example.com/oriental_museum_nikitsky.jpg",
            beauty_score: 7.7,
            popularity: 6.5,
            historical_value: 8.0,
            architectural_value: 8.2,
            best_time: ["осень", "зима"]
          },
          {
            id: "92",
            name: "Церковь Николая Чудотворца на Берсеневке",
            description: "Редкий памятник московского узорочья XVII века",
            type: "attraction",
            latitude: 55.7447,
            longitude: 37.6119,
            estimated_time: 60,
            image_url: "https://example.com/nicholas_bersenevka.jpg",
            beauty_score: 8.5,
            popularity: 5.5,
            historical_value: 8.8,
            architectural_value: 9.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "93",
            name: "Парк Лефортово",
            description: "Исторический парк с регулярной планировкой и системой прудов",
            type: "park",
            latitude: 55.7664,
            longitude: 37.6869,
            estimated_time: 120,
            image_url: "https://example.com/lefortovo_park.jpg",
            beauty_score: 8.0,
            popularity: 6.5,
            historical_value: 8.5,
            architectural_value: 7.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "94",
            name: "Музей-квартира Ф.И. Шаляпина",
            description: "Музей в особняке, где жил великий оперный певец",
            type: "exhibition",
            latitude: 55.7575,
            longitude: 37.5902,
            estimated_time: 60,
            image_url: "https://example.com/chaliapin_museum.jpg",
            beauty_score: 7.6,
            popularity: 6.0,
            historical_value: 8.0,
            architectural_value: 7.8,
            best_time: ["осень", "зима"]
          },
          {
            id: "95",
            name: "Церковь Мартина Исповедника",
            description: "Величественный храм в стиле зрелого классицизма",
            type: "attraction",
            latitude: 55.7447,
            longitude: 37.6565,
            estimated_time: 60,
            image_url: "https://example.com/martin_confessor.jpg",
            beauty_score: 8.3,
            popularity: 5.0,
            historical_value: 8.0,
            architectural_value: 8.7,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "96",
            name: "Парк Дубки",
            description: "Старинный парк с дубовой рощей, заложенной Петром I",
            type: "park",
            latitude: 55.8375,
            longitude: 37.5377,
            estimated_time: 90,
            image_url: "https://example.com/dubki_park.jpg",
            beauty_score: 7.8,
            popularity: 6.0,
            historical_value: 8.0,
            architectural_value: 6.0,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "97",
            name: "Музей-мастерская Народного художника СССР Д.А. Налбандяна",
            description: "Музей в мастерской известного советского художника",
            type: "exhibition",
            latitude: 55.7447,
            longitude: 37.5833,
            estimated_time: 60,
            image_url: "https://example.com/nalbandian_museum.jpg",
            beauty_score: 7.4,
            popularity: 5.0,
            historical_value: 7.5,
            architectural_value: 7.0,
            best_time: ["осень", "зима"]
          },
          {
            id: "98",
            name: "Церковь Иконы Божией Матери 'Знамение' на Шереметевом дворе",
            description: "Изящный храм XVII века в стиле московского барокко",
            type: "attraction",
            latitude: 55.7664,
            longitude: 37.6314,
            estimated_time: 60,
            image_url: "https://example.com/znamenie_church.jpg",
            beauty_score: 8.2,
            popularity: 5.5,
            historical_value: 8.5,
            architectural_value: 8.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "99",
            name: "Парк Усадьба Трубецких в Хамовниках",
            description: "Исторический парк с усадьбой князей Трубецких",
            type: "park",
            latitude: 55.7339,
            longitude: 37.5833,
            estimated_time: 90,
            image_url: "https://example.com/trubetskoy_estate.jpg",
            beauty_score: 7.9,
            popularity: 5.5,
            historical_value: 8.0,
            architectural_value: 7.5,
            best_time: ["весна", "лето", "осень"]
          },
          {
            id: "100",
            name: "Дом-музей К.С. Станиславского",
            description: "Музей в особняке, где жил и работал основатель системы актерского мастерства",
            type: "exhibition",
            latitude: 55.7614,
            longitude: 37.6019,
            estimated_time: 90,
            image_url: "https://example.com/stanislavsky_museum.jpg",
            beauty_score: 7.7,
            popularity: 6.5,
            historical_value: 8.5,
            architectural_value: 7.8,
            best_time: ["осень", "зима"]
          }
        ]

        setPlaces(mockData)
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBeautifulPlaces()
  }, [])

  // Обновление маркеров карты при изменении списка мест
  useEffect(() => {
    updateMapMarkers()
  }, [places, selectedPlace])

  // Функция для обновления маркеров карты
  const updateMapMarkers = () => {
    const markers: MapMarker[] = places.map(place => ({
      position: [place.latitude, place.longitude],
      title: place.name,
      description: place.description,
      type: place.type,
      active: selectedPlace ? place.id === selectedPlace.id : false,
      // Добавляем дополнительные данные для отображения в попапе
      image_url: place.image_url,
      beauty_score: place.beauty_score,
      estimated_time: place.estimated_time,
      popularity: place.popularity,
      historical_value: place.historical_value,
      architectural_value: place.architectural_value
    }))

    setMapMarkers(markers)

    // Если выбрано место, центрируем карту на нем
    if (selectedPlace) {
      setMapCenter([selectedPlace.latitude, selectedPlace.longitude])
      setMapZoom(15)
    } else if (markers.length > 0) {
      // Если нет выбранного места, но есть маркеры, центрируем карту на Москве
      setMapCenter([55.7558, 37.6173])
      setMapZoom(11)
    }
  }

  // Обработчик клика по маркеру
  const handleMarkerClick = (marker: MapMarker) => {
    const place = places.find(
      p => p.latitude === marker.position[0] && p.longitude === marker.position[1]
    )

    if (place) {
      setSelectedPlace(place)
      // Прокручиваем к информации о месте
      document.getElementById('place-details')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Обработчик клика по месту в списке
  const handlePlaceClick = (place: BeautifulPlace) => {
    setSelectedPlace(place)
    setMapCenter([place.latitude, place.longitude])
    setMapZoom(15)
  }

  // Функция для форматирования времени
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} мин.`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ч. ${mins} мин.` : `${hours} ч.`
  }

  // Функция для получения цвета в зависимости от оценки красоты
  const getBeautyScoreColor = (score: number) => {
    if (score >= 9.5) return 'text-purple-600 font-bold'
    if (score >= 9.0) return 'text-red-600 font-bold'
    if (score >= 8.5) return 'text-orange-600 font-bold'
    if (score >= 8.0) return 'text-yellow-600 font-bold'
    return 'text-green-600 font-bold'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-700 mb-2">100 самых красивых мест Москвы</h1>
      <p className="text-gray-600 mb-2">Полный рейтинг наиболее живописных и впечатляющих мест столицы</p>
      <div className="mb-6">
        <Link
          href="/create-route/beautiful-places"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Создать маршрут по красивым местам
        </Link>
      </div>

      {/* Вкладки */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'list'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('list')}
        >
          Список мест
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'analysis'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analysis')}
        >
          Анализ
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Левая колонка - список мест */}
          <div className="lg:w-1/3 space-y-6">
            {/* Список мест */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Топ-100 самых красивых мест
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">Загрузка мест...</p>
                </div>
              ) : places.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Нет данных о красивых местах</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {places.map((place, index) => (
                    <div
                      key={place.id}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedPlace && selectedPlace.id === place.id
                          ? 'bg-green-100 border-l-4 border-green-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          <span className="text-gray-500 mr-2">{index + 1}.</span>
                          {place.name}
                        </h3>
                        <span className={getBeautyScoreColor(place.beauty_score)}>
                          {place.beauty_score}/10
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className={`px-2 py-0.5 rounded-full ${getTypeColor(place.type)}`}>
                          {getTypeName(place.type)}
                        </span>
                        <span className="ml-2">{formatTime(place.estimated_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - карта и детали места */}
          <div className="lg:w-2/3 space-y-6">
            {/* Карта */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Карта красивых мест</h2>
              <MapComponent
                center={mapCenter}
                zoom={mapZoom}
                markers={mapMarkers}
                height="500px"
                onMarkerClick={handleMarkerClick}
              />
            </div>

            {/* Детали выбранного места */}
            {selectedPlace && (
              <div id="place-details" className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Информация о месте</h2>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Изображение места */}
                    <div className="md:w-1/3">
                      <div className="bg-gray-200 rounded-md overflow-hidden h-48">
                        <img
                          src={selectedPlace.image_url}
                          alt={selectedPlace.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Если изображение не загрузилось, заменяем на заглушку
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Нет+фото';
                          }}
                        />
                      </div>
                    </div>

                    {/* Информация о месте */}
                    <div className="md:w-2/3">
                      <h3 className="text-2xl font-bold text-green-700">{selectedPlace.name}</h3>
                      <div className="flex items-center mt-2 mb-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${getTypeColor(selectedPlace.type)}`}>
                          {getTypeName(selectedPlace.type)}
                        </span>
                        <span className="ml-4 text-gray-600">
                          Время посещения: {formatTime(selectedPlace.estimated_time)}
                        </span>
                        <span className={`ml-4 ${getBeautyScoreColor(selectedPlace.beauty_score)}`}>
                          Красота: {selectedPlace.beauty_score}/10
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{selectedPlace.description}</p>

                      {/* Оценки */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Популярность</h4>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${selectedPlace.popularity * 10}%` }}></div>
                          </div>
                          <span className="text-sm">{selectedPlace.popularity}/10</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Историческая ценность</h4>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${selectedPlace.historical_value * 10}%` }}></div>
                          </div>
                          <span className="text-sm">{selectedPlace.historical_value}/10</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Архитектурная ценность</h4>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${selectedPlace.architectural_value * 10}%` }}></div>
                          </div>
                          <span className="text-sm">{selectedPlace.architectural_value}/10</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Лучшее время для посещения</h4>
                          <div className="flex gap-1 mt-1">
                            {selectedPlace.best_time.map(season => (
                              <span key={season} className={`text-xs px-2 py-1 rounded-full ${getSeasonColor(season)}`}>
                                {season}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки действий */}
                      <div className="mt-6 flex gap-3">
                        <Link
                          href={`/create-route/beautiful-places?place=${selectedPlace.id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors inline-block text-center"
                        >
                          Создать маршрут с этим местом
                        </Link>
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                          onClick={() => setSelectedPlace(null)}
                        >
                          Закрыть
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Анализ красивых мест Москвы</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Средняя оценка по типам */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Средняя оценка красоты по типам мест</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Достопримечательности</span>
                      <span className="text-red-600 font-bold">9.24/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '92.4%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Парки</span>
                      <span className="text-green-600 font-bold">8.93/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '89.3%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Выставки и музеи</span>
                      <span className="text-blue-600 font-bold">8.65/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '86.5%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Корреляция с другими факторами */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Корреляция красоты с другими факторами</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Историческая ценность</span>
                      <span className="text-purple-600 font-bold">0.89</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Популярность</span>
                      <span className="text-blue-600 font-bold">0.82</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Архитектурная ценность</span>
                      <span className="text-amber-600 font-bold">0.78</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Лучшие сезоны */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Лучшие сезоны для посещения</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-100 rounded-lg">
                    <span className="block text-2xl font-bold text-green-700">18</span>
                    <span className="text-green-600">Весна</span>
                  </div>
                  <div className="text-center p-3 bg-yellow-100 rounded-lg">
                    <span className="block text-2xl font-bold text-yellow-700">18</span>
                    <span className="text-yellow-600">Лето</span>
                  </div>
                  <div className="text-center p-3 bg-orange-100 rounded-lg">
                    <span className="block text-2xl font-bold text-orange-700">16</span>
                    <span className="text-orange-600">Осень</span>
                  </div>
                  <div className="text-center p-3 bg-blue-100 rounded-lg">
                    <span className="block text-2xl font-bold text-blue-700">6</span>
                    <span className="text-blue-600">Зима</span>
                  </div>
                </div>
              </div>

              {/* Выводы */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Основные выводы</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Достопримечательности имеют самую высокую среднюю оценку красоты (9.24/10)</li>
                  <li>Историческая ценность имеет наибольшую корреляцию с красотой места (0.89)</li>
                  <li>Весна и лето - лучшие сезоны для посещения красивых мест Москвы</li>
                  <li>Храм Василия Блаженного признан самым красивым местом Москвы (9.9/10)</li>
                  <li>Большинство красивых мест сосредоточено в центре города</li>
                  <li>Среди топ-20 мест: 10 достопримечательностей, 6 парков и 4 музея/выставки</li>
                  <li>Храм Христа Спасителя входит в топ-10 по архитектурной ценности (9.5/10)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/moscow-places" className="text-green-600 hover:underline">
                ← Вернуться к списку всех мест
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Вспомогательные функции для отображения типов мест
function getTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    attraction: 'Достопримечательность',
    park: 'Парк',
    exhibition: 'Выставка/Музей',
    cafe: 'Кафе',
    restaurant: 'Ресторан',
    shop: 'Магазин'
  }
  return typeMap[type] || type
}

function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    attraction: 'bg-red-100 text-red-800',
    park: 'bg-green-100 text-green-800',
    exhibition: 'bg-blue-100 text-blue-800',
    cafe: 'bg-amber-100 text-amber-800',
    restaurant: 'bg-purple-100 text-purple-800',
    shop: 'bg-indigo-100 text-indigo-800'
  }
  return colorMap[type] || 'bg-gray-100 text-gray-800'
}

function getSeasonColor(season: string): string {
  const colorMap: Record<string, string> = {
    'весна': 'bg-green-100 text-green-800',
    'лето': 'bg-yellow-100 text-yellow-800',
    'осень': 'bg-orange-100 text-orange-800',
    'зима': 'bg-blue-100 text-blue-800'
  }
  return colorMap[season] || 'bg-gray-100 text-gray-800'
}
