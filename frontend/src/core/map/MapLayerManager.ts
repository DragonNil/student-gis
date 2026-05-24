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
  private layerVisibleState: Map<TLayerType, boolean> = new Map();
  private onObjectSelect?: (feature: TInfrastructureFeature) => void;
  
  // 🔑 Хранит исходные пресеты меток для восстановления после анализа
  private originalPresets = new WeakMap<any, string>();

  constructor(map: any, onObjectSelect?: (feature: TInfrastructureFeature) => void) {
    this.map = map;
    this.onObjectSelect = onObjectSelect;
  }

  setLayer(type: TLayerType, features: TInfrastructureFeature[]): void {
    if (this.collections.has(type)) {
      const oldCollection = this.collections.get(type);
      if (oldCollection) this.map.geoObjects.remove(oldCollection);
      this.layerVisibleState.delete(type);
    }

    const style = getLayerStyle(type);
    const collection = new window.ymaps.GeoObjectCollection({}, { preset: style.icon });

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
          balloonContentBody: `<strong>📍 ${address || '—'}</strong><br/>🕐 ${hours || '—'}<br/>📞 ${phone || '—'}`,
          hintContent: name,
        },
        { preset: style.icon }
      );

      placemark.events.add('click', () => this.onObjectSelect?.(feature));
      collection.add(placemark);
    });

    this.map.geoObjects.add(collection);
    this.collections.set(type, collection);
    this.layerVisibleState.set(type, true);
  }

  // 🔥 Подсветка объектов по радиусу (зелёный = внутри, красный = снаружи)

  highlightByDistance(center: [number, number], radiusMeters: number) {
    if (!(window as any).ymaps) return;
    const geo = (window as any).ymaps.coordSystem.geo;

    this.collections.forEach((collection) => {
      collection.each((placemark: any) => {
        // Сохраняем исходный пресет
        if (!this.originalPresets.has(placemark)) {
          this.originalPresets.set(placemark, placemark.options.get('preset'));
        }
        
        const placemarkCoords = placemark.geometry.getCoordinates(); // [lat, lon]
        const dist = geo.getDistance(center, placemarkCoords); // Возвращает метры
        
        const preset = dist <= radiusMeters 
          ? 'islands#greenCircleIcon' 
          : 'islands#redCircleIcon';
        placemark.options.set('preset', preset);
      });
    });
  }
  
  // 🔥 Сброс цветов к исходным
  resetHighlights() {
    this.collections.forEach((collection) => {
      collection.each((placemark: any) => {
        const original = this.originalPresets.get(placemark);
        if (original) placemark.options.set('preset', original);
      });
    });
    this.originalPresets = new WeakMap();
  }

  toggleLayer(type: TLayerType, visible: boolean): void {
    const collection = this.collections.get(type);
    if (!collection) return;
    const isVisible = this.layerVisibleState.get(type) || false;

    if (visible && !isVisible) {
      this.map.geoObjects.add(collection);
      this.layerVisibleState.set(type, true);
    } else if (!visible && isVisible) {
      this.map.geoObjects.remove(collection);
      this.layerVisibleState.set(type, false);
    }
  }

  clearAll(): void {
    this.collections.forEach((c) => this.map.geoObjects.remove(c));
    this.collections.clear();
    this.layerVisibleState.clear();
    this.originalPresets = new WeakMap();
  }
}