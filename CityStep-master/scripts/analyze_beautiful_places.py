#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import matplotlib.pyplot as plt
import numpy as np
from collections import Counter
from typing import List, Dict, Any

# Константы
DATA_DIR = "data"
INPUT_FILE = os.path.join(DATA_DIR, "moscow_beautiful_places.json")
OUTPUT_DIR = os.path.join(DATA_DIR, "beauty_analysis")

def load_places() -> List[Dict[str, Any]]:
    """Загружает данные о местах из JSON-файла"""
    if not os.path.exists(INPUT_FILE):
        raise FileNotFoundError(f"Файл {INPUT_FILE} не найден")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def analyze_beauty_scores(places: List[Dict[str, Any]]) -> None:
    """Анализирует оценки красоты мест и создает диаграмму"""
    # Сортируем места по оценке красоты
    sorted_places = sorted(places, key=lambda x: x["beauty_score"], reverse=True)
    
    # Берем топ-10 мест
    top_places = sorted_places[:10]
    
    # Создаем диаграмму
    plt.figure(figsize=(12, 8))
    
    names = [place["name"] for place in top_places]
    scores = [place["beauty_score"] for place in top_places]
    
    # Создаем горизонтальную столбчатую диаграмму
    bars = plt.barh(names, scores, color='skyblue')
    
    # Добавляем значения на столбцы
    for bar in bars:
        width = bar.get_width()
        plt.text(width + 0.1, bar.get_y() + bar.get_height()/2, f'{width:.1f}', 
                 ha='left', va='center', fontweight='bold')
    
    plt.xlabel('Оценка красоты (0-10)')
    plt.title('Топ-10 самых красивых мест Москвы')
    plt.xlim(0, 11)  # Устанавливаем диапазон оси X
    plt.grid(axis='x', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    # Сохраняем диаграмму
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "top_beautiful_places.png"))
    plt.close()
    
    print("Топ-10 самых красивых мест Москвы:")
    for i, place in enumerate(top_places, 1):
        print(f"{i}. {place['name']} - {place['beauty_score']}")

def analyze_beauty_by_type(places: List[Dict[str, Any]]) -> None:
    """Анализирует красоту мест по типам и создает диаграмму"""
    # Группируем места по типам
    types = {}
    for place in places:
        place_type = place["type"]
        if place_type not in types:
            types[place_type] = []
        types[place_type].append(place["beauty_score"])
    
    # Вычисляем средние оценки по типам
    avg_scores = {t: sum(scores)/len(scores) for t, scores in types.items()}
    
    # Создаем диаграмму
    plt.figure(figsize=(10, 6))
    
    # Сортируем типы по средней оценке
    sorted_types = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
    type_names = [t[0] for t in sorted_types]
    type_scores = [t[1] for t in sorted_types]
    
    # Создаем столбчатую диаграмму
    bars = plt.bar(type_names, type_scores, color='lightgreen')
    
    # Добавляем значения на столбцы
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, height + 0.1, f'{height:.2f}', 
                 ha='center', va='bottom', fontweight='bold')
    
    plt.ylabel('Средняя оценка красоты (0-10)')
    plt.title('Средняя оценка красоты по типам мест')
    plt.ylim(0, 10.5)  # Устанавливаем диапазон оси Y
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    # Сохраняем диаграмму
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "beauty_by_type.png"))
    plt.close()
    
    print("\nСредняя оценка красоты по типам мест:")
    for t, score in sorted_types:
        print(f"{t}: {score:.2f}")

