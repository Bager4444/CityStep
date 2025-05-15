import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

/**
 * @api {get} /api/routes/:id Получение конкретного маршрута
 * @apiName GetRoute
 * @apiGroup Routes
 * @apiParam {String} id ID маршрута
 * @apiSuccess {Object} route Маршрут с точками
 * @apiError {String} error Сообщение об ошибке
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    // Получаем маршрут
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();

    if (routeError) {
      throw routeError;
    }

    // Проверяем, принадлежит ли маршрут пользователю
    if (user && route.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем точки маршрута
    const { data: routePlaces, error: placesError } = await supabase
      .from('route_places')
      .select('*, places(*)')
      .eq('route_id', id)
      .order('order', { ascending: true });

    if (placesError) {
      throw placesError;
    }

    return NextResponse.json({
      ...route,
      places: routePlaces.map(rp => rp.places)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @api {put} /api/routes/:id Обновление маршрута
 * @apiName UpdateRoute
 * @apiGroup Routes
 * @apiParam {String} id ID маршрута
 * @apiParam {String} [name] Название маршрута
 * @apiParam {String} [start_point_name] Название начальной точки
 * @apiParam {Number} [start_latitude] Широта начальной точки
 * @apiParam {Number} [start_longitude] Долгота начальной точки
 * @apiParam {String} [end_point_name] Название конечной точки
 * @apiParam {Number} [end_latitude] Широта конечной точки
 * @apiParam {Number} [end_longitude] Долгота конечной точки
 * @apiParam {Number} [travel_time] Время пути (в часах)
 * @apiSuccess {Object} route Обновленный маршрут
 * @apiError {String} error Сообщение об ошибке
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Получаем текущего пользователя
    const supabaseClient = createRouteClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, существует ли маршрут и принадлежит ли он пользователю
    const { data: existingRoute, error: checkError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) {
      throw checkError;
    }

    if (existingRoute.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем данные для обновления
    const updateData = await request.json();

    // Обновляем маршрут
    const { data, error } = await supabase
      .from('routes')
      .update(updateData)
      .eq('id', id)
      .select()
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
 * @api {delete} /api/routes/:id Удаление маршрута
 * @apiName DeleteRoute
 * @apiGroup Routes
 * @apiParam {String} id ID маршрута
 * @apiSuccess {Object} success Успешное удаление
 * @apiError {String} error Сообщение об ошибке
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, существует ли маршрут и принадлежит ли он пользователю
    const { data: existingRoute, error: checkError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) {
      throw checkError;
    }

    if (existingRoute.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Удаляем связанные точки маршрута
    await supabase
      .from('route_places')
      .delete()
      .eq('route_id', id);

    // Удаляем маршрут
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
