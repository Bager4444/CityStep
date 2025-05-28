#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import time
import os
from typing import List, Dict, Any, Optional

# Константы
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search"
OUTPUT_DIR = "data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "moscow_places.json")

# Категории мест для поиска
PLACE_CATEGORIES = [
    {"name": "attraction", "tags": ["tourism=attraction", "historic=monument", "historic=memorial", "historic=castle"]},
    {"name": "museum", "tags": ["tourism=museum", "amenity=museum"]},
    {"name": "park", "tags": ["leisure=park", "leisure=garden"]},
    {"name": "cafe", "tags": ["amenity=cafe"]},
    {"name": "restaurant", "tags": ["amenity=restaurant"]},
    {"name": "shop", "tags": ["shop=mall", "shop=department_store"]},
    {"name": "exhibition", "tags": ["tourism=gallery", "amenity=arts_centre"]},
    {"name": "theatre", "tags": ["amenity=theatre"]},
    {"name": "cinema", "tags": ["amenity=cinema"]},
    {"name": "viewpoint", "tags": ["tourism=viewpoint"]},
]

# Функция для выполнения запроса к Overpass API
def query_overpass(query: str) -> Dict[str, Any]:
    """Выполняет запрос к Overpass API и возвращает результат в формате JSON"""
    response = requests.post(OVERPASS_API_URL, data={"data": query})
    response.raise_for_status()
    return response.json()

# Функция для получения мест по категории
def get_places_by_category(category: Dict[str, Any], city_bbox: str) -> List[Dict[str, Any]]:
    """Получает места по заданной категории в пределах указанной области"""
    places = []
    
    for tag in category["tags"]:
        key, value = tag.split("=")
        
        # Формируем запрос к Overpass API
        query = f"""
        [out:json][timeout:60];
        (
          node["{key}"="{value}"]{city_bbox};
          way["{key}"="{value}"]{city_bbox};
          relation["{key}"="{value}"]{city_bbox};
        );
        out center;
        """
        
        try:
            print(f"Запрос мест с тегом {tag}...")
            result = query_overpass(query)
            
            for element in result.get("elements", []):
                # Пропускаем элементы без имени
                if "tags" not in element or "name" not in element["tags"]:
                    continue
                
                # Получаем координаты
                if element["type"] == "node":
                    lat, lon = element["lat"], element["lon"]
                else:  # way или relation
                    lat, lon = element.get("center", {}).get("lat"), element.get("center", {}).get("lon")
                
                if not lat or not lon:
                    continue
                
                # Формируем информацию о месте
                place = {
                    "id": element["id"],
                    "name": element["tags"]["name"],
                    "type": category["name"],
                    "latitude": lat,
                    "longitude": lon,
                    "tags": element["tags"],
                    "estimated_time": estimate_visit_time(category["name"]),
                    "description": element["tags"].get("description", ""),
                    "image_url": element["tags"].get("image") or ""
                }
                
                # Добавляем место в список, если его еще нет
                if not any(p["id"] == place["id"] for p in places):
                    places.append(place)
            
            # Делаем паузу, чтобы не перегружать API
            time.sleep(1)
            
        except Exception as e:
            print(f"Ошибка при запросе мест с тегом {tag}: {e}")
    
    return places

# Функция для оценки времени посещения места
def estimate_visit_time(place_type: str) -> int:
    """Возвращает примерное время посещения места в минутах"""
    time_estimates = {
        "attraction": 60,
        "museum": 120,
        "park": 90,
        "cafe": 60,
        "restaurant": 90,
        "shop": 60,
        "exhibition": 90,
        "theatre": 180,
        "cinema": 150,
        "viewpoint": 30
    }
    
    return time_estimates.get(place_type, 60)

# Функция для получения границ города
def get_city_bbox(city_name: str) -> str:
    """Получает границы города в формате bbox для Overpass API"""
    params = {
        "q": city_name,
        "format": "json",
        "limit": 1
    }
    
    response = requests.get(NOMINATIM_API_URL, params=params)
    response.raise_for_status()
    data = response.json()
    
    if not data:
        raise ValueError(f"Город {city_name} не найден")
    
    bbox = data[0]["boundingbox"]
    return f"({bbox[0]},{bbox[2]},{bbox[1]},{bbox[3]})"

