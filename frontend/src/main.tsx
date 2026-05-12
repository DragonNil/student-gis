// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

if (!API_KEY) {
  console.error('❌ Не задан VITE_YANDEX_MAPS_API_KEY в .env файле');
}

function loadYandexMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Yandex Maps API'));
    document.head.appendChild(script);
  });
}

loadYandexMaps()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  })
  .catch(err => {
    document.body.innerHTML = `<div style="padding:40px;text-align:center;color:#d32f2f">⚠️ Ошибка загрузки API карт: ${err.message}</div>`;
  });