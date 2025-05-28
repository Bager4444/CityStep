import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы данных для работы с базой данных
export type Profile = {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
};

export type Place = {
  id: string;
  name: string;
  description: string;
  type: 'attraction' | 'cafe' | 'restaurant' | 'shop' | 'park' | 'exhibition';
  latitude: number;
  longitude: number;
  estimated_time: number; // в минутах
  image_url?: string;
  created_at: string;
};

export type Route = {
  id: string;
  name: string;
  user_id: string;
  start_point_name: string;
  start_latitude: number;
  start_longitude: number;
  end_point_name: string;
  end_latitude: number;
  end_longitude: number;
  travel_time: number; // в часах
  created_at: string;
};

export type RoutePlace = {
  id: string;
  route_id: string;
  place_id: string;
  order: number;
};
