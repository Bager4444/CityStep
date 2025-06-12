import { useState, useEffect } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import './AuthModal.css'

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode) // 'login' или 'register'

  // Сброс режима при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  // Обработка нажатия Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Блокируем прокрутку страницы
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Обработка клика по фону
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Переключение между формами
  const switchToLogin = () => setMode('login')
  const switchToRegister = () => setMode('register')

  if (!isOpen) {
    return null
  }

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal">
        {/* Кнопка закрытия */}
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>

        {/* Содержимое модального окна */}
        <div className="auth-modal-content">
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={switchToRegister}
              onClose={onClose}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={switchToLogin}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
