// frontend/src/core/map/MapLayerManager.ts
import { getLayerStyle } from '@/core/config';

export type TLayerType = 'university' | 'dormitory' | 'canteen' | 'sport' | 'copy_center';

export interface TInfrastructureFeature {
  id?: number;
  name?: string;
  type?: TLayerType;
  address?: string;
  working_hours?: string;
  phone?: string;
  geometry?: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties?: any;
  [key: string]: any;
}

export class MapLayerManager {
  private map: any;
  private collections: Map<TLayerType, any> = new Map();
  // 👇 Добавляем мапу для отслеживания состояния видимости вместо contains()
  private layerVisibleState: Map<TLayerType, boolean> = new Map();
  private onObjectSelect?: (feature: TInfrastructureFeature) => void;

  constructor(map: any, onObjectSelect?: (feature: TInfrastructureFeature) => void) {
    this.map = map;
    this.onObjectSelect = onObjectSelect;
  }

  setLayer(type: TLayerType, features: TInfrastructureFeature[]): void {
    // Удаляем старую коллекцию, если она была
    if (this.collections.has(type)) {
      const oldCollection = this.collections.get(type);
      if (oldCollection) {
        this.map.geoObjects.remove(oldCollection);
      }
      this.layerVisibleState.delete(type);
    }

    // Получаем стиль (цвет и иконку) для этого типа
    const style = getLayerStyle(type);
    
    const collection = new window.ymaps.GeoObjectCollection({}, {
      preset: style.icon, // 🔥 Применяем цветной пресет
    });

    features.forEach((feature) => {
      const props = feature.properties || feature;
      
      const name = props.name || feature.name || 'Без названия';
      const address = props.address || feature.address || '';
      const hours = props.working_hours || feature.working_hours || '';
      const phone = props.phone || feature.phone || '';
      
      const coords = feature.geometry?.coordinates;
      if (!coords) return;
      const [lon, lat] = coords;
      
      const placemark = new window.ymaps.Placemark(
        [lat, lon],
        {
          balloonContentHeader: name,
          balloonContentBody: `
            <strong>📍 ${address || '—'}</strong><br/>
            🕐 ${hours || '—'}<br/>
            📞 ${phone || '—'}
          `,
          hintContent: name,
        },
        {
          preset: style.icon, // 🔥 Применяем цветной пресет
        }
      );

      placemark.events.add('click', () => {
        this.onObjectSelect?.(feature);
      });

      collection.add(placemark);
    });

    // Сразу добавляем на карту (по умолчанию слой видим)
    this.map.geoObjects.add(collection);
    this.collections.set(type, collection);
    this.layerVisibleState.set(type, true); // 👈 Запоминаем, что слой виден
  }

  toggleLayer(type: TLayerType, visible: boolean): void {
    const collection = this.collections.get(type);
    if (!collection) return;

    // Проверяем текущее состояние из нашей мапы
    const isVisible = this.layerVisibleState.get(type) || false;

    if (visible && !isVisible) {
      // Нужно показать, но сейчас скрыт
      this.map.geoObjects.add(collection);
      this.layerVisibleState.set(type, true);
    } else if (!visible && isVisible) {
      // Нужно скрыть, но сейчас показан
      this.map.geoObjects.remove(collection);
      this.layerVisibleState.set(type, false);
    }
  }

  clearAll(): void {
    this.collections.forEach((collection) => {
      this.map.geoObjects.remove(collection);
    });
    this.collections.clear();
    this.layerVisibleState.clear();
  }
}