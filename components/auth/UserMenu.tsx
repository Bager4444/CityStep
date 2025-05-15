'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Получаем текущего пользователя при загрузке компонента
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    // Подписываемся на изменения состояния аутентификации
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      // Отписываемся при размонтировании компонента
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    window.location.href = '/'
  }

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
  }

  if (!user) {
    return (
      <Link 
        href="/auth" 
        className="text-gray-600 hover:text-green-600 transition-colors"
      >
        Войти
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
      >
        <span>{user.email?.split('@')[0]}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <Link 
            href="/profile" 
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Мой профиль
          </Link>
          <Link 
            href="/saved-routes" 
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Мои маршруты
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
