// frontend/src/core/services/RouteService.ts
export type RoutingMode = 'pedestrian' | 'auto' | 'public_transport';

export interface RouteRequest {
  from: [number, number]; // [lat, lon] для Яндекс.Карт
  to: [number, number];
  mode: RoutingMode;
}

export interface RouteResponse {
  id: string;
  time: string;
  distance: string;
  time_seconds: number;
  distance_meters: number;
  geometry: { type: 'LineString'; coordinates: [number, number][] }; // [lon, lat] для GeoJSON
  steps: Array<{ instruction: string; distance: string; time: string }>;
  share_link: string;
}

export class RouteService {
  /** Построение маршрута через ymaps.route() на клиенте */
  async buildRoute(req: RouteRequest): Promise<RouteResponse> {
    return new Promise((resolve, reject) => {
      if (!window.ymaps) {
        return reject(new Error('Yandex Maps API не загружен'));
      }

      // Конвертация: [lat, lon] (наш формат) → [lat, lon] (Яндекс)
      // В нашем коде from/to уже в формате [lat, lon] для Яндекс
      const [fromLat, fromLon] = req.from;
      const [toLat, toLon] = req.to;

      // Маппинг режима маршрутизации
      const yandexMode: Record<RoutingMode, string> = {
        pedestrian: 'pedestrian',
        auto: 'auto',
        public_transport: 'pt',
      };

      ymaps.route(
        [
          [fromLat, fromLon],
          [toLat, toLon],
        ],
        {
          routingMode: yandexMode[req.mode],
          results: 1,
        }
      )
        .then((route: any) => {
          const activeRoute = route.getActiveRoute?.() || route;
          if (!activeRoute) {
            return reject(new Error('Маршрут не найден'));
          }

          // Извлечение геометрии маршрута (координаты в формате [lat, lon])
          const path = activeRoute.getPaths?.()?.get(0);
          if (!path) {
            return reject(new Error('Не удалось получить геометрию маршрута'));
          }

          const coords: [number, number][] = [];
          for (let i = 0; i < path.geometry.getLength(); i++) {
            const [lat, lon] = path.geometry.get(i);
            coords.push([lon, lat]); // Конвертируем в [lon, lat] для GeoJSON
          }

          // Генерация ссылки для Яндекс.Карт
          const shareLink = `https://yandex.ru/maps/?rtext=${fromLat},${fromLon}~${toLat},${toLon}&rtt=${yandexMode[req.mode]}`;

          resolve({
            id: `route_${Date.now()}`,
            time: activeRoute.getHumanTime?.() || '—',
            distance: activeRoute.getHumanLength?.() || '—',
            time_seconds: activeRoute.getJamsTime?.() || activeRoute.getTime?.() || 0,
            distance_meters: activeRoute.getLength?.() || 0,
            geometry: {
              type: 'LineString' as const,
              coordinates: coords,
            },
            steps: [], // Можно распарсить при необходимости
            share_link: shareLink,
          });
        })
        .catch((err: any) => {
          console.error('Yandex route error:', err);
          reject(new Error(err.message || 'Ошибка построения маршрута'));
        });
    });
  }
}