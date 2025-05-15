import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

/**
 * @api {get} /api/places Получение всех мест
 * @apiName GetPlaces
 * @apiGroup Places
 * @apiParam {String} [type] Тип места для фильтрации
 * @apiParam {String} [query] Поисковый запрос
 * @apiSuccess {Object[]} places Список мест
 * @apiError {String} error Сообщение об ошибке
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем параметры запроса
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    // Базовый запрос
    let queryBuilder = supabase
      .from('places')
      .select('*');

    // Фильтрация по типу
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // Поиск по названию или описанию
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Выполняем запрос
    const { data, error } = await queryBuilder.order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @api {post} /api/places Создание нового места
 * @apiName CreatePlace
 * @apiGroup Places
 * @apiParam {String} name Название места
 * @apiParam {String} description Описание места
 * @apiParam {String} type Тип места
 * @apiParam {Number} latitude Широта
 * @apiParam {Number} longitude Долгота
 * @apiParam {Number} estimated_time Примерное время посещения (в минутах)
 * @apiParam {String} [image_url] URL изображения
 * @apiSuccess {Object} place Созданное место
 * @apiError {String} error Сообщение об ошибке
 */
export async function POST(request: NextRequest) {
  try {
    // В реальном приложении здесь должна быть проверка прав администратора

    // Получаем данные места из запроса
    const placeData = await request.json();

    // Сохраняем место в базу данных
    const { data, error } = await supabase
      .from('places')
      .insert(placeData)
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
