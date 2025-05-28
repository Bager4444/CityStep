# Техническое задание: Навигатор Москвы

## 1. Архитектура системы

### 1.1 Общая архитектура
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External APIs  │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (Maps, Routes) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PWA Cache     │    │   Database      │    │   CDN/Cache     │
│   (Service      │    │   (PostgreSQL   │    │   (Redis)       │
│    Worker)      │    │    + PostGIS)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 Технологический стек

**Frontend:**
- React 18.2+ с TypeScript
- Vite для сборки
- Leaflet 1.9+ для карт
- React-Leaflet для интеграции
- Zustand для state management
- React Query для API запросов
- Workbox для PWA

**Backend:**
- Node.js 18+ с Express
- TypeScript
- PostgreSQL 14+ с PostGIS
- Redis 7+ для кэширования
- Socket.io для real-time
- JWT для аутентификации

**DevOps:**
- Docker для контейнеризации
- GitHub Actions для CI/CD
- Nginx для reverse proxy
- PM2 для process management

## 2. Структура проекта

```
moscow-navigator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   ├── MapContainer.tsx
│   │   │   │   ├── MapProviders/
│   │   │   │   │   ├── LeafletMap.tsx
│   │   │   │   │   ├── GoogleMap.tsx
│   │   │   │   │   └── YandexMap.tsx
│   │   │   │   ├── Navigation/
│   │   │   │   │   ├── NavigationPanel.tsx
│   │   │   │   │   ├── StepByStep.tsx
│   │   │   │   │   └── VoiceGuide.tsx
│   │   │   │   └── Markers/
│   │   │   │       ├── UserMarker.tsx
│   │   │   │       ├── RouteMarkers.tsx
│   │   │   │       └── POIMarkers.tsx
│   │   │   ├── Search/
│   │   │   │   ├── SearchPanel.tsx
│   │   │   │   ├── AutoComplete.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   ├── Route/
│   │   │   │   ├── RoutePanel.tsx
│   │   │   │   ├── RouteOptions.tsx
│   │   │   │   └── RouteInfo.tsx
│   │   │   └── UI/
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Loader.tsx
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   ├── geocoding.ts
│   │   │   │   ├── routing.ts
│   │   │   │   └── places.ts
│   │   │   ├── geolocation/
│   │   │   │   ├── gps.ts
│   │   │   │   └── compass.ts
│   │   │   └── maps/
│   │   │       ├── providers.ts
│   │   │       └── utils.ts
│   │   ├── stores/
│   │   │   ├── mapStore.ts
│   │   │   ├── routeStore.ts
│   │   │   └── userStore.ts
│   │   ├── types/
│   │   │   ├── map.ts
│   │   │   ├── route.ts
│   │   │   └── user.ts
│   │   └── utils/
│   │       ├── calculations.ts
│   │       ├── formatters.ts
│   │       └── constants.ts
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── icons/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── geocoding.ts
│   │   │   ├── routing.ts
│   │   │   └── places.ts
│   │   ├── services/
│   │   │   ├── mapProviders/
│   │   │   ├── database/
│   │   │   └── cache/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## 3. Компоненты системы

### 3.1 Картографические провайдеры

#### 3.1.1 Leaflet Maps (базовый)
```typescript
interface MapProvider {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  tileSize: number;
}

const MAP_PROVIDERS: Record<string, MapProvider> = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 1,
    tileSize: 256
  },
  // ... другие провайдеры
}
```

#### 3.1.2 Google Maps интеграция
```typescript
interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
  version: string;
  language: string;
}

class GoogleMapsProvider {
  private map: google.maps.Map;
  private directionsService: google.maps.DirectionsService;
  private directionsRenderer: google.maps.DirectionsRenderer;
  
  async initialize(container: HTMLElement, options: MapOptions): Promise<void>
  async geocode(address: string): Promise<GeocodeResult[]>
  async calculateRoute(origin: LatLng, destination: LatLng): Promise<Route>
}
```

#### 3.1.3 Яндекс.Карты интеграция
```typescript
interface YandexMapsConfig {
  apiKey: string;
  lang: string;
  version: string;
}

