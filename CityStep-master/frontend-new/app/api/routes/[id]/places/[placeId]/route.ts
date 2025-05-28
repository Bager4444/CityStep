import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

/**
 * @api {delete} /api/routes/:id/places/:placeId Удаление точки из маршрута
 * @apiName DeleteRoutePlace
 * @apiGroup RoutePlaces
 * @apiParam {String} id ID маршрута
 * @apiParam {String} placeId ID места
 * @apiSuccess {Object} success Успешное удаление
 * @apiError {String} error Сообщение об ошибке
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, placeId: string } }
) {
  try {
    const routeId = params.id;
    const placeId = params.placeId;

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

    // Удаляем точку из маршрута
    const { error } = await supabase
      .from('route_places')
      .delete()
      .eq('route_id', routeId)
      .eq('place_id', placeId);

    if (error) {
      throw error;
    }

    // Перенумеровываем оставшиеся точки
    const { data: remainingPlaces, error: fetchError } = await supabase
      .from('route_places')
      .select('id, order')
      .eq('route_id', routeId)
      .order('order', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    // Обновляем порядок оставшихся точек
    const updatePromises = remainingPlaces.map((place, index) => {
      return supabase
        .from('route_places')
        .update({ order: index + 1 })
        .eq('id', place.id);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
