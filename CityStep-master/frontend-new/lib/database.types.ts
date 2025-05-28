export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string
          name: string
          description: string | null
          type: 'attraction' | 'cafe' | 'restaurant' | 'shop' | 'park' | 'exhibition'
          latitude: number
          longitude: number
          estimated_time: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: 'attraction' | 'cafe' | 'restaurant' | 'shop' | 'park' | 'exhibition'
          latitude: number
          longitude: number
          estimated_time: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: 'attraction' | 'cafe' | 'restaurant' | 'shop' | 'park' | 'exhibition'
          latitude?: number
          longitude?: number
          estimated_time?: number
          image_url?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      route_places: {
        Row: {
          id: string
          route_id: string
          place_id: string
          order: number
        }
        Insert: {
          id?: string
          route_id: string
          place_id: string
          order: number
        }
        Update: {
          id?: string
          route_id?: string
          place_id?: string
          order?: number
        }
      }
      routes: {
        Row: {
          id: string
          name: string
          user_id: string
          start_point_name: string
          start_latitude: number
          start_longitude: number
          end_point_name: string
          end_latitude: number
          end_longitude: number
          travel_time: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          start_point_name: string
          start_latitude: number
          start_longitude: number
          end_point_name: string
          end_latitude: number
          end_longitude: number
          travel_time: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          start_point_name?: string
          start_latitude?: number
          start_longitude?: number
          end_point_name?: string
          end_latitude?: number
          end_longitude?: number
          travel_time?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
