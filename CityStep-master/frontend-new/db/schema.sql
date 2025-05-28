-- Создание таблицы профилей пользователей
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание триггера для автоматического создания профиля при регистрации пользователя
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Создание таблицы мест (достопримечательностей, кафе и т.д.)
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('attraction', 'cafe', 'restaurant', 'shop', 'park', 'exhibition')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  estimated_time INTEGER NOT NULL, -- в минутах
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы маршрутов
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_point_name TEXT NOT NULL,
  start_latitude DOUBLE PRECISION NOT NULL,
  start_longitude DOUBLE PRECISION NOT NULL,
  end_point_name TEXT NOT NULL,
  end_latitude DOUBLE PRECISION NOT NULL,
  end_longitude DOUBLE PRECISION NOT NULL,
  travel_time DOUBLE PRECISION NOT NULL, -- в часах
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы связи маршрутов и мест
CREATE TABLE route_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  place_id UUID REFERENCES places(id) NOT NULL,
  "order" INTEGER NOT NULL,
  UNIQUE (route_id, place_id)
);

-- Настройка политик безопасности для таблицы профилей
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут просматривать все профили"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Пользователи могут обновлять только свой профиль"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Настройка политик безопасности для таблицы мест
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Места доступны для чтения всем"
  ON places FOR SELECT
  USING (true);

CREATE POLICY "Только администраторы могут создавать и обновлять места"
  ON places FOR INSERT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'admin@citystep.com'));

CREATE POLICY "Только администраторы могут обновлять места"
  ON places FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'admin@citystep.com'));

-- Настройка политик безопасности для таблицы маршрутов
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут просматривать свои маршруты"
  ON routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои маршруты"
  ON routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои маршруты"
  ON routes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои маршруты"
  ON routes FOR DELETE
  USING (auth.uid() = user_id);

-- Настройка политик безопасности для таблицы связи маршрутов и мест
ALTER TABLE route_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут просматривать точки своих маршрутов"
  ON route_places FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM routes WHERE id = route_id
    )
  );

CREATE POLICY "Пользователи могут добавлять точки в свои маршруты"
  ON route_places FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM routes WHERE id = route_id
    )
  );

CREATE POLICY "Пользователи могут обновлять точки своих маршрутов"
  ON route_places FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM routes WHERE id = route_id
    )
  );

CREATE POLICY "Пользователи могут удалять точки своих маршрутов"
  ON route_places FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM routes WHERE id = route_id
    )
  );

-- Добавление тестовых данных
INSERT INTO places (name, description, type, latitude, longitude, estimated_time, image_url) VALUES
('Красная площадь', 'Главная площадь Москвы', 'attraction', 55.7539, 37.6208, 60, 'https://example.com/red_square.jpg'),
('ГУМ', 'Главный универсальный магазин', 'shop', 55.7546, 37.6215, 90, 'https://example.com/gum.jpg'),
('Парк Горького', 'Центральный парк культуры и отдыха', 'park', 55.7298, 37.6019, 120, 'https://example.com/gorky_park.jpg'),
('Большой театр', 'Исторический театр оперы и балета', 'attraction', 55.7601, 37.6186, 180, 'https://example.com/bolshoi.jpg'),
('Третьяковская галерея', 'Художественный музей', 'exhibition', 55.7415, 37.6208, 150, 'https://example.com/tretyakov.jpg'),
('Кафе "Пушкинъ"', 'Известное кафе с русской кухней', 'cafe', 55.7649, 37.6049, 90, 'https://example.com/cafe_pushkin.jpg'),
('Ресторан "Белый кролик"', 'Ресторан высокой кухни', 'restaurant', 55.7553, 37.6134, 120, 'https://example.com/white_rabbit.jpg'),
('ЦУМ', 'Центральный универсальный магазин', 'shop', 55.7602, 37.6208, 90, 'https://example.com/tsum.jpg'),
('Парк "Зарядье"', 'Современный парк в центре Москвы', 'park', 55.7510, 37.6290, 90, 'https://example.com/zaryadye.jpg'),
('ГМИИ им. А.С. Пушкина', 'Музей изобразительных искусств', 'exhibition', 55.7447, 37.6062, 120, 'https://example.com/pushkin_museum.jpg');
