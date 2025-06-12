import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthForms.css'

const LoginForm = ({ onSwitchToRegister, onClose }) => {
  const { login, loading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  // Обработка изменений в полях формы
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Очищаем ошибки при изменении поля
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Очищаем общую ошибку
    if (error) {
      clearError()
    }
  }

  // Валидация формы
  const validateForm = () => {
    const errors = {}
    
    // Проверка email
    if (!formData.email.trim()) {
      errors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Некорректный формат email'
    }
    
    // Проверка пароля
    if (!formData.password) {
      errors.password = 'Пароль обязателен'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      await login(formData.email.trim(), formData.password)
      
      // Закрываем модальное окно после успешного входа
      onClose()
    } catch (error) {
      // Ошибка уже обработана в контексте
      console.error('Ошибка входа:', error.message)
    }
  }

  // Демо-данные для быстрого входа
  const fillDemoData = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'demo123'
    })
    clearError()
    setFormErrors({})
  }

  return (
    <div className="auth-form">
      <div className="auth-form-header">
        <h2>Вход в систему</h2>
        <p>Войдите в свой аккаунт для доступа к избранным местам</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-content">
        {/* Общая ошибка */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={formErrors.email ? 'error' : ''}
            placeholder="example@mail.ru"
            disabled={loading}
            autoComplete="email"
          />
          {formErrors.email && (
            <span className="field-error">{formErrors.email}</span>
          )}
        </div>

        {/* Пароль */}
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={formErrors.password ? 'error' : ''}
              placeholder="Введите пароль"
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.password && (
            <span className="field-error">{formErrors.password}</span>
          )}
        </div>

        {/* Демо-данные */}
        <div className="demo-section">
          <button
            type="button"
            className="demo-button"
            onClick={fillDemoData}
            disabled={loading}
          >
            🎯 Заполнить демо-данными
          </button>
          <small>Для быстрого тестирования</small>
        </div>

        {/* Кнопки */}
        <div className="auth-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>

        {/* Переключение на регистрацию */}
        <div className="auth-form-switch">
          <p>
            Нет аккаунта?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}

export default LoginForm
