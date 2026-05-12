// frontend/src/components/MapView.tsx
import { useEffect, useRef, useState } from 'react';
import { TInfrastructureFeature } from '@/types/infrastructure';
import { MAP_CONFIG, LAYER_PRESETS } from '@/core/config';
import { MapLayerManager } from '@/core/map/MapLayerManager';
import { IsochroneResponse } from '@/core/services/IsochroneService';

interface MapViewProps {
  features: TInfrastructureFeature[];
  activeLayers: string[];
  onMapReady?: () => void;
  onMapClick?: (coords: [number, number]) => void;
  onObjectSelect?: (feature: TInfrastructureFeature) => void;
  onIsochronePointSelect?: (coords: [number, number]) => void;
  routeGeometry?: { type: 'LineString'; coordinates: [number, number][] };
  isochroneGeoJSON?: IsochroneResponse | null;
  startPoint?: [number, number] | null;
  endPoint?: [number, number] | null;
}

export default function MapView({
  features,
  activeLayers,
  onMapReady,
  onMapClick,
  onObjectSelect,
  onIsochronePointSelect,
  routeGeometry,
  isochroneGeoJSON,
  startPoint,
  endPoint,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerManagerRef = useRef<MapLayerManager | null>(null);
  const routePolylineRef = useRef<any>(null);
  const isochroneCollectionRef = useRef<any>(null);
  const startPointMarkRef = useRef<any>(null);
  const endPointMarkRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Инициализация карты
  useEffect(() => {
    if (!mapRef.current || !window.ymaps || isInitialized) return;

    ymaps.ready(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      mapInstanceRef.current = new ymaps.Map(mapRef.current, {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        controls: MAP_CONFIG.controls,
        type: 'yandex#map',
      });

      // Клик по карте → выбор точки
      mapInstanceRef.current.events.add('click', (e: any) => {
        const coords = e.get('coords') as [number, number];
        onMapClick?.(coords);
        onIsochronePointSelect?.(coords);
      });

      // Инициализация менеджера слоёв
      layerManagerRef.current = new MapLayerManager(
        mapInstanceRef.current,
        onObjectSelect
      );

      setIsInitialized(true);
      onMapReady?.();
    });

    // Очистка при размонтировании
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        layerManagerRef.current = null;
      }
    };
  }, []);

  // 2. Синхронизация слоёв инфраструктуры
  useEffect(() => {
    if (!layerManagerRef.current || !isInitialized) return;

    // Группировка по типу
    const groupedByType: Record<string, TInfrastructureFeature[]> = {};
    features.forEach((f) => {
      const type = f.properties.type;
      if (!groupedByType[type]) groupedByType[type] = [];
      groupedByType[type].push(f);
    });

    // Создание/обновление коллекций
    Object.entries(groupedByType).forEach(([type, layerFeatures]) => {
      layerManagerRef.current!.setLayer(type, layerFeatures);
    });

    // Управление видимостью
    const allTypes = Object.keys(LAYER_PRESETS);
    allTypes.forEach((type) => {
      const isVisible = activeLayers.includes(type);
      layerManagerRef.current!.toggleLayer(type, isVisible);
    });
  }, [features, activeLayers, isInitialized]);

  // 3. Отрисовка маршрута
  useEffect(() => {
    if (!mapInstanceRef.current || !routeGeometry) return;
    
    // Очистка старого маршрута
    if (routePolylineRef.current) {
      mapInstanceRef.current.geoObjects.remove(routePolylineRef.current);
    }
    
    // Конвертация [lon, lat] → [lat, lon] для Яндекс
    const yandexCoords = routeGeometry.coordinates.map(
      ([lon, lat]) => [lat, lon] as [number, number]
    );
    
    if (yandexCoords.length < 2) return;
    
    const polyline = new ymaps.Polyline(yandexCoords, {
      balloonContent: `🚶 Маршрут: ${routeGeometry.coordinates.length} точек`,
    }, {
      strokeColor: '#0057FF',
      strokeWidth: 4,
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
    });
    
    mapInstanceRef.current.geoObjects.add(polyline);
    routePolylineRef.current = polyline;
    
    // Центрирование карты на маршруте
    mapInstanceRef.current.setBounds(
      yandexCoords,
      { checkZoomRange: true, padding: [50, 50, 50, 50] }
    );
    
    return () => {
      if (routePolylineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.geoObjects.remove(routePolylineRef.current);
      }
    };
  }, [routeGeometry]);

  // 4. Отрисовка изохрон
  useEffect(() => {
    if (!mapInstanceRef.current || !isochroneGeoJSON) return;
    
    // Очистка старых изохрон
    if (isochroneCollectionRef.current) {
      mapInstanceRef.current.geoObjects.remove(isochroneCollectionRef.current);
    }
    
    const collection = new ymaps.GeoObjectCollection();
    const colors = ['#3b82f633', '#22c55e33', '#f59e0b33', '#ef444433']; // полупрозрачные
    
    isochroneGeoJSON.features.forEach((feature: any, idx: number) => {
      if (feature.geometry.type !== 'Polygon') return;
      
      // Конвертация координат полигона [lon, lat] → [lat, lon]
      const rings = feature.geometry.coordinates.map((ring: [number, number][]) => 
        ring.map(([lon, lat]) => [lat, lon] as [number, number])
      );
      
      const polygon = new ymaps.Polygon(rings, {
        balloonContent: `Зона доступности: ${feature.properties.time_min} мин`,
      }, {
        fillColor: colors[idx % colors.length],
        strokeColor: colors[idx % colors.length].replace('33', 'cc'),
        strokeWidth: 2,
      });
      
      collection.add(polygon);
    });
    
    mapInstanceRef.current.geoObjects.add(collection);
    isochroneCollectionRef.current = collection;
    
    return () => {
      if (isochroneCollectionRef.current) {
        mapInstanceRef.current.geoObjects.remove(isochroneCollectionRef.current);
      }
    };
  }, [isochroneGeoJSON]);

  // 5. Маркеры точки старта и финиша
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Точка старта (зелёная)
    if (startPointMarkRef.current) {
      mapInstanceRef.current.geoObjects.remove(startPointMarkRef.current);
    }
    if (startPoint) {
      startPointMarkRef.current = new ymaps.Placemark(startPoint, {
        balloonContent: '📍 Точка старта',
        iconCaption: 'Старт',
      }, {
        preset: 'islands#greenCircleDotIcon',
      });
      mapInstanceRef.current.geoObjects.add(startPointMarkRef.current);
    }

    // Точка финиша (красная)
    if (endPointMarkRef.current) {
      mapInstanceRef.current.geoObjects.remove(endPointMarkRef.current);
    }
    if (endPoint) {
      endPointMarkRef.current = new ymaps.Placemark(endPoint, {
        balloonContent: '🎯 Точка назначения',
        iconCaption: 'Финиш',
      }, {
        preset: 'islands#redCircleDotIcon',
      });
      mapInstanceRef.current.geoObjects.add(endPointMarkRef.current);
    }

    return () => {
      if (startPointMarkRef.current) {
        mapInstanceRef.current.geoObjects.remove(startPointMarkRef.current);
      }
      if (endPointMarkRef.current) {
        mapInstanceRef.current.geoObjects.remove(endPointMarkRef.current);
      }
    };
  }, [startPoint, endPoint]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}