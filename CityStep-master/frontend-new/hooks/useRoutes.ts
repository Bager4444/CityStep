'use client'

import { useState, useEffect } from 'react'
import { Route } from '@/lib/supabase'

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка маршрутов
  const fetchRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/routes')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при загрузке маршрутов')
      }
      
      const data = await response.json()
      setRoutes(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Получение конкретного маршрута
  const getRoute = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/routes/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при загрузке маршрута')
      }
      
      return await response.json()
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Создание маршрута
  const createRoute = async (routeData: Omit<Route, 'id' | 'user_id' | 'created_at'>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при создании маршрута')
      }
      
      const newRoute = await response.json()
      setRoutes(prev => [newRoute, ...prev])
      
      return newRoute
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Удаление маршрута
  const deleteRoute = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/routes/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при удалении маршрута')
      }
      
      setRoutes(prev => prev.filter(route => route.id !== id))
      
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Загружаем маршруты при монтировании компонента
  useEffect(() => {
    fetchRoutes()
  }, [])

  return {
    routes,
    loading,
    error,
    fetchRoutes,
    getRoute,
    createRoute,
    deleteRoute,
  }
}
