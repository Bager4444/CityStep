# API документация CityStep

## Аутентификация

Все API эндпоинты, кроме публичных, требуют аутентификации. Аутентификация осуществляется через Supabase Auth.

## Профили пользователей

### Получение профиля текущего пользователя

```
GET /api/profile
```

**Ответ:**

```json
{
  "id": "uuid",
  "username": "user@example.com",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2023-04-20T12:00:00Z"
}
```

### Обновление профиля текущего пользователя

```
PUT /api/profile
```

**Тело запроса:**

```json
{
  "username": "newusername",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Ответ:**

```json
{
  "id": "uuid",
  "username": "newusername",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "created_at": "2023-04-20T12:00:00Z"
}
```

## Места

### Получение всех мест

```
GET /api/places
```

**Параметры запроса:**

- `type` (опционально) - тип места для фильтрации
- `query` (опционально) - поисковый запрос

**Ответ:**

```json
[
  {
    "id": "uuid",
    "name": "Красная площадь",
    "description": "Главная площадь Москвы",
    "type": "attraction",
    "latitude": 55.7539,
    "longitude": 37.6208,
    "estimated_time": 60,
    "image_url": "https://example.com/red_square.jpg",
    "created_at": "2023-04-20T12:00:00Z"
  },
  // ...
]
```

### Создание нового места (только для администраторов)

```
POST /api/places
```

**Тело запроса:**

```json
{
  "name": "Новое место",
  "description": "Описание нового места",
  "type": "attraction",
  "latitude": 55.7539,
  "longitude": 37.6208,
  "estimated_time": 60,
  "image_url": "https://example.com/new_place.jpg"
}
```

**Ответ:**

```json
{
  "id": "uuid",
  "name": "Новое место",
  "description": "Описание нового места",
  "type": "attraction",
  "latitude": 55.7539,
  "longitude": 37.6208,
  "estimated_time": 60,
  "image_url": "https://example.com/new_place.jpg",
  "created_at": "2023-04-20T12:00:00Z"
}
```

## Маршруты

### Получение всех маршрутов пользователя

```
GET /api/routes
```

**Ответ:**

```json
[
  {
    "id": "uuid",
    "name": "Маршрут по центру Москвы",
    "user_id": "uuid",
    "start_point_name": "Красная площадь",
    "start_latitude": 55.7539,
    "start_longitude": 37.6208,
    "end_point_name": "Парк Горького",
    "end_latitude": 55.7298,
    "end_longitude": 37.6019,
    "travel_time": 3,
    "created_at": "2023-04-20T12:00:00Z"
  },
  // ...
]
```

### Создание нового маршрута

```
POST /api/routes
```

**Тело запроса:**

```json
{
  "name": "Новый маршрут",
  "start_point_name": "Красная площадь",
  "start_latitude": 55.7539,
  "start_longitude": 37.6208,
  "end_point_name": "Парк Горького",
  "end_latitude": 55.7298,
  "end_longitude": 37.6019,
  "travel_time": 3
}
```

**Ответ:**

```json
{
  "id": "uuid",
  "name": "Новый маршрут",
  "user_id": "uuid",
  "start_point_name": "Красная площадь",
  "start_latitude": 55.7539,
  "start_longitude": 37.6208,
  "end_point_name": "Парк Горького",
  "end_latitude": 55.7298,
  "end_longitude": 37.6019,
  "travel_time": 3,
  "created_at": "2023-04-20T12:00:00Z"
}
```

### Получение конкретного маршрута

```
GET /api/routes/:id
```

**Ответ:**

```json
{
  "id": "uuid",
  "name": "Маршрут по центру Москвы",
  "user_id": "uuid",
  "start_point_name": "Красная площадь",
  "start_latitude": 55.7539,
  "start_longitude": 37.6208,
  "end_point_name": "Парк Горького",
  "end_latitude": 55.7298,
  "end_longitude": 37.6019,
  "travel_time": 3,
  "created_at": "2023-04-20T12:00:00Z",
  "places": [
    {
      "id": "uuid",
      "name": "ГУМ",
      "description": "Главный универсальный магазин",
      "type": "shop",
      "latitude": 55.7546,
      "longitude": 37.6215,
      "estimated_time": 90,
      "image_url": "https://example.com/gum.jpg",
      "created_at": "2023-04-20T12:00:00Z"
    },
    // ...
  ]
}
```

### Обновление маршрута

```
PUT /api/routes/:id
```

**Тело запроса:**

```json
{
  "name": "Обновленный маршрут",
  "travel_time": 4
}
```

**Ответ:**

```json
{
  "id": "uuid",
  "name": "Обновленный маршрут",
  "user_id": "uuid",
  "start_point_name": "Красная площадь",
  "start_latitude": 55.7539,
  "start_longitude": 37.6208,
  "end_point_name": "Парк Горького",
  "end_latitude": 55.7298,
  "end_longitude": 37.6019,
  "travel_time": 4,
  "created_at": "2023-04-20T12:00:00Z"
}
```

### Удаление маршрута

```
DELETE /api/routes/:id
```

**Ответ:**

```json
{
  "success": true
}
```

### Генерация маршрута

```
POST /api/routes/generate
```

**Тело запроса:**

```json
{
  "start_point_name": "Красная площадь",
  "start_latitude": 55.7539,
  "start_longitude": 37.6208,
  "end_point_name": "Парк Горького",
  "end_latitude": 55.7298,
  "end_longitude": 37.6019,
  "travel_time": 3,
  "include_types": ["attraction", "cafe", "park"]
}
```

**Ответ:**

```json
{
  "id": "uuid",
  "name": "Маршрут от Красная площадь до Парк Горького",
  "user_id": "uuid",
  "start_point_name": "Красная площадь",
  "start_latitude": 55.7539,
  "start_longitude": 37.6208,
  "end_point_name": "Парк Горького",
  "end_latitude": 55.7298,
  "end_longitude": 37.6019,
  "travel_time": 3,
  "created_at": "2023-04-20T12:00:00Z",
  "places": [
    {
      "id": "uuid",
      "name": "ГУМ",
      "description": "Главный универсальный магазин",
      "type": "shop",
      "latitude": 55.7546,
      "longitude": 37.6215,
      "estimated_time": 90,
      "image_url": "https://example.com/gum.jpg",
      "created_at": "2023-04-20T12:00:00Z"
    },
    // ...
  ],
  "total_time": 180
}
```

## Точки маршрута

### Получение точек маршрута

```
GET /api/routes/:id/places
```

**Ответ:**

```json
[
  {
    "id": "uuid",
    "route_id": "uuid",
    "place_id": "uuid",
    "order": 1,
    "places": {
      "id": "uuid",
      "name": "ГУМ",
      "description": "Главный универсальный магазин",
      "type": "shop",
      "latitude": 55.7546,
      "longitude": 37.6215,
      "estimated_time": 90,
      "image_url": "https://example.com/gum.jpg",
      "created_at": "2023-04-20T12:00:00Z"
    }
  },
  // ...
]
```

### Добавление точки в маршрут

```
POST /api/routes/:id/places
```

**Тело запроса:**

```json
{
  "place_id": "uuid",
  "order": 1
}
```

**Ответ:**

```json
{
  "id": "uuid",
  "route_id": "uuid",
  "place_id": "uuid",
  "order": 1,
  "places": {
    "id": "uuid",
    "name": "ГУМ",
    "description": "Главный универсальный магазин",
    "type": "shop",
    "latitude": 55.7546,
    "longitude": 37.6215,
    "estimated_time": 90,
    "image_url": "https://example.com/gum.jpg",
    "created_at": "2023-04-20T12:00:00Z"
  }
}
```

### Обновление порядка точек маршрута

```
PUT /api/routes/:id/places
```

**Тело запроса:**

```json
[
  {
    "id": "uuid",
    "order": 2
  },
  {
    "id": "uuid",
    "order": 1
  }
]
```

**Ответ:**

```json
[
  {
    "id": "uuid",
    "route_id": "uuid",
    "place_id": "uuid",
    "order": 1,
    "places": {
      "id": "uuid",
      "name": "Третьяковская галерея",
      "description": "Художественный музей",
      "type": "exhibition",
      "latitude": 55.7415,
      "longitude": 37.6208,
      "estimated_time": 150,
      "image_url": "https://example.com/tretyakov.jpg",
      "created_at": "2023-04-20T12:00:00Z"
    }
  },
  {
    "id": "uuid",
    "route_id": "uuid",
    "place_id": "uuid",
    "order": 2,
    "places": {
      "id": "uuid",
      "name": "ГУМ",
      "description": "Главный универсальный магазин",
      "type": "shop",
      "latitude": 55.7546,
      "longitude": 37.6215,
      "estimated_time": 90,
      "image_url": "https://example.com/gum.jpg",
      "created_at": "2023-04-20T12:00:00Z"
    }
  }
]
```

### Удаление точки из маршрута

```
DELETE /api/routes/:id/places/:placeId
```

**Ответ:**

```json
{
  "success": true
}
```
