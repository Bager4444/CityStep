import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

/**
 * @api {get} /api/routes/:id/places Получение точек маршрута
 * @apiName GetRoutePlaces
 * @apiGroup RoutePlaces
 * @apiParam {String} id ID маршрута
 * @apiSuccess {Object[]} places Точки маршрута
 * @apiError {String} error Сообщение об ошибке
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;

    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, существует ли маршрут и принадлежит ли он пользователю
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single();

    if (routeError) {
      throw routeError;
    }

    if (route.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем точки маршрута
    const { data, error } = await supabase
      .from('route_places')
      .select('*, places(*)')
      .eq('route_id', routeId)
      .order('order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @api {post} /api/routes/:id/places Добавление точки в маршрут
 * @apiName AddRoutePlace
 * @apiGroup RoutePlaces
 * @apiParam {String} id ID маршрута
 * @apiParam {String} place_id ID места
 * @apiParam {Number} order Порядковый номер точки в маршруте
 * @apiSuccess {Object} place Добавленная точка маршрута
 * @apiError {String} error Сообщение об ошибке
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;

    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, существует ли маршрут и принадлежит ли он пользователю
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single();

    if (routeError) {
      throw routeError;
    }

    if (route.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем данные для добавления
    const { place_id, order } = await request.json();

    // Проверяем, существует ли место
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('id')
      .eq('id', place_id)
      .single();

    if (placeError) {
      throw placeError;
    }

    // Добавляем точку в маршрут
    const { data, error } = await supabase
      .from('route_places')
      .insert({
        route_id: routeId,
        place_id,
        order
      })
      .select('*, places(*)')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @api {put} /api/routes/:id/places Обновление порядка точек маршрута
 * @apiName UpdateRoutePlacesOrder
 * @apiGroup RoutePlaces
 * @apiParam {String} id ID маршрута
 * @apiParam {Object[]} updates Массив объектов с новым порядком
 * @apiParam {String} updates.id ID точки маршрута
 * @apiParam {Number} updates.order Новый порядковый номер
 * @apiSuccess {Object[]} places Обновленные точки маршрута
 * @apiError {String} error Сообщение об ошибке
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;

    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, существует ли маршрут и принадлежит ли он пользователю
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single();

    if (routeError) {
      throw routeError;
    }

    if (route.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем данные для обновления
    const updates = await request.json();

    // Обновляем порядок точек
    const promises = updates.map((update: { id: string, order: number }) => {
      return supabase
        .from('route_places')
        .update({ order: update.order })
        .eq('id', update.id)
        .eq('route_id', routeId);
    });

    await Promise.all(promises);

    // Получаем обновленные точки маршрута
    const { data, error } = await supabase
      .from('route_places')
      .select('*, places(*)')
      .eq('route_id', routeId)
      .order('order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
