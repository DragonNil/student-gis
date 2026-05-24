// frontend/src/App.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
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
  
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [selectedRouteOption, setSelectedRouteOption] = useState<RouteOption | null>(null);
  const [routeMode, setRouteMode] = useState<RoutingMode>('pedestrian');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  const [isochronePoint, setIsochronePoint] = useState<[number, number] | null>(null);
  const [isochroneResult, setIsochroneResult] = useState<IsochroneResponse | null>(null);
  const [isochroneMode, setIsochroneMode] = useState<'pedestrian' | 'auto'>('pedestrian');
  const [isochroneIntervals] = useState<number[]>([5, 10, 15]);
  
  // 🔍 Анализ доступности
  const [analysisCenter, setAnalysisCenter] = useState<[number, number] | null>(null);
  const [analysisRadius, setAnalysisRadius] = useState<number>(1000);
  const [analysisMode, setAnalysisMode] = useState<'idle' | 'waiting' | 'active'>('idle');
  
  // 🔑 Ref для мгновенного чтения режима без замыканий
  const analysisModeRef = useRef(analysisMode);
  useEffect(() => { analysisModeRef.current = analysisMode; }, [analysisMode]);

  const routeServiceRef = useRef<RouteService>(new RouteService(import.meta.env.VITE_YANDEX_MAPS_API_KEY));
  const isochroneServiceRef = useRef<IsochroneService>(new IsochroneService(import.meta.env.VITE_YANDEX_MAPS_API_KEY));

  const filteredFeatures = filterByTypes(activeLayers);

  const toggleLayer = useCallback((type: LayerType) => setActiveLayers(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]), []);
  const toggleAllLayers = useCallback((checked: boolean) => setActiveLayers(checked ? [...ALL_LAYERS] : []), []);

  // 🔥 Обработчик клика
  const handleMapClick = useCallback((coords: [number, number]) => {
    if (analysisModeRef.current === 'waiting') {
      setAnalysisCenter(coords);
      setAnalysisMode('active');
      return;
    }
    setStartPoint(coords);
    setRouteResult(null);
    setSelectedRouteOption(null);
  }, []);

  const buildRoute = async (from: [number, number], to: [number, number], mode: RoutingMode) => {
    setIsLoadingRoute(true);
    try {
      const result = await routeServiceRef.current.buildRoute({ from, to, mode });
      if (!result?.options || result.options.length === 0) throw new Error('Маршруты не найдены.');
      setRouteResult(result);
      setSelectedRouteOption(result.options[0]);
    } catch (err: any) {
      alert(err.message || 'Не удалось построить маршрут');
      setRouteResult(null); setSelectedRouteOption(null);
    } finally { setIsLoadingRoute(false); }
  };

  const handleObjectSelect = useCallback(async (feature: TInfrastructureFeature) => {
    const [lon, lat] = feature.geometry.coordinates;
    setEndPoint([lat, lon]);
    if (startPoint) await buildRoute(startPoint, [lat, lon], routeMode);
  }, [startPoint, routeMode]);

  const handleBuildRoute = () => { if (startPoint && endPoint) buildRoute(startPoint, endPoint, routeMode); };
  const handleSelectRouteOption = (index: number) => { if (routeResult?.options?.[index]) setSelectedRouteOption(routeResult.options[index]); };
  const handleClearRoute = () => { setStartPoint(null); setEndPoint(null); setRouteResult(null); setSelectedRouteOption(null); };
  
  const handleCalculateIsochrone = async () => {
    if (!isochronePoint) return;
    try { setIsochroneResult(await isochroneServiceRef.current.calculate({ point: isochronePoint, mode: isochroneMode, intervals: isochroneIntervals })); }
    catch { alert('Не удалось рассчитать зоны доступности.'); }
  };
  const handleClearIsochrone = () => { setIsochronePoint(null); setIsochroneResult(null); };
  const handleRefresh = async () => { await refresh(); };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div style={{textAlign:'center'}}><div style={{fontSize:'48px',marginBottom:'16px'}}>🗺️</div><h2>Загрузка...</h2></div></div>;
  if (error) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#d32f2f'}}><div style={{textAlign:'center'}}><div style={{fontSize:'48px',marginBottom:'16px'}}>⚠️</div><h2>Ошибка</h2><p>{error}</p><button onClick={handleRefresh} style={{marginTop:'16px',padding:'10px 20px',background:'#0057FF',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>🔄 Повторить</button></div></div>;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <aside style={{ width: '360px', minWidth: '320px', padding: '16px', background: '#f8f9fa', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', margin: '0 0 8px', fontWeight: '600' }}>🗺️ ГИС Таганрог</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Объектов: <b>{features.length}</b> | Слоёв: <b>{activeLayers.length}</b></p>
        </div>

        <LayerControl activeLayers={activeLayers} onToggle={toggleLayer} onToggleAll={toggleAllLayers} />
        <RoutePanel startPoint={startPoint} endPoint={endPoint} routeResult={routeResult} isLoading={isLoadingRoute} onModeChange={setRouteMode} onBuildRoute={handleBuildRoute} onClear={handleClearRoute} onSelectRoute={handleSelectRouteOption} currentMode={routeMode} />

        {/* 📏 АНАЛИЗ ДОСТУПНОСТИ */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>📏 Анализ доступности</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Радиус зоны (метры):</label>
            <input type="number" value={analysisRadius} onChange={(e) => setAnalysisRadius(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} min="50" max="50000" step="50" />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button onClick={() => { setAnalysisMode(prev => prev === 'waiting' ? 'idle' : 'waiting'); if (analysisMode !== 'waiting') setAnalysisCenter(null); }} style={{ flex: 1, padding: '10px', background: analysisMode === 'waiting' ? '#f59e0b' : '#0057FF', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>{analysisMode === 'waiting' ? '👆 Кликните по карте...' : '📍 Выбрать центр'}</button>
            <button onClick={() => { setAnalysisCenter(null); setAnalysisMode('idle'); }} style={{ padding: '10px 14px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
          </div>
          {analysisMode === 'active' && analysisCenter && (
            <div style={{ fontSize: '13px', color: '#059669', background: '#ecfdf5', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>✅ Зона построена<br/>🟢 Внутри {analysisRadius}м | 🔴 Снаружи</div>
          )}
        </div>

        {/* ИЗОХРОНЫ */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>🔵 Зоны доступности (Изохроны)</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Режим:</label>
            <select value={isochroneMode} onChange={(e) => setIsochroneMode(e.target.value as 'pedestrian' | 'auto')} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="pedestrian">🚶 Пешеход</option><option value="auto">🚗 Автомобиль</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>Интервалы: {isochroneIntervals.join(', ')} мин</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCalculateIsochrone} disabled={!isochronePoint} style={{ flex: 1, padding: '8px', background: isochronePoint ? '#22c55e' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: isochronePoint ? 'pointer' : 'not-allowed' }}>🔵 Рассчитать</button>
            <button onClick={handleClearIsochrone} style={{ padding: '8px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
          </div>
        </div>

        <button onClick={handleRefresh} style={{ width: '100%', padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🔄 Обновить данные</button>
        <div style={{ marginTop: 'auto', fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}><div>2026 • ЮФУ</div><div>Белинина А.Э.</div></div>
      </aside>

      <main style={{ flex: 1, position: 'relative' }}>
        <MapView
          features={filteredFeatures}
          activeLayers={activeLayers}
          onMapReady={() => {}}
          onMapClick={handleMapClick}
          onObjectSelect={handleObjectSelect}
          onIsochronePointSelect={setIsochronePoint}
          routeGeometry={selectedRouteOption?.geometry || null}
          isochroneGeoJSON={isochroneResult}
          startPoint={startPoint}
          endPoint={endPoint}
          currentMode={routeMode}
          analysisCenter={analysisCenter}
          analysisRadius={analysisRadius}
        />
      </main>
    </div>
  );
}

export default App;