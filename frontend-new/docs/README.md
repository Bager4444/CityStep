# CityStep - Документация

CityStep - это веб-приложение для составления туристических маршрутов по интересным местам в городе. Приложение позволяет пользователям создавать персонализированные маршруты, выбирая начальную и конечную точки, а также предпочтения по типам мест (достопримечательности, кафе, рестораны, магазины, парки, выставки).

## Содержание

1. [Архитектура проекта](#архитектура-проекта)
2. [Технологический стек](#технологический-стек)
3. [Настройка проекта](#настройка-проекта)
4. [API документация](api.md)
5. [База данных](#база-данных)
6. [Аутентификация](#аутентификация)
7. [Развертывание](#развертывание)

## Архитектура проекта

Проект CityStep построен на основе архитектуры клиент-сервер с использованием Next.js для фронтенда и бэкенда. База данных и аутентификация реализованы с использованием Supabase.

### Структура проекта

```
frontend-new/
├── app/                  # Next.js App Router
│   ├── api/              # API эндпоинты
│   ├── auth/             # Страницы аутентификации
│   ├── create-route/     # Страница создания маршрута
│   ├── profile/          # Страница профиля пользователя
│   ├── route/            # Страница просмотра маршрута
│   └── page.tsx          # Главная страница
├── components/           # React компоненты
│   ├── auth/             # Компоненты аутентификации
│   ├── layout/           # Компоненты макета
│   ├── map/              # Компоненты карты
│   ├── routes/           # Компоненты маршрутов
│   └── ui/               # UI компоненты
├── db/                   # Схема базы данных
├── hooks/                # React хуки
├── lib/                  # Вспомогательные функции
├── public/               # Статические файлы
└── docs/                 # Документация
```

## Технологический стек

- **Фронтенд**: Next.js, React, TypeScript, Tailwind CSS
- **Бэкенд**: Next.js API Routes
- **База данных**: PostgreSQL (Supabase)
- **Аутентификация**: Supabase Auth
- **Карты**: OpenStreetMap с Leaflet
- **Стилизация**: Tailwind CSS

## Настройка проекта

### Предварительные требования

- Node.js 18.x или выше
- npm 9.x или выше
- Аккаунт Supabase

### Установка

1. Клонировать репозиторий:

```bash
git clone https://github.com/yourusername/citystep.git
cd citystep/frontend-new
```

2. Установить зависимости:

```bash
npm install
```

3. Создать файл `.env.local` и добавить переменные окружения:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Запустить проект в режиме разработки:

```bash
npm run dev
```

## База данных

Схема базы данных находится в файле `db/schema.sql`. Она включает следующие таблицы:

- `profiles` - профили пользователей
- `places` - места (достопримечательности, кафе и т.д.)
- `routes` - маршруты
- `route_places` - связь маршрутов и мест

## Аутентификация

Аутентификация реализована с использованием Supabase Auth. Пользователи могут:

- Зарегистрироваться с помощью email и пароля
- Войти с помощью email и пароля
- Восстановить пароль
- Выйти из системы

## Развертывание

### Развертывание на Vercel

1. Создать аккаунт на [Vercel](https://vercel.com)
2. Подключить репозиторий GitHub
3. Настроить переменные окружения
4. Развернуть проект

### Развертывание на другом хостинге

1. Собрать проект:

```bash
npm run build
```

2. Запустить проект:

```bash
npm start
```
