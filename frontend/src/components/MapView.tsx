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
  currentMode?: 'pedestrian' | 'auto' | 'public_transport';
  analysisCenter?: [number, number] | null;
  analysisRadius?: number | null;
}

const ISO_COLORS = ['#0057FF33', '#ef444433', '#f59e0b33', '#22c55e33', '#64748b33'];

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

  // 🔑 Рефы для колбэков (чтобы клик работал стабильно без пересоздания слушателей)
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

      // ✅ Надёжный клик через ref (работает всегда, не зависит от перерендеров React)
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
    const colors: Record<string, string> = { pedestrian: '#22c55e', auto: '#0057FF', public_transport: '#f59e0b' };
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

  // 5. Изохроны
  useEffect(() => {
    if (!mapInstanceRef.current || !isochroneGeoJSON) return;
    if (isochroneCollectionRef.current) { mapInstanceRef.current.geoObjects.remove(isochroneCollectionRef.current); isochroneCollectionRef.current = null; }
    const sorted = [...isochroneGeoJSON.features].sort((a: any, b: any) => b.properties.time_min - a.properties.time_min);
    const col = new (window as any).ymaps.GeoObjectCollection();
    sorted.forEach((feat: any, idx: number) => {
      if (feat.geometry?.type !== 'Polygon') return;
      const rings = feat.geometry.coordinates.map((ring: [number, number][]) => ring.map(([lon, lat]) => [lat, lon]));
      const color = ISO_COLORS[idx % ISO_COLORS.length];
      const poly = new (window as any).ymaps.Polygon(rings, { balloonContent: `Зона: ${feat.properties.time_min} мин` }, { fillColor: color, strokeColor: color.replace('33', 'cc'), strokeWidth: 2, opacity: 0.7 });
      col.add(poly);
    });
    mapInstanceRef.current.geoObjects.add(col); isochroneCollectionRef.current = col;
    return () => { if (isochroneCollectionRef.current) mapInstanceRef.current.geoObjects.remove(isochroneCollectionRef.current); };
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
      {isochroneGeoJSON && isochroneGeoJSON.features.length > 0 && (
        <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: 13, fontFamily: 'system-ui', minWidth: 180, pointerEvents: 'none' }}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 8 }}>🚶 Зоны доступности</div>
          {[...isochroneGeoJSON.features].sort((a: any, b: any) => a.properties.time_min - b.properties.time_min).map((feat: any) => {
            const idx = [...isochroneGeoJSON.features].sort((a: any, b: any) => a.properties.time_min - b.properties.time_min).findIndex(f => f.properties.time_min === feat.properties.time_min);
            const color = ISO_COLORS[idx % ISO_COLORS.length];
            return (<div key={feat.properties.time_min} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={{ width: 24, height: 24, borderRadius: 4, background: color, border: `2px solid ${color.replace('33', 'cc')}`, flexShrink: 0 }} /><span style={{ color: '#444' }}><strong>{feat.properties.time_min} мин</strong></span></div>);
          })}
        </div>
      )}
    </div>
  );
}