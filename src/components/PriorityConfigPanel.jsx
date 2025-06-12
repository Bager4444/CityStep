import { useState, useEffect } from 'react'
import './PriorityConfigPanel.css'

/**
 * 🎛️ Панель настройки приоритетов дорог
 * Позволяет пользователю настраивать факторы приоритизации маршрутов
 */
const PriorityConfigPanel = ({
  priorityService,
  onConfigChange,
  isVisible,
  onClose
}) => {
  const [config, setConfig] = useState(null)
  const [activeTab, setActiveTab] = useState('factors')
  const [presets, setPresets] = useState([])

  useEffect(() => {
    if (priorityService && isVisible) {
      setConfig(priorityService.userConfig)
      initializePresets()
    }
  }, [priorityService, isVisible])

  const initializePresets = () => {
    setPresets([
      {
        id: 'balanced',
        name: '⚖️ Сбалансированный',
        description: 'Оптимальное соотношение всех факторов для пешеходов',
        factors: { safety: 0.35, comfort: 0.25, ecology: 0.2, traffic: 0.15, speed: 0.05 }
      },
      {
        id: 'safety',
        name: '🛡️ Максимальная безопасность',
        description: 'Приоритет безопасности - тротуары и пешеходные зоны',
        factors: { safety: 0.5, comfort: 0.25, ecology: 0.15, traffic: 0.05, speed: 0.05 }
      },
      {
        id: 'comfort',
        name: '😌 Максимальный комфорт',
        description: 'Удобные пешеходные дорожки и качественное покрытие',
        factors: { comfort: 0.45, safety: 0.3, ecology: 0.15, traffic: 0.05, speed: 0.05 }
      },
      {
        id: 'eco',
        name: '🌱 Через парки',
        description: 'Маршрут через парки и зеленые зоны',
        factors: { ecology: 0.4, comfort: 0.3, safety: 0.25, traffic: 0.03, speed: 0.02 }
      },
      {
        id: 'quiet',
        name: '🔇 Тихий маршрут',
        description: 'Избегание автомобильного трафика и шума',
        factors: { traffic: 0.4, safety: 0.3, comfort: 0.2, ecology: 0.08, speed: 0.02 }
      },
      {
        id: 'shortest',
        name: '📏 Кратчайший путь',
        description: 'Самый короткий маршрут (может быть менее комфортным)',
        factors: { speed: 0.3, safety: 0.25, comfort: 0.2, ecology: 0.15, traffic: 0.1 }
      }
    ])
  }

  const handleFactorChange = (factor, value) => {
    const newFactors = { ...config.factors, [factor]: value / 100 }

    // Нормализуем значения, чтобы сумма была 1.0
    const total = Object.values(newFactors).reduce((sum, val) => sum + val, 0)
    if (total > 0) {
      Object.keys(newFactors).forEach(key => {
        newFactors[key] = newFactors[key] / total
      })
    }

    const newConfig = { ...config, factors: newFactors }
    setConfig(newConfig)

    if (priorityService) {
      priorityService.updateUserConfig(newConfig)
    }

    if (onConfigChange) {
      onConfigChange(newConfig)
    }
  }

  const applyPreset = (preset) => {
    const newConfig = { ...config, factors: preset.factors }
    setConfig(newConfig)

    if (priorityService) {
      priorityService.updateUserConfig(newConfig)
    }

    if (onConfigChange) {
      onConfigChange(newConfig)
    }
  }

  const resetToDefaults = () => {
    if (priorityService) {
      priorityService.resetToDefaults()
      setConfig(priorityService.userConfig)

      if (onConfigChange) {
        onConfigChange(priorityService.userConfig)
      }
    }
  }

  if (!isVisible || !config) {
    return null
  }

  return (
    <div className="priority-config-overlay">
      <div className="priority-config-panel">
        <div className="config-header">
          <h2>🎛️ Настройка приоритетов маршрута</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="config-tabs">
          <button
            className={`tab ${activeTab === 'factors' ? 'active' : ''}`}
            onClick={() => setActiveTab('factors')}
          >
            📊 Факторы
          </button>
          <button
            className={`tab ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            🎯 Пресеты
          </button>
          <button
            className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            ⚙️ Дополнительно
          </button>
        </div>

        <div className="config-content">
          {activeTab === 'factors' && (
            <div className="factors-tab">
              <h3>Настройка весов факторов для пешеходов</h3>
              <p className="tab-description">
                Настройте важность каждого фактора при выборе пешеходного маршрута.
                Значения автоматически нормализуются для оптимального баланса.
              </p>

              <div className="factors-list">
                {Object.entries(config.factors).map(([factor, value]) => (
                  <div key={factor} className="factor-control">
                    <div className="factor-info">
                      <span className="factor-icon">
                        {factor === 'speed' && '⚡'}
                        {factor === 'safety' && '🛡️'}
                        {factor === 'traffic' && '🚦'}
                        {factor === 'ecology' && '🌱'}
                        {factor === 'comfort' && '😌'}
                      </span>
                      <span className="factor-name">
                        {factor === 'speed' && 'Скорость ходьбы'}
                        {factor === 'safety' && 'Безопасность'}
                        {factor === 'traffic' && 'Избегание трафика'}
                        {factor === 'ecology' && 'Парки и зелень'}
                        {factor === 'comfort' && 'Комфорт ходьбы'}
                      </span>
                      <span className="factor-value">{Math.round(value * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(value * 100)}
                      onChange={(e) => handleFactorChange(factor, parseInt(e.target.value))}
                      className="factor-slider"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="presets-tab">
              <h3>Готовые настройки</h3>
              <p className="tab-description">
                Выберите один из готовых профилей или создайте свой собственный.
              </p>

              <div className="presets-grid">
                {presets.map(preset => (
                  <div key={preset.id} className="preset-card">
                    <div className="preset-header">
                      <h4>{preset.name}</h4>
                      <p>{preset.description}</p>
                    </div>
                    <div className="preset-factors">
                      {Object.entries(preset.factors).map(([factor, value]) => (
                        <div key={factor} className="preset-factor">
                          <span className="factor-name">
                            {factor === 'speed' && '⚡'}
                            {factor === 'safety' && '🛡️'}
                            {factor === 'traffic' && '🚦'}
                            {factor === 'ecology' && '🌱'}
                            {factor === 'comfort' && '😌'}
                          </span>
                          <span className="factor-value">{Math.round(value * 100)}%</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="apply-preset-btn"
                      onClick={() => applyPreset(preset)}
                    >
                      Применить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="advanced-tab">
              <h3>Дополнительные настройки</h3>
              <p className="tab-description">
                Расширенные параметры для тонкой настройки алгоритма приоритизации.
              </p>

              <div className="advanced-settings">
                <div className="setting-group">
                  <h4>🕐 Временные модификаторы</h4>
                  <div className="time-settings">
                    <label>
                      Учитывать время суток:
                      <input type="checkbox" defaultChecked />
                    </label>
                    <label>
                      Учитывать день недели:
                      <input type="checkbox" defaultChecked />
                    </label>
                  </div>
                </div>

                <div className="setting-group">
                  <h4>🌤️ Погодные условия</h4>
                  <div className="weather-settings">
                    <label>
                      Автоматическое определение погоды:
                      <input type="checkbox" defaultChecked />
                    </label>
                    <select className="weather-select">
                      <option value="clear">☀️ Ясно</option>
                      <option value="rain">🌧️ Дождь</option>
                      <option value="snow">❄️ Снег</option>
                      <option value="fog">🌫️ Туман</option>
                    </select>
                  </div>
                </div>

                <div className="setting-group">
                  <h4>🚶‍♂️ Пешеходные настройки</h4>
                  <div className="transport-settings">
                    <label>
                      Приоритет тротуаров:
                      <input type="checkbox" defaultChecked />
                    </label>
                    <label>
                      Избегать автодорог:
                      <input type="checkbox" defaultChecked />
                    </label>
                    <label>
                      Предпочитать парки:
                      <input type="checkbox" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="config-actions">
          <button className="reset-btn" onClick={resetToDefaults}>
            🔄 Сбросить
          </button>
          <button className="apply-btn" onClick={onClose}>
            ✅ Применить
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriorityConfigPanel
