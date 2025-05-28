import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthForms.css'

const RegisterForm = ({ onSwitchToLogin, onClose }) => {
  const { register, loading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    // Проверка имени
    if (!formData.firstName.trim()) {
      errors.firstName = 'Имя обязательно'
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'Имя должно содержать минимум 2 символа'
    }
    
    // Проверка фамилии
    if (!formData.lastName.trim()) {
      errors.lastName = 'Фамилия обязательна'
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Фамилия должна содержать минимум 2 символа'
    }
    
    // Проверка email
    if (!formData.email.trim()) {
      errors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Некорректный формат email'
    }
    
    // Проверка пароля
    if (!formData.password) {
      errors.password = 'Пароль обязателен'
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов'
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Пароль должен содержать буквы и цифры'
    }
    
    // Проверка подтверждения пароля
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают'
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
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      })
      
      // Закрываем модальное окно после успешной регистрации
      onClose()
    } catch (error) {
      // Ошибка уже обработана в контексте
      console.error('Ошибка регистрации:', error.message)
    }
  }

  return (
    <div className="auth-form">
      <div className="auth-form-header">
        <h2>Регистрация</h2>
        <p>Создайте аккаунт для сохранения избранных мест</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-content">
        {/* Общая ошибка */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* Имя */}
        <div className="form-group">
          <label htmlFor="firstName">Имя *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={formErrors.firstName ? 'error' : ''}
            placeholder="Введите ваше имя"
            disabled={loading}
          />
          {formErrors.firstName && (
            <span className="field-error">{formErrors.firstName}</span>
          )}
        </div>

        {/* Фамилия */}
        <div className="form-group">
          <label htmlFor="lastName">Фамилия *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={formErrors.lastName ? 'error' : ''}
            placeholder="Введите вашу фамилию"
            disabled={loading}
          />
          {formErrors.lastName && (
            <span className="field-error">{formErrors.lastName}</span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={formErrors.email ? 'error' : ''}
            placeholder="example@mail.ru"
            disabled={loading}
          />
          {formErrors.email && (
            <span className="field-error">{formErrors.email}</span>
          )}
        </div>

        {/* Пароль */}
        <div className="form-group">
          <label htmlFor="password">Пароль *</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={formErrors.password ? 'error' : ''}
              placeholder="Минимум 6 символов"
              disabled={loading}
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

        {/* Подтверждение пароля */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Подтвердите пароль *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={formErrors.confirmPassword ? 'error' : ''}
            placeholder="Повторите пароль"
            disabled={loading}
          />
          {formErrors.confirmPassword && (
            <span className="field-error">{formErrors.confirmPassword}</span>
          )}
        </div>

        {/* Кнопки */}
        <div className="auth-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </div>

        {/* Переключение на вход */}
        <div className="auth-form-switch">
          <p>
            Уже есть аккаунт?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Войти
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}

export default RegisterForm
