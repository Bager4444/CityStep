import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

/**
 * @api {post} /api/routes/generate Генерация маршрута на основе предпочтений пользователя
 * @apiName GenerateRoute
 * @apiGroup Routes
 * @apiParam {String} start_point_name Название начальной точки
 * @apiParam {Number} start_latitude Широта начальной точки
 * @apiParam {Number} start_longitude Долгота начальной точки
 * @apiParam {String} end_point_name Название конечной точки
 * @apiParam {Number} end_latitude Широта конечной точки
 * @apiParam {Number} end_longitude Долгота конечной точки
 * @apiParam {Number} travel_time Время пути (в часах)
 * @apiParam {String[]} [include_types] Типы мест для включения в маршрут
 * @apiSuccess {Object} route Сгенерированный маршрут с точками
 * @apiSuccess {Number} total_time Общее время маршрута (в минутах)
 * @apiError {String} error Сообщение об ошибке
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем параметры для генерации маршрута
    const {
      start_point_name,
      start_latitude,
      start_longitude,
      end_point_name,
      end_latitude,
      end_longitude,
      travel_time,
      include_types
    } = await request.json();

    // Проверяем обязательные параметры
    if (!start_point_name || !start_latitude || !start_longitude ||
        !end_point_name || !end_latitude || !end_longitude ||
        !travel_time) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Получаем места, соответствующие выбранным типам
    let placesQuery = supabase
      .from('places')
      .select('*');

    // Фильтруем по типам, если они указаны
    if (include_types && include_types.length > 0) {
      placesQuery = placesQuery.in('type', include_types);
    }

    const { data: places, error: placesError } = await placesQuery;

    if (placesError) {
      throw placesError;
    }

    // Если нет подходящих мест, возвращаем ошибку
    if (!places || places.length === 0) {
      return NextResponse.json(
        { error: 'No suitable places found' },
        { status: 404 }
      );
    }

    // Рассчитываем расстояние между точками (упрощенно, по прямой)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Радиус Земли в км
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Рассчитываем примерную скорость перемещения (км/ч)
    const averageSpeed = 5; // Средняя скорость пешехода

    // Рассчитываем максимальное расстояние, которое можно пройти за указанное время
    const maxDistance = averageSpeed * travel_time;

    // Фильтруем места, которые находятся в пределах досягаемости
    const reachablePlaces = places.filter(place => {
      const distanceFromStart = calculateDistance(
        start_latitude,
        start_longitude,
        place.latitude,
        place.longitude
      );

      const distanceToEnd = calculateDistance(
        place.latitude,
        place.longitude,
        end_latitude,
        end_longitude
      );

      // Проверяем, что место находится в пределах досягаемости
      return (distanceFromStart + distanceToEnd) <= maxDistance;
    });

    // Если нет подходящих мест в пределах досягаемости, возвращаем ошибку
    if (reachablePlaces.length === 0) {
      return NextResponse.json(
        { error: 'No places found within the specified travel time' },
        { status: 404 }
      );
    }

    // Сортируем места по расстоянию от начальной точки
    reachablePlaces.sort((a, b) => {
      const distA = calculateDistance(
        start_latitude,
        start_longitude,
        a.latitude,
        a.longitude
      );

      const distB = calculateDistance(
        start_latitude,
        start_longitude,
        b.latitude,
        b.longitude
      );

      return distA - distB;
    });

    // Выбираем места для маршрута, учитывая ограничение по времени
    const selectedPlaces = [];
    let totalTime = 0; // в минутах
    let currentLat = start_latitude;
    let currentLon = start_longitude;

    for (const place of reachablePlaces) {
      // Рассчитываем время на дорогу до места
      const distance = calculateDistance(
        currentLat,
        currentLon,
        place.latitude,
        place.longitude
      );

      const travelTimeToPlace = (distance / averageSpeed) * 60; // в минутах

      // Проверяем, не превысим ли мы лимит времени
      if (totalTime + travelTimeToPlace + place.estimated_time <= travel_time * 60) {
        selectedPlaces.push(place);
        totalTime += travelTimeToPlace + place.estimated_time;
        currentLat = place.latitude;
        currentLon = place.longitude;
      }
    }

    // Рассчитываем время на дорогу до конечной точки
    const finalDistance = calculateDistance(
      currentLat,
      currentLon,
      end_latitude,
      end_longitude
    );

    const finalTravelTime = (finalDistance / averageSpeed) * 60; // в минутах

    // Проверяем, не превысим ли мы лимит времени с учетом дороги до конечной точки
    if (totalTime + finalTravelTime > travel_time * 60) {
      // Если превышаем, удаляем последнее место
      if (selectedPlaces.length > 0) {
        const lastPlace = selectedPlaces.pop();
        if (lastPlace) {
          totalTime -= lastPlace.estimated_time;

          // Пересчитываем время на дорогу до конечной точки
          const newDistance = calculateDistance(
            currentLat,
            currentLon,
            end_latitude,
            end_longitude
          );

          totalTime -= (newDistance / averageSpeed) * 60;
        }
      }
    }

    // Создаем маршрут
    const routeName = `Маршрут от ${start_point_name} до ${end_point_name}`;

    const { data: route, error: routeError } = await supabase
      .from('routes')
      .insert({
        name: routeName,
        user_id: user.id,
        start_point_name,
        start_latitude,
        start_longitude,
        end_point_name,
        end_latitude,
        end_longitude,
        travel_time
      })
      .select()
      .single();

    if (routeError) {
      throw routeError;
    }

    // Добавляем места в маршрут
    const routePlacesData = selectedPlaces.map((place, index) => ({
      route_id: route.id,
      place_id: place.id,
      order: index + 1
    }));

    if (routePlacesData.length > 0) {
      const { error: placesInsertError } = await supabase
        .from('route_places')
        .insert(routePlacesData);

      if (placesInsertError) {
        throw placesInsertError;
      }
    }

    // Получаем полные данные маршрута с местами
    const { data: routeWithPlaces, error: fetchError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', route.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const { data: routePlaces, error: routePlacesError } = await supabase
      .from('route_places')
      .select('*, places(*)')
      .eq('route_id', route.id)
      .order('order', { ascending: true });

    if (routePlacesError) {
      throw routePlacesError;
    }

    return NextResponse.json({
      ...routeWithPlaces,
      places: routePlaces.map(rp => rp.places),
      total_time: totalTime // в минутах
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
