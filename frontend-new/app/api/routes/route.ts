import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

/**
 * @api {get} /api/routes Получение всех маршрутов пользователя
 * @apiName GetRoutes
 * @apiGroup Routes
 * @apiSuccess {Object[]} routes Список маршрутов пользователя
 * @apiError {String} error Сообщение об ошибке
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем маршруты пользователя
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @api {post} /api/routes Создание нового маршрута
 * @apiName CreateRoute
 * @apiGroup Routes
 * @apiParam {String} name Название маршрута
 * @apiParam {String} start_point_name Название начальной точки
 * @apiParam {Number} start_latitude Широта начальной точки
 * @apiParam {Number} start_longitude Долгота начальной точки
 * @apiParam {String} end_point_name Название конечной точки
 * @apiParam {Number} end_latitude Широта конечной точки
 * @apiParam {Number} end_longitude Долгота конечной точки
 * @apiParam {Number} travel_time Время пути (в часах)
 * @apiSuccess {Object} route Созданный маршрут
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

    // Получаем данные маршрута из запроса
    const routeData = await request.json();

    // Добавляем ID пользователя
    routeData.user_id = user.id;

    // Сохраняем маршрут в базу данных
    const { data, error } = await supabase
      .from('routes')
      .insert(routeData)
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
