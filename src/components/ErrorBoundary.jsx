import React from 'react'

/**
 * 🛡️ Error Boundary для предотвращения белого экрана
 * Перехватывает ошибки React и показывает пользователю понятное сообщение
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы показать fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку для отладки
    console.error('🚨 Error Boundary перехватил ошибку:', error)
    console.error('📍 Информация об ошибке:', errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  handleReload = () => {
    // Перезагружаем страницу
    window.location.reload()
  }

  handleReset = () => {
    // Сбрасываем состояние ошибки
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚨</div>
            
            <h1 style={{ 
              color: '#e74c3c', 
              marginBottom: '16px',
              fontSize: '24px'
            }}>
              Произошла ошибка
            </h1>
            
            <p style={{ 
              color: '#666', 
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              К сожалению, что-то пошло не так. Это может быть связано с:
            </p>

            <ul style={{
              textAlign: 'left',
              color: '#666',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              <li>🌐 Проблемами с подключением к интернету</li>
              <li>📍 Некорректными координатами промежуточных точек</li>
              <li>🗺️ Временными проблемами сервиса карт</li>
              <li>⚡ Перегрузкой приложения</li>
            </ul>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                🔄 Попробовать снова
              </button>
              
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
              >
                🔃 Перезагрузить страницу
              </button>
            </div>

            {/* Показываем детали ошибки в режиме разработки */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '32px',
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}>
                  🔍 Детали ошибки (для разработчиков)
                </summary>
                
                <div style={{
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  color: '#e74c3c',
                  marginBottom: '12px'
                }}>
                  <strong>Ошибка:</strong><br />
                  {this.state.error.toString()}
                </div>
                
                {this.state.errorInfo && (
                  <div style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#666',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <strong>Stack trace:</strong><br />
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </details>
            )}

            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#2d5a2d'
            }}>
              💡 <strong>Совет:</strong> Если проблема повторяется, попробуйте:
              <br />• Очистить кэш браузера
              <br />• Проверить подключение к интернету
              <br />• Использовать другой браузер
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
