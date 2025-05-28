#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import matplotlib.pyplot as plt
from collections import Counter
from typing import List, Dict, Any

# Константы
DATA_DIR = "data"
INPUT_FILE = os.path.join(DATA_DIR, "moscow_places.json")
OUTPUT_DIR = os.path.join(DATA_DIR, "analysis")

def load_places() -> List[Dict[str, Any]]:
    """Загружает данные о местах из JSON-файла"""
    if not os.path.exists(INPUT_FILE):
        raise FileNotFoundError(f"Файл {INPUT_FILE} не найден. Сначала запустите скрипт collect_moscow_places.py")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def analyze_place_types(places: List[Dict[str, Any]]) -> None:
    """Анализирует типы мест и создает диаграмму"""
    # Подсчитываем количество мест каждого типа
    type_counter = Counter(place["type"] for place in places)
    
    # Создаем диаграмму
    plt.figure(figsize=(10, 6))
    plt.bar(type_counter.keys(), type_counter.values())
    plt.title("Распределение мест по типам")
    plt.xlabel("Тип места")
    plt.ylabel("Количество")
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Сохраняем диаграмму
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "place_types.png"))
    plt.close()
    
    print("Распределение мест по типам:")
    for type_name, count in type_counter.most_common():
        print(f"  {type_name}: {count}")

def analyze_visit_time(places: List[Dict[str, Any]]) -> None:
    """Анализирует время посещения мест и создает диаграмму"""
    # Группируем места по времени посещения
    time_groups = {}
    for place in places:
        time = place["estimated_time"]
        if time not in time_groups:
            time_groups[time] = []
        time_groups[time].append(place)
    
    # Создаем диаграмму
    plt.figure(figsize=(10, 6))
    plt.bar(time_groups.keys(), [len(places) for places in time_groups.values()])
    plt.title("Распределение мест по времени посещения")
    plt.xlabel("Время посещения (минуты)")
    plt.ylabel("Количество мест")
    plt.tight_layout()
    
    # Сохраняем диаграмму
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "visit_time.png"))
    plt.close()
    
    print("\nРаспределение мест по времени посещения:")
    for time, places_list in sorted(time_groups.items()):
        print(f"  {time} минут: {len(places_list)} мест")

def analyze_location_clusters(places: List[Dict[str, Any]]) -> None:
    """Анализирует географическое распределение мест и создает карту"""
    # Извлекаем координаты
    latitudes = [place["latitude"] for place in places]
    longitudes = [place["longitude"] for place in places]
    types = [place["type"] for place in places]
    
    # Создаем словарь цветов для типов мест
    type_colors = {
        "attraction": "red",
        "cafe": "blue",
        "restaurant": "green",
        "shop": "purple",
        "park": "lime",
        "exhibition": "orange"
    }
    
    # Создаем карту
    plt.figure(figsize=(12, 10))
    
    # Добавляем точки для каждого места с цветом по типу
    for lat, lon, place_type in zip(latitudes, longitudes, types):
        color = type_colors.get(place_type, "gray")
        plt.scatter(lon, lat, c=color, alpha=0.7, s=30)
    
    # Добавляем легенду
    for place_type, color in type_colors.items():
        plt.scatter([], [], c=color, label=place_type)
    
    plt.legend()
    plt.title("Географическое распределение мест в Москве")
    plt.xlabel("Долгота")
    plt.ylabel("Широта")
    plt.grid(True, linestyle="--", alpha=0.7)
    plt.tight_layout()
    
    # Сохраняем карту
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "location_map.png"))
    plt.close()
    
    print("\nГеографический анализ сохранен в файл location_map.png")

def generate_report(places: List[Dict[str, Any]]) -> None:
    """Генерирует текстовый отчет о местах"""
    report_file = os.path.join(OUTPUT_DIR, "places_report.md")
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("# Отчет о красивых местах Москвы\n\n")
        
        f.write(f"## Общая информация\n\n")
        f.write(f"Всего мест: {len(places)}\n\n")
        
        # Типы мест
        type_counter = Counter(place["type"] for place in places)
        f.write("### Распределение по типам\n\n")
        for type_name, count in type_counter.most_common():
            f.write(f"- {type_name}: {count}\n")
        
        f.write("\n## Топ-10 мест по времени посещения\n\n")
        
        # Сортируем места по времени посещения (по убыванию)
        sorted_places = sorted(places, key=lambda x: x["estimated_time"], reverse=True)
        
        for i, place in enumerate(sorted_places[:10], 1):
            f.write(f"### {i}. {place['name']}\n\n")
            f.write(f"- **Тип:** {place['type']}\n")
            f.write(f"- **Время посещения:** {place['estimated_time']} минут\n")
            f.write(f"- **Координаты:** {place['latitude']}, {place['longitude']}\n")
            f.write(f"- **Описание:** {place['description']}\n\n")
        
        # Добавляем список всех мест
        f.write("## Полный список мест\n\n")
        f.write("| № | Название | Тип | Время посещения |\n")
        f.write("|---|---------|-----|----------------|\n")
        
        for i, place in enumerate(sorted(places, key=lambda x: x["name"]), 1):
            f.write(f"| {i} | {place['name']} | {place['type']} | {place['estimated_time']} мин. |\n")
    
    print(f"\nОтчет сохранен в файл {report_file}")

def main():
    try:
        # Загружаем данные о местах
        print("Загрузка данных о местах...")
        places = load_places()
        print(f"Загружено {len(places)} мест")
        
        # Создаем директорию для результатов анализа
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Анализируем типы мест
        print("\nАнализ типов мест...")
        analyze_place_types(places)
        
        # Анализируем время посещения
        print("\nАнализ времени посещения...")
        analyze_visit_time(places)
        
        # Анализируем географическое распределение
        print("\nАнализ географического распределения...")
        analyze_location_clusters(places)
        
        # Генерируем отчет
        print("\nГенерация отчета...")
        generate_report(places)
        
        print("\nАнализ завершен. Результаты сохранены в директории", OUTPUT_DIR)
        
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    main()
