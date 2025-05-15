// Форматирование даты
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Форматирование времени в часах
export function formatTravelTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} минут`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours} ${pluralize(wholeHours, 'час', 'часа', 'часов')}`;
  }
  
  return `${wholeHours} ${pluralize(wholeHours, 'час', 'часа', 'часов')} ${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')}`;
}

// Функция для правильного склонения слов
function pluralize(count: number, one: string, few: string, many: string): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return one;
  }
  
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return few;
  }
  
  return many;
}
