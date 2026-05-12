// src/components/LayerControl.tsx



interface LayerControlProps {
  activeLayers: string[];
  onToggle: (type: string) => void;
}

const LAYER_LABELS: Record<string, string> = {
  university: '🎓 Вузы',
  dormitory: '🏠 Общежития',
  canteen: '🍽️ Столовые и кафе',
  sport: '⚽ Спортобъекты',
  copy_center: '🖨️ Копировальные центры',
};

export default function LayerControl({ activeLayers, onToggle }: LayerControlProps) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Слои инфраструктуры</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.entries(LAYER_LABELS).map(([type, label]) => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={activeLayers.includes(type)}
              onChange={() => onToggle(type)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}