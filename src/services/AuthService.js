/**
 * Сервис для работы с аутентификацией пользователей
 * Использует localStorage для демонстрации (в реальном проекте - API)
 */
class AuthService {
  constructor() {
    this.storageKey = 'citystep_users'
    this.currentUserKey = 'citystep_current_user'
    this.initializeStorage()
  }

  /**
   * Инициализация хранилища пользователей
   */
  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      // Создаем демо-пользователя для тестирования
      const demoUser = {
        id: 'demo-user-1',
        email: 'demo@example.com',
        password: 'demo123',
        firstName: 'Демо',
        lastName: 'Пользователь',
        createdAt: new Date().toISOString(),
        favorites: [
          {
            lat: 55.7558,
            lon: 37.6176,
            display_name: 'Красная площадь, Москва',
            addedAt: new Date().toISOString()
          }
        ],
        searchHistory: [],
        routeHistory: []
      }

      localStorage.setItem(this.storageKey, JSON.stringify([demoUser]))
    }
  }

  /**
   * Получение всех пользователей из localStorage
   */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || []
    } catch (error) {
      console.error('Ошибка при получении пользователей:', error)
      return []
    }
  }

  /**
   * Сохранение пользователей в localStorage
   */
  saveUsers(users) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(users))
    } catch (error) {
      console.error('Ошибка при сохранении пользователей:', error)
      throw new Error('Не удалось сохранить данные пользователя')
    }
  }

  /**
   * Валидация email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Валидация пароля
   */
  validatePassword(password) {
    // Минимум 6 символов, хотя бы одна буква и одна цифра
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/
    return passwordRegex.test(password)
  }

  /**
   * Регистрация нового пользователя
   */
  async register(userData) {
    const { email, password, firstName, lastName } = userData

    // Валидация данных
    if (!email || !password || !firstName || !lastName) {
      throw new Error('Все поля обязательны для заполнения')
    }

    if (!this.validateEmail(email)) {
      throw new Error('Некорректный формат email')
    }

    if (!this.validatePassword(password)) {
      throw new Error('Пароль должен содержать минимум 6 символов, включая буквы и цифры')
    }

    const users = this.getUsers()

    // Проверка на существование пользователя
    if (users.find(user => user.email === email)) {
      throw new Error('Пользователь с таким email уже существует')
    }

    // Создание нового пользователя
    const newUser = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      password: password, // В реальном проекте пароль должен быть захеширован
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      favorites: [],
      searchHistory: [],
      routeHistory: []
    }

    users.push(newUser)
    this.saveUsers(users)

    // Автоматический вход после регистрации
    const userForStorage = { ...newUser }
    delete userForStorage.password // Не сохраняем пароль в текущей сессии
    localStorage.setItem(this.currentUserKey, JSON.stringify(userForStorage))

    console.log('✅ Пользователь успешно зарегистрирован:', newUser.email)
    return userForStorage
  }

  /**
   * Вход в систему
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email и пароль обязательны')
    }

    const users = this.getUsers()
    const user = users.find(u => u.email === email.toLowerCase() && u.password === password)

    if (!user) {
      throw new Error('Неверный email или пароль')
    }

    // Сохраняем текущего пользователя без пароля
    const userForStorage = { ...user }
    delete userForStorage.password
    localStorage.setItem(this.currentUserKey, JSON.stringify(userForStorage))

    console.log('✅ Пользователь успешно вошел в систему:', user.email)
    return userForStorage
  }

  /**
   * Выход из системы
   */
  logout() {
    localStorage.removeItem(this.currentUserKey)
    console.log('✅ Пользователь вышел из системы')
  }

  /**
   * Получение текущего пользователя
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(this.currentUserKey)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Ошибка при получении текущего пользователя:', error)
      return null
    }
  }

  /**
   * Проверка, авторизован ли пользователь
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null
  }

  /**
   * Обновление данных пользователя
   */
  async updateUser(updatedData) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('Пользователь не авторизован')
    }

    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === currentUser.id)

    if (userIndex === -1) {
      throw new Error('Пользователь не найден')
    }

    // Обновляем данные пользователя
    users[userIndex] = { ...users[userIndex], ...updatedData, updatedAt: new Date().toISOString() }
    this.saveUsers(users)

    // Обновляем текущего пользователя в сессии
    const updatedUser = { ...users[userIndex] }
    delete updatedUser.password
    localStorage.setItem(this.currentUserKey, JSON.stringify(updatedUser))

    return updatedUser
  }

  /**
   * Добавление места в избранное
   */
  async addToFavorites(place) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('Необходимо войти в систему')
    }

    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === currentUser.id)

    if (userIndex === -1) {
      throw new Error('Пользователь не найден')
    }

    // Проверяем, нет ли уже такого места в избранном
    const favorites = users[userIndex].favorites || []
    const exists = favorites.find(fav =>
      Math.abs(fav.lat - place.lat) < 0.0001 && Math.abs(fav.lon - place.lon) < 0.0001
    )

    if (exists) {
      throw new Error('Место уже добавлено в избранное')
    }

    // Добавляем место в избранное
    const favoritePlace = {
      ...place,
      addedAt: new Date().toISOString()
    }

    users[userIndex].favorites = [...favorites, favoritePlace]
    this.saveUsers(users)

    // Обновляем текущего пользователя
    const updatedUser = { ...users[userIndex] }
    delete updatedUser.password
    localStorage.setItem(this.currentUserKey, JSON.stringify(updatedUser))

    return updatedUser
  }

  /**
   * Удаление места из избранного
   */
  async removeFromFavorites(place) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('Необходимо войти в систему')
    }

    const users = this.getUsers()
    const userIndex = users.findIndex(u => u.id === currentUser.id)

    if (userIndex === -1) {
      throw new Error('Пользователь не найден')
    }

    // Удаляем место из избранного
    const favorites = users[userIndex].favorites || []
    users[userIndex].favorites = favorites.filter(fav =>
      !(Math.abs(fav.lat - place.lat) < 0.0001 && Math.abs(fav.lon - place.lon) < 0.0001)
    )

    this.saveUsers(users)

    // Обновляем текущего пользователя
    const updatedUser = { ...users[userIndex] }
    delete updatedUser.password
    localStorage.setItem(this.currentUserKey, JSON.stringify(updatedUser))

    return updatedUser
  }
}

// Создаем единственный экземпляр сервиса
const authService = new AuthService()
export default authService
