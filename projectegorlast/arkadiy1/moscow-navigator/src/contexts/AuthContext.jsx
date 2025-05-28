import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/AuthService'

// Создаем контекст аутентификации
const AuthContext = createContext()

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}

// Провайдер контекста аутентификации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Инициализация - проверяем, есть ли сохраненный пользователь
  useEffect(() => {
    try {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        console.log('🔄 Восстановлена сессия пользователя:', currentUser.email)
      }
    } catch (error) {
      console.error('Ошибка при восстановлении сессии:', error)
      setError('Ошибка при восстановлении сессии')
    } finally {
      setLoading(false)
    }
  }, [])

  // Функция регистрации
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      const newUser = await authService.register(userData)
      setUser(newUser)
      
      console.log('✅ Регистрация успешна:', newUser.email)
      return newUser
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error.message)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Функция входа
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const loggedInUser = await authService.login(email, password)
      setUser(loggedInUser)
      
      console.log('✅ Вход успешен:', loggedInUser.email)
      return loggedInUser
    } catch (error) {
      console.error('❌ Ошибка входа:', error.message)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Функция выхода
  const logout = () => {
    try {
      authService.logout()
      setUser(null)
      setError(null)
      console.log('✅ Выход выполнен')
    } catch (error) {
      console.error('❌ Ошибка при выходе:', error)
      setError('Ошибка при выходе из системы')
    }
  }

  // Функция обновления пользователя
  const updateUser = async (updatedData) => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedUser = await authService.updateUser(updatedData)
      setUser(updatedUser)
      
      console.log('✅ Данные пользователя обновлены')
      return updatedUser
    } catch (error) {
      console.error('❌ Ошибка обновления:', error.message)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Функция добавления в избранное
  const addToFavorites = async (place) => {
    try {
      const updatedUser = await authService.addToFavorites(place)
      setUser(updatedUser)
      console.log('✅ Место добавлено в избранное')
      return updatedUser
    } catch (error) {
      console.error('❌ Ошибка добавления в избранное:', error.message)
      setError(error.message)
      throw error
    }
  }

  // Функция удаления из избранного
  const removeFromFavorites = async (place) => {
    try {
      const updatedUser = await authService.removeFromFavorites(place)
      setUser(updatedUser)
      console.log('✅ Место удалено из избранного')
      return updatedUser
    } catch (error) {
      console.error('❌ Ошибка удаления из избранного:', error.message)
      setError(error.message)
      throw error
    }
  }

  // Функция очистки ошибок
  const clearError = () => {
    setError(null)
  }

  // Проверка, находится ли место в избранном
  const isFavorite = (place) => {
    if (!user || !user.favorites) return false
    
    return user.favorites.some(fav => 
      Math.abs(fav.lat - place.lat) < 0.0001 && Math.abs(fav.lon - place.lon) < 0.0001
    )
  }

  // Значения контекста
  const value = {
    // Состояние
    user,
    loading,
    error,
    isAuthenticated: !!user,
    
    // Функции аутентификации
    register,
    login,
    logout,
    updateUser,
    
    // Функции избранного
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    
    // Утилиты
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