# Функция для обработки и сохранения данных
def process_and_save_places(places: List[Dict[str, Any]], output_file: str) -> None:
    """Обрабатывает и сохраняет данные о местах в JSON-файл"""
    # Создаем директорию, если она не существует
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Преобразуем данные в формат для базы данных
    processed_places = []
    
    for place in places:
        # Формируем описание на основе доступных тегов
        description = place["description"]
        if not description and "description:ru" in place["tags"]:
            description = place["tags"]["description:ru"]
        if not description and "wikipedia" in place["tags"]:
            description = f"Подробнее: {place['tags']['wikipedia']}"
        if not description:
            description = f"Место категории: {place['type']}"
        
        # Преобразуем тип места в соответствии с требованиями базы данных
        db_type = map_type_to_db_type(place["type"])
        
        processed_place = {
            "name": place["name"],
            "description": description,
            "type": db_type,
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "estimated_time": place["estimated_time"],
            "image_url": place["image_url"]
        }
        
        processed_places.append(processed_place)
    
    # Сохраняем данные в файл
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(processed_places, f, ensure_ascii=False, indent=2)
    
    print(f"Данные сохранены в файл {output_file}")

# Функция для преобразования типа места в тип базы данных
def map_type_to_db_type(place_type: str) -> str:
    """Преобразует тип места в тип, соответствующий схеме базы данных"""
    type_mapping = {
        "attraction": "attraction",
        "museum": "exhibition",
        "park": "park",
        "cafe": "cafe",
        "restaurant": "restaurant",
        "shop": "shop",
        "exhibition": "exhibition",
        "theatre": "attraction",
        "cinema": "attraction",
        "viewpoint": "attraction"
    }
    
    return type_mapping.get(place_type, "attraction")

# Основная функция
def main():
    try:
        # Получаем границы Москвы
        print("Получение границ Москвы...")
        moscow_bbox = get_city_bbox("Москва, Россия")
        
        # Собираем места по категориям
        all_places = []
        
        for category in PLACE_CATEGORIES:
            print(f"Поиск мест категории {category['name']}...")
            places = get_places_by_category(category, moscow_bbox)
            print(f"Найдено {len(places)} мест категории {category['name']}")
            all_places.extend(places)
        
        print(f"Всего найдено {len(all_places)} мест")
        
        # Ограничиваем количество мест до 200
        if len(all_places) > 200:
            print(f"Ограничиваем количество мест до 200")
            all_places = all_places[:200]
        
        # Обрабатываем и сохраняем данные
        process_and_save_places(all_places, OUTPUT_FILE)
        
        # Генерируем SQL-скрипт для добавления мест в базу данных
        generate_sql_script(all_places)
        
    except Exception as e:
        print(f"Ошибка: {e}")

# Функция для генерации SQL-скрипта
def generate_sql_script(places: List[Dict[str, Any]]) -> None:
    """Генерирует SQL-скрипт для добавления мест в базу данных"""
    sql_file = os.path.join(OUTPUT_DIR, "insert_places.sql")
    
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write("-- SQL-скрипт для добавления мест в базу данных\n\n")
        
        for place in places:
            # Экранируем одинарные кавычки в строках
            name = place["name"].replace("'", "''")
            description = place["description"].replace("'", "''")
            image_url = place["image_url"].replace("'", "''")
            
            sql = f"""INSERT INTO places (name, description, type, latitude, longitude, estimated_time, image_url)
VALUES ('{name}', '{description}', '{place["type"]}', {place["latitude"]}, {place["longitude"]}, {place["estimated_time"]}, '{image_url}');
"""
            f.write(sql)
    
    print(f"SQL-скрипт сохранен в файл {sql_file}")

if __name__ == "__main__":
    main()
