// frontend/src/core/config.ts

export const MAP_CONFIG = {
  center: [47.208872, 38.936579] as [number, number],
  zoom: 13,
  controls: ['zoomControl', 'fullscreenControl', 'searchControl'],
};

// 🔑 Ключи (dormitory, university...) должны ТОЧНО совпадать с полем type в базе данных
export const LAYER_STYLES: Record<string, { icon: string; label: string; emoji: string }> = {
  university: {
    icon: 'islands#blueCircleIcon', // 🔵 Синий
    label: 'Вузы',
    emoji: '🎓',
  },
  dormitory: {
    icon: 'islands#redCircleIcon',  // 🔴 Красный
    label: 'Общежития',
    emoji: '🏠',
  },
  canteen: {
    icon: 'islands#orangeCircleIcon', // 🟠 Оранжевый
    label: 'Столовые',
    emoji: '🍽️',
  },
  sport: {
    icon: 'islands#greenCircleIcon', // 🟢 Зелёный
    label: 'Спорт',
    emoji: '⚽',
  },
  copy_center: {
    icon: 'islands#grayCircleIcon',  // ⚪ Серый
    label: 'Копицентры',
    emoji: '🖨️',
  },
};

export const LAYER_PRESETS: Record<string, string> = Object.fromEntries(
  Object.entries(LAYER_STYLES).map(([key, value]) => [key, value.icon])
);

export const getLayerStyle = (type: string) => {
  return LAYER_STYLES[type] || LAYER_STYLES.copy_center;
};

export const getLayerIcon = (type: string) => getLayerStyle(type).icon;
export const getLayerLabel = (type: string) => getLayerStyle(type).label;
export const getLayerEmoji = (type: string) => getLayerStyle(type).emoji;

if (typeof window !== 'undefined') {
  (window as any).LAYER_STYLES = LAYER_STYLES;
  (window as any).LAYER_PRESETS = LAYER_PRESETS;
}