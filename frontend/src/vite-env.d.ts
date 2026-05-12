/// <reference types="vite/client" />
/// <reference types="@types/yandex-maps" />

declare global {
  interface Window {
    ymaps: typeof import('yandex-maps');
  }
}

export {};