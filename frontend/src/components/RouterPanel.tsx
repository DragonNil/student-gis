// frontend/src/components/RoutePanel.tsx
import { RoutingMode } from '@/core/services/RouteService';

interface RoutePanelProps {
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
  routeResult: {
    time: string;
    distance: string;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    share_link: string;
  } | null;
  isLoading: boolean;
  onModeChange: (mode: RoutingMode) => void;
  onBuildRoute: () => void;
  onClear: () => void;
  currentMode: RoutingMode;
}

const MODES: Array<{ value: RoutingMode; label: string; emoji: string }> = [
  { value: 'pedestrian', label: 'Пешком', emoji: '🚶' },
  { value: 'auto', label: 'На авто', emoji: '🚗' },
  { value: 'public_transport', label: 'Транспорт', emoji: '🚌' },
];

export default function RoutePanel({
  startPoint,
  endPoint,
  routeResult,
  isLoading,
  onModeChange,
  onBuildRoute,
  onClear,
  currentMode,
}: RoutePanelProps) {
  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '8px', 
      padding: '16px', 
      marginTop: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>🧭 Построение маршрута</h3>
      
      {/* Выбор режима */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            style={{
              flex: '1 1 auto',
              minWidth: '70px',
              padding: '6px 10px',
              border: currentMode === mode.value ? '2px solid #0057FF' : '1px solid #ddd',
              borderRadius: '6px',
              background: currentMode === mode.value ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span>{mode.emoji}</span>
            <span style={{ display: 'none'}}>
              {mode.label}
            </span>
          </button>
        ))}
      </div>
      
      {/* Статус точек */}
      <div style={{ fontSize: '12px', marginBottom: '12px', color: '#64748b' }}>
        <div>📍 Старт: {startPoint ? 'установлен' : 'кликните по карте'}</div>
        <div>🎯 Финиш: {endPoint ? 'выбран объект' : 'кликните на метку'}</div>
      </div>
      
      {/* Кнопки действий */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={onBuildRoute}
          disabled={!startPoint || !endPoint || isLoading}
          style={{
            flex: 1,
            padding: '10px',
            background: (!startPoint || !endPoint || isLoading) ? '#94a3b8' : '#0057FF',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: (!startPoint || !endPoint || isLoading) ? 'not-allowed' : 'pointer',
            fontWeight: '500',
          }}
        >
          {isLoading ? '⏳ Построение...' : '🗺️ Построить маршрут'}
        </button>
        <button
          onClick={onClear}
          style={{
            padding: '10px 16px',
            background: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          🗑️
        </button>
      </div>
      
      {/* Результат */}
      {routeResult && (
        <div style={{ 
          background: '#f0f7ff', 
          padding: '12px', 
          borderRadius: '6px',
          borderLeft: '4px solid #0057FF'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            <strong>⏱️ Время:</strong> {routeResult.time}<br/>
            <strong>🚶 Расстояние:</strong> {routeResult.distance}
          </div>
          <a 
            href={routeResult.share_link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-block',
              fontSize: '12px', 
              color: '#0057FF',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            🔗 Открыть в Яндекс.Картах →
          </a>
        </div>
      )}
      
      {/* Подсказка */}
      {!startPoint && !routeResult && (
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
          💡 Кликните по карте, чтобы выбрать точку старта, затем кликните на объект для построения маршрута
        </p>
      )}
    </div>
  );
}