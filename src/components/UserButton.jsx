import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import UserProfile from './UserProfile'
import './UserButton.css'

const UserButton = ({ onAuthModalChange }) => {
  const { user, isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' или 'register'

  // Уведомляем родительский компонент об изменении состояния модального окна
  useEffect(() => {
    if (onAuthModalChange) {
      onAuthModalChange(showAuthModal || showProfile)
    }
  }, [showAuthModal, showProfile, onAuthModalChange])

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

  // Открытие профиля
  const handleProfileClick = () => {
    setShowProfile(true)
  }

  // Закрытие модальных окон
  const handleCloseAuth = () => {
    setShowAuthModal(false)
  }

  const handleCloseProfile = () => {
    setShowProfile(false)
  }

  if (isAuthenticated) {
    // Пользователь авторизован - показываем кнопку профиля
    return (
      <>
        <div className="user-button-container">
          <button
            className="user-profile-button"
            onClick={handleProfileClick}
            title={`${user.firstName} ${user.lastName}`}
          >
            <div className="user-avatar">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <span className="user-name">
              {user.firstName}
            </span>
          </button>
        </div>

        {/* Модальное окно профиля */}
        {showProfile && (
          <div className="profile-modal-backdrop" onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseProfile()
            }
          }}>
            <UserProfile onClose={handleCloseProfile} />
          </div>
        )}
      </>
    )
  }

  // Пользователь не авторизован - показываем кнопки входа и регистрации
  return (
    <>
      <div className="user-button-container">
        <div className="auth-buttons">
          <button
            className="auth-button login-button"
            onClick={handleLoginClick}
          >
            🔑 Вход
          </button>
          <button
            className="auth-button register-button"
            onClick={handleRegisterClick}
          >
            📝 Регистрация
          </button>
        </div>
      </div>

      {/* Модальное окно аутентификации */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuth}
        initialMode={authMode}
      />
    </>
  )
}

export default UserButton