class YandexMapsProvider {
  private map: ymaps.Map;
  private router: ymaps.Router;
  
  async initialize(container: HTMLElement, options: MapOptions): Promise<void>
  async search(query: string): Promise<SearchResult[]>
  async buildRoute(points: LatLng[]): Promise<Route>
}
```

### 3.2 Геолокация и позиционирование

#### 3.2.1 GPS сервис
```typescript
interface GeolocationOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

class GeolocationService {
  private watchId: number | null = null;
  private currentPosition: Position | null = null;
  
  async getCurrentPosition(options?: GeolocationOptions): Promise<Position>
  startWatching(callback: (position: Position) => void, options?: GeolocationOptions): void
  stopWatching(): void
  calculateDistance(from: LatLng, to: LatLng): number
  calculateBearing(from: LatLng, to: LatLng): number
}
```

#### 3.2.2 Компас и ориентация
```typescript
interface CompassData {
  heading: number;
  accuracy: number;
  timestamp: number;
}

class CompassService {
  private isSupported: boolean;
  private currentHeading: number = 0;
  
  async requestPermission(): Promise<boolean>
  startWatching(callback: (data: CompassData) => void): void
  stopWatching(): void
  getCardinalDirection(heading: number): string
}
```

### 3.3 Пошаговая навигация

#### 3.3.1 Навигационные инструкции
```typescript
interface NavigationStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  coordinates: LatLng;
  maneuver: ManeuverType;
  direction: CardinalDirection;
  streetName?: string;
}

enum ManeuverType {
  STRAIGHT = 'straight',
  TURN_LEFT = 'turn-left',
  TURN_RIGHT = 'turn-right',
  TURN_SHARP_LEFT = 'turn-sharp-left',
  TURN_SHARP_RIGHT = 'turn-sharp-right',
  U_TURN = 'u-turn',
  ROUNDABOUT = 'roundabout',
  ARRIVE = 'arrive'
}

class NavigationService {
  private steps: NavigationStep[] = [];
  private currentStepIndex: number = 0;
  private isNavigating: boolean = false;
  
  generateSteps(route: Route): NavigationStep[]
  startNavigation(steps: NavigationStep[]): void
  updatePosition(position: LatLng): NavigationUpdate
  getNextInstruction(): NavigationStep | null
  calculateProgress(): number
}
```

#### 3.3.2 Голосовые подсказки
```typescript
interface VoiceSettings {
  enabled: boolean;
  voice: SpeechSynthesisVoice;
  volume: number;
  rate: number;
  pitch: number;
}

class VoiceGuideService {
  private synthesis: SpeechSynthesis;
  private settings: VoiceSettings;
  
  async initialize(): Promise<void>
  speak(text: string): void
  setVoice(voice: SpeechSynthesisVoice): void
  setVolume(volume: number): void
  stop(): void
  getAvailableVoices(): SpeechSynthesisVoice[]
}
```

### 3.4 Поиск и геокодирование

#### 3.4.1 Поисковый сервис
```typescript
interface SearchQuery {
  text: string;
  location?: LatLng;
  radius?: number;
  category?: string;
  limit?: number;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: LatLng;
  category: string;
  rating?: number;
  distance?: number;
}

class SearchService {
  async search(query: SearchQuery): Promise<SearchResult[]>
  async geocode(address: string): Promise<LatLng[]>
  async reverseGeocode(coordinates: LatLng): Promise<string>
  async searchNearby(location: LatLng, category: string): Promise<SearchResult[]>
}
```

#### 3.4.2 Автодополнение
```typescript
interface AutocompleteOptions {
  minLength: number;
  debounceMs: number;
  maxResults: number;
}

class AutocompleteService {
  private cache: Map<string, SearchResult[]> = new Map();
  
  async getSuggestions(query: string, options?: AutocompleteOptions): Promise<SearchResult[]>
  clearCache(): void
}
```

### 3.5 Маршрутизация

#### 3.5.1 Построение маршрутов
```typescript
interface RouteOptions {
  mode: TransportMode;
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidFerries: boolean;
  optimize: OptimizationType;
}

