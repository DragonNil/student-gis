// src/components/IsochronePanel.tsx
import { useState } from 'react';
import { IsochroneService } from '@/core/services/IsochroneService';

interface Props {
  point: [number, number] | null;
  onIsochroneReady: (geojson: any) => void;
  onClear: () => void;
}

const DEFAULT_INTERVALS = [5, 10, 15];

export default function IsochronePanel({ point, onIsochroneReady, onClear }: Props) {
  const [mode, setMode] = useState<'pedestrian' | 'auto'>('pedestrian');
  const [intervals, setIntervals] = useState<number[]>(DEFAULT_INTERVALS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isochroneService = new IsochroneService();

  const handleCalculate = async () => {
    if (!point) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = await isochroneService.calculate({ point, mode, intervals });
      onIsochroneReady(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка расчёта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
      <h3 style={{ margin: '0 0 12px' }}>🔵 Зоны доступности (Изохроны)</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Режим:</label>
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value as any)}
          style={{ width: '100%', padding: '6px', borderRadius: '4px' }}
        >
          <option value="pedestrian">🚶 Пешеход</option>
          <option value="auto">🚗 Автомобиль</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Интервалы (мин):</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[5, 10, 15, 20].map(min => (
            <label key={min} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={intervals.includes(min)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setIntervals([...intervals, min].sort((a, b) => a - b));
                  } else {
                    setIntervals(intervals.filter(i => i !== min));
                  }
                }}
              />
              {min}
            </label>
          ))}
        </div>
      </div>
      
      {error && <p style={{ color: '#d32f2f', fontSize: '13px' }}>❌ {error}</p>}
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleCalculate} 
          disabled={!point || loading || intervals.length === 0}
          style={{ flex: 1, padding: '8px', background: '#0057FF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? '⏳ Расчёт...' : '🔵 Рассчитать зоны'}
        </button>
        <button 
          onClick={onClear}
          style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🗑️
        </button>
      </div>
      
      {!point && (
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
          💡 Кликните по карте, чтобы выбрать точку для анализа
        </p>
      )}
    </div>
  );
}