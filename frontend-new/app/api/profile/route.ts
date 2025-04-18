import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

/**
 * @api {get} /api/profile Получение профиля текущего пользователя
 * @apiName GetProfile
 * @apiGroup Profile
 * @apiSuccess {Object} profile Профиль пользователя
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
    
    // Получаем профиль пользователя
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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
 * @api {put} /api/profile Обновление профиля текущего пользователя
 * @apiName UpdateProfile
 * @apiGroup Profile
 * @apiParam {String} username Имя пользователя
 * @apiParam {String} avatar_url URL аватара пользователя
 * @apiSuccess {Object} profile Обновленный профиль пользователя
 * @apiError {String} error Сообщение об ошибке
 */
export async function PUT(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const supabaseClient = createServerComponentClient<Database>({ cookies: () => request.cookies });
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Получаем данные для обновления
    const updateData = await request.json();
    
    // Обновляем профиль пользователя
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
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
