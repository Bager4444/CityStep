/**
 * Скрипт для интеграции данных о местах Москвы в приложение CityStep
 * 
 * Этот скрипт загружает данные о местах из JSON-файла и добавляет их в базу данных Supabase
 * через API приложения CityStep.
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Константы
const DATA_FILE = path.join(__dirname, '..', 'data', 'moscow_places.json');
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const BATCH_SIZE = 10; // Количество мест для добавления за один запрос

/**
 * Загружает данные о местах из JSON-файла
 * @returns {Promise<Array>} Массив мест
 */
async function loadPlaces() {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error.message);
    throw error;
  }
}

/**
 * Добавляет место в базу данных через API
 * @param {Object} place Данные о месте
 * @returns {Promise<Object>} Результат запроса
 */
async function addPlace(place) {
  try {
    const response = await fetch(`${API_URL}/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY || ''}` // Если требуется авторизация
      },
      body: JSON.stringify(place)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ошибка API: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка при добавлении места "${place.name}":`, error.message);
    throw error;
  }
}

/**
 * Добавляет места в базу данных пакетами
 * @param {Array} places Массив мест
 * @returns {Promise<Array>} Массив результатов
 */
async function addPlacesBatch(places) {
  const results = [];
  const batches = [];

  // Разбиваем массив мест на пакеты
  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    batches.push(places.slice(i, i + BATCH_SIZE));
  }

  console.log(`Разбито на ${batches.length} пакетов по ${BATCH_SIZE} мест`);

  // Обрабатываем пакеты последовательно
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Обработка пакета ${i + 1}/${batches.length}...`);

    // Обрабатываем места в пакете параллельно
    const batchResults = await Promise.allSettled(
      batch.map(place => addPlace(place))
    );

    // Анализируем результаты
    const batchSummary = {
      success: 0,
      failed: 0,
      details: []
    };

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batchSummary.success++;
        batchSummary.details.push({
          name: batch[index].name,
          status: 'success',
          id: result.value.id
        });
      } else {
        batchSummary.failed++;
        batchSummary.details.push({
          name: batch[index].name,
          status: 'failed',
          error: result.reason.message
        });
      }
    });

    results.push(batchSummary);
    console.log(`Пакет ${i + 1}: успешно - ${batchSummary.success}, ошибок - ${batchSummary.failed}`);

    // Делаем паузу между пакетами, чтобы не перегружать API
    if (i < batches.length - 1) {
      console.log('Пауза перед следующим пакетом...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Генерирует отчет о результатах интеграции
 * @param {Array} results Результаты интеграции
 */
function generateReport(results) {
  const totalSuccess = results.reduce((sum, batch) => sum + batch.success, 0);
  const totalFailed = results.reduce((sum, batch) => sum + batch.failed, 0);
  const totalPlaces = totalSuccess + totalFailed;

  console.log('\n=== Отчет о результатах интеграции ===');
  console.log(`Всего обработано мест: ${totalPlaces}`);
  console.log(`Успешно добавлено: ${totalSuccess} (${(totalSuccess / totalPlaces * 100).toFixed(2)}%)`);
  console.log(`Ошибок: ${totalFailed} (${(totalFailed / totalPlaces * 100).toFixed(2)}%)`);

  // Сохраняем подробный отчет в файл
  const reportData = {
    summary: {
      totalPlaces,
      totalSuccess,
      totalFailed,
      successRate: (totalSuccess / totalPlaces * 100).toFixed(2)
    },
    batches: results
  };

  const reportFile = path.join(__dirname, '..', 'data', 'integration_report.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2), 'utf8');
  console.log(`Подробный отчет сохранен в файл: ${reportFile}`);
}

/**
 * Основная функция
 */
async function main() {
  try {
    console.log('Начало интеграции данных о местах Москвы в CityStep...');

    // Загружаем данные о местах
    console.log('Загрузка данных о местах...');
    const places = await loadPlaces();
    console.log(`Загружено ${places.length} мест`);

    // Проверяем наличие данных
    if (places.length === 0) {
      console.log('Нет данных для интеграции. Завершение работы.');
      return;
    }

    // Добавляем места в базу данных
    console.log('Добавление мест в базу данных...');
    const results = await addPlacesBatch(places);

    // Генерируем отчет
    generateReport(results);

    console.log('Интеграция завершена успешно!');
  } catch (error) {
    console.error('Ошибка при выполнении интеграции:', error);
    process.exit(1);
  }
}

// Запускаем основную функцию
main();
