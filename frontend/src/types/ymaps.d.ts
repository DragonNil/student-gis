// src/types/ymaps.d.ts
/// <reference types="@types/yandex-maps" />

// Расширяем глобальную область видимости для работы в модулях
declare global {
  interface Window {
    ymaps: YMaps;
  }
  const ymaps: YMaps;
}

// Базовый интерфейс для Yandex Maps API v2.1
// Используем any для сложных вложенных типов, чтобы избежать ошибок компиляции
// При необходимости можно уточнить типы позже
export interface YMaps {
  ready(callback: () => void): void;
  Map: new (
    container: HTMLElement | string,
    state: {
      center: [number, number];
      zoom: number;
      controls?: string[];
      type?: string;
    },
    options?: any
  ) => any;
  GeoObjectCollection: new () => any;
  Placemark: new (
    geometry: [number, number],
    properties?: any,
    options?: any
  ) => any;
  route: (points: any[], options?: any) => Promise<any>;
  geocode: (query: string | [number, number], options?: any) => Promise<any>;
  // Добавляем остальные методы по мере необходимости
  [key: string]: any;
}

export {};