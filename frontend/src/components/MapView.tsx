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
  routeGeometry?: { type: 'LineString'; coordinates: [number, number][] } | null;
  isochroneGeoJSON?: IsochroneResponse | null;
  startPoint?: [number, number] | null;
  endPoint?: [number, number] | null;
  currentMode?: 'pedestrian' | 'auto' | 'transit';
  analysisCenter?: [number, number] | null;
  analysisRadius?: number | null;
}

// 🔥 Цвета для зон доступности (полупрозрачные для заливки)
// Формат: #RRGGBB33 (последние 2 символа — альфа-канал прозрачности)
const ISO_COLOR_MAP: Record<number, string> = {
  5: '#f59e0b33',   // 🟠 Оранжевый — 5 минут
  10: '#ef444433',  // 🔴 Красный — 10 минут
  15: '#0057FF33',  // 🔵 Синий — 15 минут
  20: '#22c55e33',  // 🟢 Зелёный — 20 минут (запасной)
};

// Цвета обводки (более непрозрачные)
const ISO_STROKE_MAP: Record<number, string> = {
  5: '#f59e0bcc',
  10: '#ef4444cc',
  15: '#0057FFcc',
  20: '#22c55ecc',
};

export default function MapView({
  features, activeLayers, onMapReady, onMapClick, onObjectSelect,
  onIsochronePointSelect, routeGeometry, isochroneGeoJSON, startPoint, endPoint, currentMode,
  analysisCenter, analysisRadius
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerManagerRef = useRef<MapLayerManager | null>(null);
  const routePolylineRef = useRef<any>(null);
  const isochroneCollectionRef = useRef<any>(null);
  const startMarkRef = useRef<any>(null);
  const endMarkRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔑 Рефы для колбэков (чтобы клик работал стабильно)
  const onMapClickRef = useRef(onMapClick);
  const onIsochroneRef = useRef(onIsochronePointSelect);
  const onObjectSelectRef = useRef(onObjectSelect);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onIsochroneRef.current = onIsochronePointSelect; }, [onIsochronePointSelect]);
  useEffect(() => { onObjectSelectRef.current = onObjectSelect; }, [onObjectSelect]);

  // 1. Инициализация карты + КЛИК
  useEffect(() => {
    if (!mapRef.current || !(window as any).ymaps || isInitialized) return;
    
    (window as any).ymaps.ready(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      
      mapInstanceRef.current = new (window as any).ymaps.Map(mapRef.current, {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        controls: MAP_CONFIG.controls,
        type: 'yandex#map',
      });

      mapInstanceRef.current.events.add('click', (e: any) => {
        const coords = e.get('coords') as [number, number];
        onMapClickRef.current?.(coords);
        onIsochroneRef.current?.(coords);
      });

      layerManagerRef.current = new MapLayerManager(mapInstanceRef.current, (feat: any) => onObjectSelectRef.current?.(feat));
      setIsInitialized(true);
      onMapReady?.();
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        layerManagerRef.current = null;
      }
    };
  }, []);

  // 2. Слои инфраструктуры
  useEffect(() => {
    if (!layerManagerRef.current || !isInitialized) return;
    const grouped: Record<string, TInfrastructureFeature[]> = {};
    features.forEach((f: any) => { const t = f.properties?.type || f.type; if (!grouped[t]) grouped[t] = []; grouped[t].push(f); });
    Object.entries(grouped).forEach(([t, arr]) => layerManagerRef.current!.setLayer(t as any, arr));
    Object.keys(LAYER_PRESETS).forEach(t => layerManagerRef.current!.toggleLayer(t as any, activeLayers.includes(t)));
  }, [features, activeLayers, isInitialized]);

  // 3. Маршрут
  useEffect(() => {
    if (!mapInstanceRef.current || !routeGeometry) return;
    if (routePolylineRef.current) { mapInstanceRef.current.geoObjects.remove(routePolylineRef.current); routePolylineRef.current = null; }
    const coords = routeGeometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
    if (coords.length < 2) return;
    const colors: Record<string, string> = { pedestrian: '#22c55e', auto: '#0057FF', transit: '#f59e0b' };
    const polyline = new (window as any).ymaps.Polyline(coords, {}, { strokeColor: colors[currentMode || 'auto'], strokeWidth: 4, strokeOpacity: 0.9 });
    mapInstanceRef.current.geoObjects.add(polyline); routePolylineRef.current = polyline;
    return () => { if (routePolylineRef.current) mapInstanceRef.current.geoObjects.remove(routePolylineRef.current); };
  }, [routeGeometry, currentMode]);

  // 4. Анализ зоны доступности
  useEffect(() => {
    if (!mapInstanceRef.current || !layerManagerRef.current) return;
    if (circleRef.current) { mapInstanceRef.current.geoObjects.remove(circleRef.current); circleRef.current = null; }
    layerManagerRef.current.resetHighlights();

    if (analysisCenter && analysisRadius && analysisRadius > 0) {
      const circle = new (window as any).ymaps.Circle(
        [analysisCenter, analysisRadius],
        { fillColor: '#0057FF15', strokeColor: '#0057FF', strokeWidth: 2, strokeStyle: 'dash' }
      );
      mapInstanceRef.current.geoObjects.add(circle);
      circleRef.current = circle;
      layerManagerRef.current.highlightByDistance(analysisCenter, analysisRadius);
    }
  }, [analysisCenter, analysisRadius]);

  // 🔥 5. Изохроны (цвета привязаны к time_min, а не к индексу)
  useEffect(() => {
    if (!mapInstanceRef.current || !isochroneGeoJSON) return;
    if (isochroneCollectionRef.current) { mapInstanceRef.current.geoObjects.remove(isochroneCollectionRef.current); isochroneCollectionRef.current = null; }
    
    // Сортируем: большие зоны первыми (чтобы маленькие рисовались поверх)
    const sorted = [...isochroneGeoJSON.features].sort((a: any, b: any) => 
      b.properties.time_min - a.properties.time_min
    );
    
    const col = new (window as any).ymaps.GeoObjectCollection();
    
    sorted.forEach((feat: any) => {
      if (feat.geometry?.type !== 'Polygon') return;
      
      const rings = feat.geometry.coordinates.map((ring: [number, number][]) => 
        ring.map(([lon, lat]) => [lat, lon])
      );
      
      // 🔥 Получаем цвет по значению time_min (с фолбэком на оранжевый)
      const timeMin = feat.properties.time_min;
      const fillColor = ISO_COLOR_MAP[timeMin] || '#f59e0b33';
      const strokeColor = ISO_STROKE_MAP[timeMin] || '#f59e0bcc';
      
      const poly = new (window as any).ymaps.Polygon(rings, {
        balloonContent: `Зона: ${timeMin} мин`,
      }, {
        fillColor,
        strokeColor,
        strokeWidth: 2,
        opacity: 0.7,
      });
      
      col.add(poly);
    });
    
    mapInstanceRef.current.geoObjects.add(col);
    isochroneCollectionRef.current = col;
    
    return () => {
      if (isochroneCollectionRef.current) {
        mapInstanceRef.current.geoObjects.remove(isochroneCollectionRef.current);
        isochroneCollectionRef.current = null;
      }
    };
  }, [isochroneGeoJSON]);

  // 6. Маркеры
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (startMarkRef.current) mapInstanceRef.current.geoObjects.remove(startMarkRef.current);
    if (startPoint) { startMarkRef.current = new (window as any).ymaps.Placemark(startPoint, { balloonContent: '📍 Старт' }, { preset: 'islands#greenCircleDotIcon' }); mapInstanceRef.current.geoObjects.add(startMarkRef.current); }
    if (endMarkRef.current) mapInstanceRef.current.geoObjects.remove(endMarkRef.current);
    if (endPoint) { endMarkRef.current = new (window as any).ymaps.Placemark(endPoint, { balloonContent: '🎯 Финиш' }, { preset: 'islands#redCircleDotIcon' }); mapInstanceRef.current.geoObjects.add(endMarkRef.current); }
    return () => { if (startMarkRef.current) mapInstanceRef.current.geoObjects.remove(startMarkRef.current); if (endMarkRef.current) mapInstanceRef.current.geoObjects.remove(endMarkRef.current); };
  }, [startPoint, endPoint]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* 🔥 Легенда изохрон с правильными цветами */}
      {isochroneGeoJSON && isochroneGeoJSON.features.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'white',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: 13,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minWidth: 180,
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 8 }}>
            🚶 Зоны доступности
          </div>
          
          {/* Сортируем для легенды: от маленьких к большим (5→10→15) */}
          {[...isochroneGeoJSON.features]
            .sort((a: any, b: any) => a.properties.time_min - b.properties.time_min)
            .map((feat: any) => {
              const timeMin = feat.properties.time_min;
              // 🔥 Берём цвет из мапы по значению time_min
              const fillColor = ISO_COLOR_MAP[timeMin] || '#f59e0b33';
              const strokeColor = ISO_STROKE_MAP[timeMin] || '#f59e0bcc';
              
              return (
                <div key={timeMin} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: fillColor,
                    border: `2px solid ${strokeColor}`,
                    flexShrink: 0,
                  }} />
                  <span style={{ color: '#444' }}><strong>{timeMin} мин</strong></span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}