enum TransportMode {
  DRIVING = 'driving',
  WALKING = 'walking',
  CYCLING = 'cycling',
  TRANSIT = 'transit'
}

enum OptimizationType {
  FASTEST = 'fastest',
  SHORTEST = 'shortest',
  BALANCED = 'balanced'
}

interface Route {
  id: string;
  coordinates: LatLng[];
  distance: number;
  duration: number;
  steps: NavigationStep[];
  bounds: LatLngBounds;
  summary: string;
}

class RoutingService {
  async calculateRoute(
    origin: LatLng,
    destination: LatLng,
    waypoints?: LatLng[],
    options?: RouteOptions
  ): Promise<Route[]>
  
  async getAlternativeRoutes(
    origin: LatLng,
    destination: LatLng,
    count: number
  ): Promise<Route[]>
}
```

## 4. API Endpoints

### 4.1 Геокодирование
```
GET /api/geocode?address={address}&limit={limit}
GET /api/reverse-geocode?lat={lat}&lng={lng}
```

### 4.2 Поиск
```
GET /api/search?q={query}&lat={lat}&lng={lng}&radius={radius}
GET /api/autocomplete?q={query}&limit={limit}
GET /api/places/nearby?lat={lat}&lng={lng}&category={category}
```

### 4.3 Маршрутизация
```
POST /api/routes
Body: {
  origin: { lat: number, lng: number },
  destination: { lat: number, lng: number },
  waypoints?: { lat: number, lng: number }[],
  mode: string,
  options: RouteOptions
}

GET /api/routes/{routeId}/steps
```

### 4.4 Достопримечательности
```
GET /api/poi?lat={lat}&lng={lng}&radius={radius}
GET /api/poi/{id}
GET /api/poi/categories
```

## 5. База данных

### 5.1 Схема PostgreSQL + PostGIS
```sql
-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Места (POI)
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  location GEOMETRY(POINT, 4326) NOT NULL,
  category VARCHAR(100),
  rating DECIMAL(2,1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для геопространственных запросов
CREATE INDEX idx_places_location ON places USING GIST (location);

-- Маршруты
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  origin GEOMETRY(POINT, 4326) NOT NULL,
  destination GEOMETRY(POINT, 4326) NOT NULL,
  route_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Избранные места
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  place_id UUID REFERENCES places(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);
```

## 6. Производительность и оптимизация

### 6.1 Кэширование
- Redis для кэширования API ответов (TTL: 1 час)
- Browser cache для тайлов карт (TTL: 7 дней)
- Service Worker для офлайн функциональности

### 6.2 Оптимизация загрузки
- Lazy loading компонентов
- Code splitting по маршрутам
- Preloading критических ресурсов
- Compression (gzip/brotli)

### 6.3 Мониторинг
- Sentry для отслеживания ошибок
- Google Analytics для пользовательской аналитики
- Custom metrics для производительности

## 7. Безопасность

### 7.1 Аутентификация
- JWT токены с refresh механизмом
- OAuth2 интеграция (Google, Яндекс)
- Rate limiting для API

### 7.2 Защита данных
- HTTPS обязательно
- Валидация всех входных данных
- Санитизация пользовательского ввода
- CORS настройки

## 8. Тестирование

### 8.1 Unit тесты
- Jest для логики
- React Testing Library для компонентов
- Покрытие >80%

### 8.2 Integration тесты
- Cypress для E2E тестирования
- API тесты с Supertest

### 8.3 Performance тесты
- Lighthouse CI
- Load testing с Artillery

## 9. Деплой и DevOps

### 9.1 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t moscow-navigator .
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh
```

### 9.2 Мониторинг
- Prometheus + Grafana для метрик
- ELK stack для логов
- Uptime monitoring

Это техническое задание обеспечивает детальное понимание архитектуры и реализации навигатора Москвы с пошаговой навигацией.