def analyze_beauty_factors(places: List[Dict[str, Any]]) -> None:
    """Анализирует факторы, влияющие на красоту мест"""
    # Вычисляем корреляцию между оценкой красоты и другими факторами
    beauty_scores = [place["beauty_score"] for place in places]
    popularity_scores = [place["popularity"] for place in places]
    historical_scores = [place["historical_value"] for place in places]
    architectural_scores = [place["architectural_value"] for place in places]
    
    # Вычисляем корреляцию
    corr_popularity = np.corrcoef(beauty_scores, popularity_scores)[0, 1]
    corr_historical = np.corrcoef(beauty_scores, historical_scores)[0, 1]
    corr_architectural = np.corrcoef(beauty_scores, architectural_scores)[0, 1]
    
    # Создаем диаграмму
    plt.figure(figsize=(10, 6))
    
    factors = ['Популярность', 'Историческая ценность', 'Архитектурная ценность']
    correlations = [corr_popularity, corr_historical, corr_architectural]
    
    # Создаем столбчатую диаграмму
    bars = plt.bar(factors, correlations, color=['gold', 'lightcoral', 'mediumaquamarine'])
    
    # Добавляем значения на столбцы
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, height + 0.02, f'{height:.2f}', 
                 ha='center', va='bottom', fontweight='bold')
    
    plt.ylabel('Корреляция с оценкой красоты')
    plt.title('Корреляция между оценкой красоты и другими факторами')
    plt.ylim(0, 1.1)  # Устанавливаем диапазон оси Y
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    # Сохраняем диаграмму
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "beauty_factors.png"))
    plt.close()
    
    print("\nКорреляция между оценкой красоты и другими факторами:")
    print(f"Популярность: {corr_popularity:.2f}")
    print(f"Историческая ценность: {corr_historical:.2f}")
    print(f"Архитектурная ценность: {corr_architectural:.2f}")

def analyze_best_seasons(places: List[Dict[str, Any]]) -> None:
    """Анализирует лучшие сезоны для посещения красивых мест"""
    # Подсчитываем количество мест для каждого сезона
    seasons_count = Counter()
    for place in places:
        for season in place["best_time"]:
            seasons_count[season] += 1
    
    # Создаем диаграмму
    plt.figure(figsize=(10, 6))
    
    seasons = ['весна', 'лето', 'осень', 'зима']
    counts = [seasons_count[season] for season in seasons]
    
    # Создаем столбчатую диаграмму
    bars = plt.bar(seasons, counts, color=['lightgreen', 'gold', 'orange', 'lightblue'])
    
    # Добавляем значения на столбцы
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, height + 0.5, f'{int(height)}', 
                 ha='center', va='bottom', fontweight='bold')
    
    plt.ylabel('Количество мест')
    plt.title('Лучшие сезоны для посещения красивых мест Москвы')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    # Сохраняем диаграмму
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "best_seasons.png"))
    plt.close()
    
    print("\nЛучшие сезоны для посещения красивых мест Москвы:")
    for season, count in seasons_count.most_common():
        print(f"{season}: {count} мест")

def create_beauty_map(places: List[Dict[str, Any]]) -> None:
    """Создает карту красивых мест с учетом их оценки красоты"""
    # Извлекаем координаты и оценки
    latitudes = [place["latitude"] for place in places]
    longitudes = [place["longitude"] for place in places]
    beauty_scores = [place["beauty_score"] for place in places]
    names = [place["name"] for place in places]
    types = [place["type"] for place in places]
    
    # Создаем словарь цветов для типов мест
    type_colors = {
        "attraction": "red",
        "park": "green",
        "exhibition": "blue"
    }
    
    # Создаем карту
    plt.figure(figsize=(12, 10))
    
    # Добавляем точки для каждого места с размером, зависящим от оценки красоты
    for lat, lon, score, name, place_type in zip(latitudes, longitudes, beauty_scores, names, types):
        color = type_colors.get(place_type, "gray")
        size = score * 20  # Размер маркера зависит от оценки красоты
        plt.scatter(lon, lat, c=color, alpha=0.7, s=size, label=place_type if place_type not in plt.gca().get_legend_handles_labels()[1] else "")
        plt.text(lon, lat, name, fontsize=8, ha='right')
    
    # Добавляем легенду (только уникальные типы)
    handles, labels = plt.gca().get_legend_handles_labels()
    by_label = dict(zip(labels, handles))
    plt.legend(by_label.values(), by_label.keys())
    
    plt.title('Карта красивых мест Москвы')
    plt.xlabel('Долгота')
    plt.ylabel('Широта')
    plt.grid(True, linestyle="--", alpha=0.7)
    plt.tight_layout()
    
    # Сохраняем карту
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.savefig(os.path.join(OUTPUT_DIR, "beauty_map.png"))
    plt.close()
    
    print("\nКарта красивых мест Москвы сохранена в файл beauty_map.png")

