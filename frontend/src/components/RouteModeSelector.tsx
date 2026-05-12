// src/components/RouteModeSelector.tsx
import { RoutingMode } from '@/core/services/RouteService';

interface Props {
  mode: RoutingMode;
  onChange: (mode: RoutingMode) => void;
}

const MODES: Array<{ value: RoutingMode; label: string; icon: string }> = [
  { value: 'pedestrian', label: '🚶 Пешком', icon: 'pedestrian' },
  { value: 'auto', label: '🚗 На авто', icon: 'auto' },
  { value: 'public_transport', label: '🚌 Транспорт', icon: 'pt' },
];

export default function RouteModeSelector({ mode, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          style={{
            flex: 1,
            padding: '8px',
            border: mode === m.value ? '2px solid #0057FF' : '1px solid #ddd',
            borderRadius: '6px',
            background: mode === m.value ? '#f0f7ff' : '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}