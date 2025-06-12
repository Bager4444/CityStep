import { useState, useEffect } from 'react'
import './RouteAnalysisPanel.css'

/**
 * 📊 Панель анализа приоритизации маршрута
 * Отображает детальную информацию о приоритетах и рекомендации
 */
const RouteAnalysisPanel = ({ 
  analysisData, 
  isVisible, 
  onClose,
  onAlternativeSelect 
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSegment, setSelectedSegment] = useState(null)

  useEffect(() => {
    if (isVisible && analysisData) {
      setActiveTab('overview')
      setSelectedSegment(null)
    }
  }, [isVisible, analysisData])

  if (!isVisible || !analysisData) {
    return null
  }

  const { prioritizedSegments, routePriority, alternatives, recommendations, metadata } = analysisData

  const formatPriority = (priority) => {
    const percentage = Math.round(priority * 100)
    let color = '#dc3545' // красный
    if (percentage >= 70) color = '#28a745' // зеленый
    else if (percentage >= 50) color = '#ffc107' // желтый
    else if (percentage >= 30) color = '#fd7e14' // оранжевый
    
    return { percentage, color }
  }

  const getPriorityIcon = (priority) => {
    if (priority >= 0.8) return '🟢'
    if (priority >= 0.6) return '🟡'
    if (priority >= 0.4) return '🟠'
    return '🔴'
  }

  return (
    <div className="route-analysis-overlay">
      <div className="route-analysis-panel">
        <div className="analysis-header">
          <h2>📊 Анализ маршрута</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="analysis-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Обзор
          </button>
          <button 
            className={`tab ${activeTab === 'segments' ? 'active' : ''}`}
            onClick={() => setActiveTab('segments')}
          >
            🛣️ Сегменты
          </button>
          <button 
            className={`tab ${activeTab === 'alternatives' ? 'active' : ''}`}
            onClick={() => setActiveTab('alternatives')}
          >
            🔄 Альтернативы
          </button>
          <button 
            className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            💡 Советы
          </button>
        </div>

        <div className="analysis-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="route-summary">
                <div className="priority-score">
                  <div className="score-circle" style={{ 
                    background: `conic-gradient(${formatPriority(routePriority).color} ${formatPriority(routePriority).percentage}%, #e0e0e0 0%)` 
                  }}>
                    <span className="score-value">{formatPriority(routePriority).percentage}%</span>
                  </div>
                  <h3>Общий приоритет маршрута</h3>
                </div>

                <div className="route-stats">
                  <div className="stat-item">
                    <span className="stat-icon">🛣️</span>
                    <span className="stat-label">Сегментов</span>
                    <span className="stat-value">{prioritizedSegments.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🟢</span>
                    <span className="stat-label">Высокий приоритет</span>
                    <span className="stat-value">
                      {prioritizedSegments.filter(s => s.priority > 0.7).length}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🔴</span>
                    <span className="stat-label">Низкий приоритет</span>
                    <span className="stat-value">
                      {prioritizedSegments.filter(s => s.priority < 0.4).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="factors-breakdown">
                <h4>📊 Анализ факторов</h4>
                <div className="factors-chart">
                  {Object.entries(metadata.factorsUsed || {}).map(([factor, weight]) => (
                    <div key={factor} className="factor-bar">
                      <div className="factor-info">
                        <span className="factor-icon">
                          {factor === 'speed' && '⚡'}
                          {factor === 'safety' && '🛡️'}
                          {factor === 'traffic' && '🚦'}
                          {factor === 'ecology' && '🌱'}
                          {factor === 'comfort' && '😌'}
                        </span>
                        <span className="factor-name">
                          {factor === 'speed' && 'Скорость'}
                          {factor === 'safety' && 'Безопасность'}
                          {factor === 'traffic' && 'Трафик'}
                          {factor === 'ecology' && 'Экология'}
                          {factor === 'comfort' && 'Комфорт'}
                        </span>
                        <span className="factor-weight">{Math.round(weight * 100)}%</span>
                      </div>
                      <div className="factor-progress">
                        <div 
                          className="factor-fill" 
                          style={{ width: `${weight * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="segments-tab">
              <h3>🛣️ Детализация по сегментам</h3>
              <div className="segments-list">
                {prioritizedSegments.map((segment, index) => (
                  <div 
                    key={segment.id} 
                    className={`segment-item ${selectedSegment === index ? 'selected' : ''}`}
                    onClick={() => setSelectedSegment(selectedSegment === index ? null : index)}
                  >
                    <div className="segment-header">
                      <span className="segment-icon">{getPriorityIcon(segment.priority)}</span>
                      <span className="segment-name">Сегмент {index + 1}</span>
                      <span className="segment-priority">
                        {formatPriority(segment.priority).percentage}%
                      </span>
                    </div>
                    
                    {selectedSegment === index && (
                      <div className="segment-details">
                        <div className="segment-info">
                          <div className="info-item">
                            <span>🛣️ Тип дороги:</span>
                            <span>{segment.roadType}</span>
                          </div>
                          <div className="info-item">
                            <span>📏 Расстояние:</span>
                            <span>{Math.round(segment.distance)} м</span>
                          </div>
                          <div className="info-item">
                            <span>🚦 Трафик:</span>
                            <span>{Math.round(segment.trafficLevel * 100)}%</span>
                          </div>
                          <div className="info-item">
                            <span>🛡️ Безопасность:</span>
                            <span>{Math.round(segment.safetyScore * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="segment-scores">
                          <h5>Оценки по факторам:</h5>
                          {Object.entries(segment.scores).map(([factor, score]) => (
                            <div key={factor} className="score-item">
                              <span className="score-label">
                                {factor === 'speed' && '⚡ Скорость'}
                                {factor === 'safety' && '🛡️ Безопасность'}
                                {factor === 'traffic' && '🚦 Трафик'}
                                {factor === 'ecology' && '🌱 Экология'}
                                {factor === 'comfort' && '😌 Комфорт'}
                              </span>
                              <div className="score-bar">
                                <div 
                                  className="score-fill" 
                                  style={{ width: `${score * 100}%` }}
                                ></div>
                              </div>
                              <span className="score-value">{Math.round(score * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alternatives' && (
            <div className="alternatives-tab">
              <h3>🔄 Альтернативные маршруты</h3>
              <p className="tab-description">
                Выберите альтернативный профиль маршрутизации для получения других вариантов.
              </p>
              
              <div className="alternatives-grid">
                {alternatives.map(alternative => (
                  <div key={alternative.type} className="alternative-card">
                    <div className="alternative-header">
                      <h4>{alternative.name}</h4>
                      <p>{alternative.description}</p>
                    </div>
                    
                    <div className="alternative-config">
                      {Object.entries(alternative.config).map(([factor, weight]) => (
                        <div key={factor} className="config-item">
                          <span className="config-factor">
                            {factor === 'speed' && '⚡'}
                            {factor === 'safety' && '🛡️'}
                            {factor === 'traffic' && '🚦'}
                            {factor === 'ecology' && '🌱'}
                            {factor === 'comfort' && '😌'}
                          </span>
                          <span className="config-weight">{Math.round(weight * 100)}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      className="select-alternative-btn"
                      onClick={() => onAlternativeSelect && onAlternativeSelect(alternative)}
                    >
                      Выбрать маршрут
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="recommendations-tab">
              <h3>💡 Рекомендации</h3>
              
              {recommendations.length === 0 ? (
                <div className="no-recommendations">
                  <span className="success-icon">✅</span>
                  <h4>Отличный маршрут!</h4>
                  <p>Никаких особых рекомендаций. Маршрут оптимален по всем параметрам.</p>
                </div>
              ) : (
                <div className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-item ${rec.type}`}>
                      <div className="rec-icon">{rec.icon}</div>
                      <div className="rec-content">
                        <h4>{rec.title}</h4>
                        <p>{rec.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="general-tips">
                <h4>📋 Общие советы</h4>
                <ul>
                  <li>🕐 Учитывайте время суток при планировании поездки</li>
                  <li>🌤️ Проверяйте погодные условия перед выездом</li>
                  <li>🚦 Следите за дорожной обстановкой в реальном времени</li>
                  <li>⛽ Планируйте остановки для заправки и отдыха</li>
                  <li>📱 Держите телефон заряженным для навигации</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RouteAnalysisPanel
