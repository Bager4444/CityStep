import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './UserProfile.css'

const UserProfile = ({ onClose }) => {
  const { user, logout, updateUser, removeFromFavorites, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'favorites'
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  })

  // Обработка изменений в форме редактирования
  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Сохранение изменений профиля
  const handleSaveProfile = async () => {
    try {
      if (!editData.firstName.trim() || !editData.lastName.trim()) {
        alert('Имя и фамилия обязательны')
        return
      }

      await updateUser({
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim()
      })

      setIsEditing(false)
      console.log('✅ Профиль обновлен')
    } catch (error) {
      console.error('❌ Ошибка обновления профиля:', error.message)
      alert('Ошибка при обновлении профиля: ' + error.message)
    }
  }

  // Отмена редактирования
  const handleCancelEdit = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || ''
    })
    setIsEditing(false)
  }

  // Удаление места из избранного
  const handleRemoveFavorite = async (place) => {
    try {
      await removeFromFavorites(place)
      console.log('✅ Место удалено из избранного')
    } catch (error) {
      console.error('❌ Ошибка удаления из избранного:', error.message)
      alert('Ошибка при удалении из избранного: ' + error.message)
    }
  }

  // Выход из системы
  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
      logout()
      onClose()
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="user-profile">
      {/* Заголовок */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div className="profile-info">
          <h2>{user.firstName} {user.lastName}</h2>
          <p>{user.email}</p>
          <small>Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</small>
        </div>
        <button className="profile-close" onClick={onClose}>✕</button>
      </div>

      {/* Вкладки */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Профиль
        </button>
        <button
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ⭐ Избранное ({user.favorites?.length || 0})
        </button>
      </div>

      {/* Содержимое вкладок */}
      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <h3>Личные данные</h3>
            
            {!isEditing ? (
              <div className="profile-view">
                <div className="profile-field">
                  <label>Имя:</label>
                  <span>{user.firstName}</span>
                </div>
                <div className="profile-field">
                  <label>Фамилия:</label>
                  <span>{user.lastName}</span>
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                
                <div className="profile-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Редактировать
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-edit">
                <div className="form-group">
                  <label htmlFor="firstName">Имя:</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleEditChange}
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Фамилия:</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleEditChange}
                    disabled={loading}
                  />
                </div>
                
                <div className="profile-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? 'Сохранение...' : '💾 Сохранить'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    ❌ Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Кнопка выхода */}
            <div className="profile-logout">
              <button
                className="btn-danger"
                onClick={handleLogout}
              >
                🚪 Выйти из системы
              </button>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-tab">
            <h3>Избранные места</h3>
            
            {!user.favorites || user.favorites.length === 0 ? (
              <div className="empty-favorites">
                <p>У вас пока нет избранных мест</p>
                <small>Добавляйте места в избранное при поиске</small>
              </div>
            ) : (
              <div className="favorites-list">
                {user.favorites.map((place, index) => (
                  <div key={index} className="favorite-item">
                    <div className="favorite-info">
                      <h4>{place.display_name || 'Неизвестное место'}</h4>
                      <p>📍 {place.lat.toFixed(6)}, {place.lon.toFixed(6)}</p>
                      <small>
                        Добавлено: {new Date(place.addedAt).toLocaleDateString('ru-RU')}
                      </small>
                    </div>
                    <button
                      className="remove-favorite"
                      onClick={() => handleRemoveFavorite(place)}
                      title="Удалить из избранного"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
