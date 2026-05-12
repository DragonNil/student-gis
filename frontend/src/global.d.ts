export {};

declare global {
  const ymaps: any;
  interface Window {
    ymaps: any;
    LAYER_PRESETS?: Record<string, string>;
  }
}