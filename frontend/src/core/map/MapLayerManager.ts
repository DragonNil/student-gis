// frontend/src/core/map/MapLayerManager.ts
import { LAYER_PRESETS } from '@/core/config';

// Тип для объекта из API (Sequelize-модель)
export interface ApiInfrastructureObject {
  id: number;
  name: string;
  type: 'university' | 'dormitory' | 'canteen' | 'sport' | 'copy_center';
  address: string;
  working_hours?: string | null;
  phone?: string | null;
  capacity?: number | null;
  year_built?: number | null;
  faculties?: string[];
  services?: string[];
  price_black_white?: number | null;
  price_color?: number | null;
  has_self_service?: boolean | null;
  accessibility_wheelchair?: boolean;
  nearest_bus_stop?: string | null;
  walk_time_to_stop_min?: number | null;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [долгота, широта]
  };
  created_at?: string;
  updated_at?: string;
}

export class MapLayerManager {
  private map: any;
  private collections: Map<string, any> = new Map();
  private activeLayers: Set<string> = new Set();
  private onObjectClick?: (feature: ApiInfrastructureObject) => void;

  constructor(map: any, onObjectClick?: (feature: ApiInfrastructureObject) => void) {
    this.map = map;
    this.onObjectClick = onObjectClick;
  }

  public setLayer(type: string, features: ApiInfrastructureObject[]): void {
    console.log(`[LayerManager] setLayer("${type}") — ${features?.length || 0} features`);

    // Очистка старой коллекции
    const existing = this.collections.get(type);
    if (existing) {
      this.map.geoObjects.remove(existing);
    }

    if (!features || features.length === 0) {
      console.warn(`[LayerManager] No features for layer "${type}"`);
      return;
    }

    const collection = new ymaps.GeoObjectCollection();
    let addedCount = 0;

    features.forEach((feature, idx) => {
      try {
        // 🔍 ОТЛАДКА: выводим структуру первого объекта
        if (idx === 0) {
          console.log('[LayerManager] Sample feature keys:', Object.keys(feature || {}));
          console.log('[LayerManager] Sample feature.geometry:', feature?.geometry);
          console.log('[LayerManager] Sample feature.type:', (feature as any)?.type);
        }

        // 👇 Безопасное извлечение координат
        const coords = feature?.geometry?.coordinates;
        if (!coords || !Array.isArray(coords) || coords.length < 2) {
          console.warn(`[LayerManager] ❌ Invalid geometry for feature #${idx}:`, feature);
          return;
        }
        const [lon, lat] = coords;
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          console.warn(`[LayerManager] ❌ Invalid coords [${lon}, ${lat}] for feature #${idx}`);
          return;
        }
        const yandexCoords: [number, number] = [lat, lon];

        // 👇 Безопасное извлечение type (в API он на верхнем уровне!)
        // НЕ используем feature.properties.type — его нет в ответе Sequelize!
        const props = feature; // Сам объект — это и есть "properties"
        const objType = props?.type;
        
        if (!objType || typeof objType !== 'string') {
          console.warn(`[LayerManager] ❌ Missing/invalid type for feature #${idx}:`, props);
          return;
        }

        const preset = LAYER_PRESETS[objType] || 'islands#blueDotIcon';

        const placemark = new ymaps.Placemark(
          yandexCoords,
          {
            balloonContentHeader: props.name || 'Без названия',
            balloonContentBody: this.formatBalloonContent(props),
            iconCaption: props.name,
          },
          { preset }
        );

        placemark.events.add('click', () => {
          console.log(`[LayerManager] Clicked: ${props.name} (type: ${objType})`);
          this.onObjectClick?.(feature);
        });

        collection.add(placemark);
        addedCount++;
      } catch (err) {
        console.error(`[LayerManager] ❌ Error processing feature #${idx}:`, err, feature);
      }
    });

    console.log(`[LayerManager] ✅ Added ${addedCount}/${features.length} placemarks for layer "${type}"`);

    this.collections.set(type, collection);
    
    if (this.activeLayers.has(type)) {
      this.map.geoObjects.add(collection);
      console.log(`[LayerManager] Layer "${type}" is VISIBLE — added to map`);
    } else {
      console.log(`[LayerManager] Layer "${type}" is HIDDEN — not added to map`);
    }
  }

  public toggleLayer(type: string, visible: boolean): void {
    const collection = this.collections.get(type);
    if (!collection) {
      console.warn(`[LayerManager] Collection "${type}" not found`);
      return;
    }
    if (visible) {
      this.map.geoObjects.add(collection);
      this.activeLayers.add(type);
    } else {
      this.map.geoObjects.remove(collection);
      this.activeLayers.delete(type);
    }
  }

  public clearAll(): void {
    this.collections.forEach(col => this.map.geoObjects.remove(col));
    this.collections.clear();
    this.activeLayers.clear();
  }

  private formatBalloonContent(props: ApiInfrastructureObject): string {
    let html = `<b>📍 Адрес:</b> ${props.address || '—'}<br/>`;
    if (props.working_hours) html += `<b>🕐 Часы:</b> ${props.working_hours}<br/>`;
    if (props.phone) html += `<b>📞 Тел:</b> ${props.phone}<br/>`;
    
    if (props.accessibility_wheelchair) {
      html += `<b>♿ Доступно для МГН</b><br/>`;
    }
    if (props.nearest_bus_stop) {
      html += `<b>🚌 Остановка:</b> ${props.nearest_bus_stop}`;
      if (props.walk_time_to_stop_min) html += ` (~${props.walk_time_to_stop_min} мин)`;
      html += `<br/>`;
    }
    return html;
  }
}