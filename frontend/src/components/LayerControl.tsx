// frontend/src/components/LayerControl.tsx
import { LAYER_STYLES } from '@/core/config';

interface LayerControlProps {
  activeLayers: string[];
  onToggle: (type: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export default function LayerControl({ activeLayers, onToggle, onToggleAll }: LayerControlProps) {
  const allTypes = Object.keys(LAYER_STYLES);
  const allActive = activeLayers.length === allTypes.length;

  // 👇 Маппинг пресетов на цвета для легенды (визуально, не для API)
  const PRESET_COLORS: Record<string, string> = {
    'islands#blueCircleIcon': '#0057FF',
    'islands#redCircleIcon': '#ef4444',
    'islands#orangeCircleIcon': '#f59e0b',
    'islands#greenCircleIcon': '#22c55e',
    'islands#grayCircleIcon': '#64748b',
  };

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>📑 Слои</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allActive}
            onChange={(e) => onToggleAll(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: '#0057FF' }}
          />
          Все
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {allTypes.map((type) => {
          const style = LAYER_STYLES[type];
          const isActive = activeLayers.includes(type);
          const color = PRESET_COLORS[style.icon] || '#64748b'; // Цвет для легенды

          return (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: isActive ? '#f0f7ff' : '#f8fafc',
                border: `1px solid ${isActive ? color : '#e2e8f0'}`,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggle(type)}
                style={{ cursor: 'pointer', accentColor: color }}
              />
              
              {/* 👇 Цветной квадратик в легенде (визуальный, не влияет на карту) */}
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: color + '33', // полупрозрачный
                border: `2px solid ${color}`,
                display: 'inline-block',
                flexShrink: 0,
              }} />
              
              <span style={{ fontSize: '14px' }}>{style.emoji}</span>
              <span style={{ fontSize: '13px', color: '#334155', flex: 1 }}>{style.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}