import { useState } from 'react'
import AuthModal from './AuthModal'
import './WelcomeScreen.css'

const WelcomeScreen = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' или 'register'

  // Открытие модального окна входа
  const handleLoginClick = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  // Открытие модального окна регистрации
  const handleRegisterClick = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  // Закрытие модального окна
  const handleCloseAuth = () => {
    setShowAuthModal(false)
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        {/* Заголовок */}
        <div className="welcome-header">
          <div className="welcome-logo">
            <span className="logo-icon">🗺️</span>
            <h1 className="logo-text">CityStep</h1>
          </div>
          <p className="welcome-subtitle">
            Ваш умный помощник для навигации по городу
          </p>
        </div>

        {/* Основной контент */}
        <div className="welcome-content">
          <div className="welcome-description">
            <h2>Добро пожаловать в CityStep!</h2>
            <p>
              Современное приложение для поиска мест, построения маршрутов 
              и навигации по городу. Войдите или зарегистрируйтесь, чтобы 
              начать пользоваться всеми возможностями.
            </p>
          </div>

          {/* Функции приложения */}
          <div className="welcome-features">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Поиск мест</h3>
              <p>Находите адреса, достопримечательности и интересные места</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🚗</div>
              <h3>Маршруты</h3>
              <p>Строите оптимальные маршруты для разных видов транспорта</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Избранное</h3>
              <p>Сохраняйте любимые места для быстрого доступа</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Геолокация</h3>
              <p>Используйте ваше текущее местоположение для навигации</p>
            </div>
          </div>

          {/* Кнопки аутентификации */}
          <div className="welcome-actions">
            <button
              className="welcome-btn welcome-btn-primary"
              onClick={handleLoginClick}
            >
              🔑 Войти
            </button>
            
            <button
              className="welcome-btn welcome-btn-secondary"
              onClick={handleRegisterClick}
            >
              📝 Зарегистрироваться
            </button>
          </div>

          {/* Демо-доступ */}
          <div className="welcome-demo">
            <p>
              Для быстрого тестирования используйте демо-аккаунт при входе
            </p>
          </div>
        </div>

        {/* Футер */}
        <div className="welcome-footer">
          <p>&copy; 2024 CityStep. Умная навигация для современного города.</p>
        </div>
      </div>

      {/* Модальное окно аутентификации */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuth}
        initialMode={authMode}
      />
    </div>
  )
}

export default WelcomeScreen
