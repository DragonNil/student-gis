// frontend/src/components/RoutePanel.tsx
import { useState } from 'react';
import { RoutingMode, RouteResponse } from '@/core/services/RouteService';

interface RoutePanelProps {
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
  routeResult: RouteResponse | null;
  isLoading: boolean;
  onModeChange: (mode: RoutingMode) => void;
  onBuildRoute: () => void;
  onClear: () => void;
  onSelectRoute: (index: number) => void;
  currentMode: RoutingMode;
}

const MODES: { value: RoutingMode; label: string; emoji: string }[] = [
  { value: 'pedestrian', label: 'Пешком', emoji: '🚶' },
  { value: 'auto', label: 'На авто', emoji: '🚗' },
  { value: 'public_transport', label: 'Транспорт', emoji: '🚌' },
];

export default function RoutePanel({
  startPoint, endPoint, routeResult, isLoading,
  onModeChange, onBuildRoute, onClear, onSelectRoute, currentMode
}: RoutePanelProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    onSelectRoute(idx);
  };

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginTop: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>🧭 Построение маршрута</h3>
      
      {/* Режимы */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button key={m.value} onClick={() => onModeChange(m.value)} title={m.label}
            style={{ flex: '1 1 auto', minWidth: '70px', padding: '8px', border: currentMode === m.value ? '2px solid #0057FF' : '1px solid #ddd', borderRadius: '6px', background: currentMode === m.value ? '#f0f7ff' : '#fff', color: currentMode === m.value ? '#0057FF' : '#64748b', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>{m.emoji}</span>
          </button>
        ))}
      </div>

      {/* Статус */}
      <div style={{ fontSize: '12px', marginBottom: '12px', color: '#64748b', lineHeight: 1.5 }}>
        <div>📍 <strong>Старт:</strong> <span style={{ color: startPoint ? '#22c55e' : '#94a3b8' }}>{startPoint ? 'установлен' : 'кликните по карте'}</span></div>
        <div>🎯 <strong>Финиш:</strong> <span style={{ color: endPoint ? '#22c55e' : '#94a3b8' }}>{endPoint ? 'выбран объект' : 'кликните на метку'}</span></div>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button onClick={onBuildRoute} disabled={!startPoint || !endPoint || isLoading}
          style={{ flex: 1, padding: '10px', background: (!startPoint || !endPoint || isLoading) ? '#94a3b8' : isLoading ? '#60a5fa' : '#0057FF', color: '#fff', border: 'none', borderRadius: '6px', cursor: (!startPoint || !endPoint || isLoading) ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '13px' }}>
          {isLoading ? '⏳ Построение...' : '🗺️ Построить маршрут'}
        </button>
        <button onClick={onClear} title="Очистить" style={{ padding: '10px 14px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
      </div>

      {/* Варианты маршрутов */}
      {routeResult?.options && routeResult.options.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#334155' }}>Доступные варианты:</div>
          {routeResult.options.map((opt, idx) => (
            <button key={opt.id} onClick={() => handleSelect(idx)}
              style={{ width: '100%', padding: '10px 12px', marginBottom: '6px', background: idx === selectedIdx ? '#f0f7ff' : '#f8fafc', border: idx === selectedIdx ? '2px solid #0057FF' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${idx === selectedIdx ? '#0057FF' : '#94a3b8'}`, background: idx === selectedIdx ? '#0057FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx === selectedIdx && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: idx === selectedIdx ? 600 : 500, color: idx === selectedIdx ? '#0057FF' : '#334155' }}>
                    {opt.label}
                    {idx === 0 && idx !== selectedIdx && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#22c55e', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>⚡ Быстрый</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>⏱️ {opt.time} • 🚶 {opt.distance}</div>
                </div>
              </div>
              {idx === selectedIdx && <span style={{ fontSize: '16px', color: '#0057FF' }}>→</span>}
            </button>
          ))}
        </div>
      )}

      {/* Ссылка */}
      {routeResult?.options?.[selectedIdx] && (
        <div style={{ background: '#f0f7ff', padding: '10px 14px', borderRadius: '6px', borderLeft: '4px solid #0057FF' }}>
          <a href={routeResult.options[selectedIdx].share_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#0057FF', textDecoration: 'none', fontWeight: 500 }}>
            🔗 Открыть "{routeResult.options[selectedIdx].label}" в Яндекс.Картах →
          </a>
        </div>
      )}

      {!startPoint && !routeResult && (
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>💡 Кликните по карте для старта, затем на объект для маршрута</p>
      )}
    </div>
  );
}