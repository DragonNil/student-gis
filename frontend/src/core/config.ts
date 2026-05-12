// frontend/src/core/config.ts
export const MAP_CONFIG = {
  center: [47.208872, 38.936579] as [number, number], // Центр Таганрога [lat, lon]
  zoom: 13,
  controls: ['zoomControl', 'fullscreenControl', 'searchControl'],
};

export const LAYER_PRESETS: Record<string, string> = {
  university: 'islands#blueEducationIcon',    // 🎓 Вузы
  dormitory: 'islands#redHomeIcon',           // 🏠 Общежития
  canteen: 'islands#orangeFoodIcon',          // 🍽️ Столовые
  sport: 'islands#greenSportIcon',            // ⚽ Спорт
  copy_center: 'islands#grayPrintIcon',       // 🖨️ Копицентры
};

// Сделать доступным глобально (опционально, для отладки)
if (typeof window !== 'undefined') {
  (window as any).LAYER_PRESETS = LAYER_PRESETS;
}