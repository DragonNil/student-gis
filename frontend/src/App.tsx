// frontend/src/App.tsx
import { useState, useRef, useCallback } from 'react';
import { useInfrastructureData } from '@/hooks/useInfrastructureData';
import MapView from '@/components/MapView';
import LayerControl from '@/components/LayerControl';
import { RouteService, type RoutingMode, type RouteResponse, type RouteOption } from '@/core/services/RouteService';
import { IsochroneService, type IsochroneResponse } from '@/core/services/IsochroneService';
import { TInfrastructureFeature } from '@/types/infrastructure';
import RoutePanel from './components/RouterPanel';

const ALL_LAYERS = ['university', 'dormitory', 'canteen', 'sport', 'copy_center'] as const;
type LayerType = typeof ALL_LAYERS[number];

function App() {
  const { features, loading, error, filterByTypes, refresh } = useInfrastructureData();
  const [activeLayers, setActiveLayers] = useState<LayerType[]>([...ALL_LAYERS]);
  
  // Маршрутизация
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  
  // 👇 Обновлённый стейт для новых RouteResponse
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [selectedRouteOption, setSelectedRouteOption] = useState<RouteOption | null>(null);
  
  const [routeMode, setRouteMode] = useState<RoutingMode>('pedestrian');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // Изохроны
  const [isochronePoint, setIsochronePoint] = useState<[number, number] | null>(null);
  const [isochroneResult, setIsochroneResult] = useState<IsochroneResponse | null>(null);
  const [isochroneMode, setIsochroneMode] = useState<'pedestrian' | 'auto'>('pedestrian');
  const [isochroneIntervals] = useState<number[]>([5, 10, 15]);
  
  // Сервисы
  const routeServiceRef = useRef<RouteService>(new RouteService(import.meta.env.VITE_YANDEX_MAPS_API_KEY));
  const isochroneServiceRef = useRef<IsochroneService>(new IsochroneService(import.meta.env.VITE_YANDEX_MAPS_API_KEY));

  // Фильтрация объектов по активным слоям
  const filteredFeatures = filterByTypes(activeLayers);

  // Обработчики слоёв
  const toggleLayer = useCallback((type: LayerType) => {
    setActiveLayers(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const toggleAllLayers = useCallback((checked: boolean) => {
    setActiveLayers(checked ? [...ALL_LAYERS] : []);
  }, []);

  // Клик по карте → точка старта маршрута
  const handleMapClick = useCallback((coords: [number, number]) => {
    setStartPoint(coords);
    setRouteResult(null);
    setSelectedRouteOption(null);
  }, []);

  // Построение маршрута с поддержкой нескольких вариантов
  const buildRoute = async (from: [number, number], to: [number, number], mode: RoutingMode) => {
    setIsLoadingRoute(true);
    console.log(from, to, mode);
    try {
      const result = await routeServiceRef.current.buildRoute({
        from,
        to,
        mode,
      });
      
      setRouteResult(result);
      // 👇 Выбираем первый вариант по умолчанию
      console.log(result)
      setSelectedRouteOption(result.options[0]);
    } catch (err: any) {
      console.error('❌ Ошибка маршрутизации:', err);
      alert(err.message || 'Не удалось построить маршрут. Проверьте подключение к интернету.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Клик по объекту → точка финиша + авто-построение маршрута
  const handleObjectSelect = useCallback(async (feature: TInfrastructureFeature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const coords: [number, number] = [lat, lon]; // Конвертация для Яндекс.Карт
    setEndPoint(coords);
    
    // Авто-построение если есть старт
    if (startPoint) {
      await buildRoute(startPoint, coords, routeMode);
    }
  }, [startPoint, routeMode]);

  // Обработчик построения маршрута из RoutePanel
  const handleBuildRoute = () => {
    if (startPoint && endPoint) {
      buildRoute(startPoint, endPoint, routeMode);
    }
  };

  // 👇 Новый обработчик: выбор варианта маршрута
  const handleSelectRouteOption = (index: number) => {
    if (routeResult?.options?.[index]) {
      setSelectedRouteOption(routeResult.options[index]);
    }
  };

  const handleClearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRouteResult(null);
    setSelectedRouteOption(null);
  };

  // Расчёт изохрон
  const handleCalculateIsochrone = async () => {
    if (!isochronePoint) return;
    
    try {
      const result = await isochroneServiceRef.current.calculate({
        point: isochronePoint,
        mode: isochroneMode,
        intervals: isochroneIntervals,
      });
      setIsochroneResult(result);
    } catch (err) {
      console.error('❌ Ошибка расчёта изохрон:', err);
      alert('Не удалось рассчитать зоны доступности.');
    }
  };

  const handleClearIsochrone = () => {
    setIsochronePoint(null);
    setIsochroneResult(null);
  };

  // Обновление данных по кнопке
  const handleRefresh = async () => {
    await refresh();
  };

  // Загрузка состояний
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <h2>Загрузка карты и данных...</h2>
          <p style={{ color: '#64748b' }}>Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#d32f2f' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2>Ошибка загрузки данных</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} style={{ marginTop: '16px', padding: '10px 20px', background: '#0057FF', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            🔄 Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      {/* Левая панель управления */}
      <aside style={{ width: '360px', minWidth: '320px', padding: '16px', background: '#f8f9fa', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Заголовок */}
        <div>
          <h1 style={{ fontSize: '18px', margin: '0 0 8px', fontWeight: '600' }}>🗺️ ГИС Таганрог</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Объектов: <b>{features.length}</b> | Слоёв: <b>{activeLayers.length}</b>
          </p>
        </div>

        {/* Управление слоями */}
        <LayerControl activeLayers={activeLayers} onToggle={toggleLayer} onToggleAll={toggleAllLayers} />

        {/* 👇 Панель маршрутизации — обновлённые пропсы */}
        <RoutePanel
          startPoint={startPoint}
          endPoint={endPoint}
          routeResult={routeResult} // 👈 Передаём полный RouteResponse
          isLoading={isLoadingRoute}
          onModeChange={setRouteMode}
          onBuildRoute={handleBuildRoute}
          onClear={handleClearRoute}
          onSelectRoute={handleSelectRouteOption} // 👇 Новый пропс для выбора варианта
          currentMode={routeMode}
        />

        {/* Панель изохрон */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>🔵 Зоны доступности</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Режим:</label>
            <select value={isochroneMode} onChange={(e) => setIsochroneMode(e.target.value as 'pedestrian' | 'auto')} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="pedestrian">🚶 Пешеход</option>
              <option value="auto">🚗 Автомобиль</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
            Интервалы: {isochroneIntervals.join(', ')} мин
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCalculateIsochrone} disabled={!isochronePoint} style={{ flex: 1, padding: '8px', background: isochronePoint ? '#22c55e' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: isochronePoint ? 'pointer' : 'not-allowed' }}>
              🔵 Рассчитать
            </button>
            <button onClick={handleClearIsochrone} style={{ padding: '8px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
          </div>
          
          {!isochronePoint && (
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
              💡 Кликните по карте для выбора точки анализа
            </p>
          )}
        </div>

        {/* Кнопка обновления */}
        <button onClick={handleRefresh} style={{ width: '100%', padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          🔄 Обновить данные
        </button>

        {/* Футер */}
        <div style={{ marginTop: 'auto', fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
          <div>2026 • ЮФУ</div>
          <div>Белинина А.Э.</div>
        </div>
      </aside>

      {/* Карта */}
      <main style={{ flex: 1, position: 'relative' }}>
        <MapView
          features={filteredFeatures}
          activeLayers={activeLayers}
          onMapReady={() => {}}
          onMapClick={handleMapClick}
          onObjectSelect={handleObjectSelect}
          onIsochronePointSelect={setIsochronePoint}
          // 👇 Передаём геометрию выбранного варианта маршрута
          routeGeometry={selectedRouteOption?.geometry || null}
          isochroneGeoJSON={isochroneResult}
          startPoint={startPoint}
          endPoint={endPoint}
          // 👇 Передаём текущий режим для цветовой индикации маршрута
          currentMode={routeMode}
        />
      </main>
    </div>
  );
}

export default App;