def generate_beauty_report(places: List[Dict[str, Any]]) -> None:
    """Генерирует отчет о наиболее красивых местах"""
    report_file = os.path.join(OUTPUT_DIR, "beauty_report.md")
    
    # Сортируем места по оценке красоты
    sorted_places = sorted(places, key=lambda x: x["beauty_score"], reverse=True)
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("# Отчет о наиболее красивых местах Москвы\n\n")
        
        f.write("## Топ-20 самых красивых мест\n\n")
        
        for i, place in enumerate(sorted_places, 1):
            f.write(f"### {i}. {place['name']} - {place['beauty_score']}/10\n\n")
            f.write(f"- **Тип:** {place['type']}\n")
            f.write(f"- **Описание:** {place['description']}\n")
            f.write(f"- **Время посещения:** {place['estimated_time']} минут\n")
            f.write(f"- **Популярность:** {place['popularity']}/10\n")
            f.write(f"- **Историческая ценность:** {place['historical_value']}/10\n")
            f.write(f"- **Архитектурная ценность:** {place['architectural_value']}/10\n")
            f.write(f"- **Лучшее время для посещения:** {', '.join(place['best_time'])}\n")
            f.write(f"- **Координаты:** {place['latitude']}, {place['longitude']}\n\n")
        
        # Добавляем выводы
        f.write("## Выводы\n\n")
        
        # Группируем места по типам
        types = {}
        for place in places:
            place_type = place["type"]
            if place_type not in types:
                types[place_type] = []
            types[place_type].append(place["beauty_score"])
        
        # Вычисляем средние оценки по типам
        avg_scores = {t: sum(scores)/len(scores) for t, scores in types.items()}
        sorted_types = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
        
        f.write("### Средняя оценка красоты по типам мест\n\n")
        for t, score in sorted_types:
            f.write(f"- **{t}:** {score:.2f}/10\n")
        
        # Вычисляем корреляцию между оценкой красоты и другими факторами
        beauty_scores = [place["beauty_score"] for place in places]
        popularity_scores = [place["popularity"] for place in places]
        historical_scores = [place["historical_value"] for place in places]
        architectural_scores = [place["architectural_value"] for place in places]
        
        corr_popularity = np.corrcoef(beauty_scores, popularity_scores)[0, 1]
        corr_historical = np.corrcoef(beauty_scores, historical_scores)[0, 1]
        corr_architectural = np.corrcoef(beauty_scores, architectural_scores)[0, 1]
        
        f.write("\n### Корреляция между оценкой красоты и другими факторами\n\n")
        f.write(f"- **Популярность:** {corr_popularity:.2f}\n")
        f.write(f"- **Историческая ценность:** {corr_historical:.2f}\n")
        f.write(f"- **Архитектурная ценность:** {corr_architectural:.2f}\n")
        
        # Подсчитываем количество мест для каждого сезона
        seasons_count = Counter()
        for place in places:
            for season in place["best_time"]:
                seasons_count[season] += 1
        
        f.write("\n### Лучшие сезоны для посещения красивых мест\n\n")
        for season, count in seasons_count.most_common():
            f.write(f"- **{season}:** {count} мест\n")
    
    print(f"\nОтчет сохранен в файл {report_file}")

def main():
    try:
        # Загружаем данные о местах
        print("Загрузка данных о красивых местах Москвы...")
        places = load_places()
        print(f"Загружено {len(places)} мест")
        
        # Создаем директорию для результатов анализа
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Анализируем оценки красоты
        print("\nАнализ оценок красоты...")
        analyze_beauty_scores(places)
        
        # Анализируем красоту по типам мест
        print("\nАнализ красоты по типам мест...")
        analyze_beauty_by_type(places)
        
        # Анализируем факторы, влияющие на красоту
        print("\nАнализ факторов, влияющих на красоту...")
        analyze_beauty_factors(places)
        
        # Анализируем лучшие сезоны для посещения
        print("\nАнализ лучших сезонов для посещения...")
        analyze_best_seasons(places)
        
        # Создаем карту красивых мест
        print("\nСоздание карты красивых мест...")
        create_beauty_map(places)
        
        # Генерируем отчет
        print("\nГенерация отчета...")
        generate_beauty_report(places)
        
        print("\nАнализ завершен. Результаты сохранены в директории", OUTPUT_DIR)
        
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    main()
