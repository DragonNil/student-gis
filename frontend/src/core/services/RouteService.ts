// frontend/src/core/services/RouteService.ts

export type RoutingMode = 'pedestrian' | 'auto' | 'public_transport';

export interface RouteRequest {
  from: [number, number]; // [lat, lon]
  to: [number, number];
  mode: RoutingMode;
}

export interface RouteOption {
  id: string;
  time: string;
  distance: string;
  time_seconds: number;
  distance_meters: number;
  geometry: { type: 'LineString'; coordinates: [number, number][] }; // [lon, lat]
  steps: Array<{ instruction: string; distance: string; time: string }>;
  share_link: string;
  label: string; // "Быстрый", "Альтернативный", "Минимум пересадок" и т.д.
}

export interface RouteResponse {
  options: RouteOption[];
  selected_index: number;
}

export class RouteService {
  private mapMode(mode: RoutingMode): string {
    // Yandex Maps JS API routingMode значения:
    const mapping: Record<RoutingMode, string> = {
      pedestrian: 'pedestrian',
      auto: 'auto',
      public_transport: 'masstransit', // или 'pt' в старых версиях
    };
    return mapping[mode];
  }

  private formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    if (seconds < 60) return `${Math.round(seconds)} сек`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  }

  private formatDistance(meters: number): string {
    if (!meters || meters <= 0) return '—';
    if (meters < 1000) return `${Math.round(meters)} м`;
    const km = meters / 1000;
    return `${km.toFixed(1).replace(/\.0$/, '')} км`;
  }

  /** Надёжно убирает &#160;, &nbsp; и другие спецсимволы */
  private cleanText(text: string): string {
    if (!text) return '—';
    return text
      .replace(/&#160;|&nbsp;|\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getLabel(mode: RoutingMode, index: number): string {
    const labels: Record<RoutingMode, string[]> = {
      pedestrian: ['Пешком', 'Альтернативный', 'Длинный'],
      auto: ['Быстрый', 'Короткий', 'Без платных'],
      public_transport: ['Быстрый', 'С пересадками', 'Минимум пересадок'],
    };
    return labels[mode][index] || `Вариант ${index + 1}`;
  }

  async buildRoute(req: RouteRequest): Promise<RouteResponse> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (!window.ymaps) return reject(new Error('Yandex Maps API не загружен'));

      // @ts-ignore
      const ymaps = window.ymaps;
      const rtt = this.mapMode(req.mode);

      ymaps.route(
        [
          [req.from[0], req.from[1]], // [lat, lon]
          [req.to[0], req.to[1]],
        ],
        {
          routingMode: rtt,
          results: 3, // 👇 Запрашиваем до 3 вариантов
        }
      )
        .then((route: any) => {
          const routes = route.getRoutes?.() || [route];
          if (!routes.length) return reject(new Error('Маршруты не найдены'));

          const options: RouteOption[] = routes.map((r: any, idx: number) => {
            const path = r.getPaths?.()?.get(0);
            if (!path) return null;

            const coords: [number, number][] = [];
            for (let i = 0; i < path.geometry.getLength(); i++) {
              const [lat, lon] = path.geometry.get(i);
              coords.push([lon, lat]); // GeoJSON требует [lon, lat]
            }

            const timeSec = r.getJamsTime?.() || r.getTime?.() || 0;
            const distM = r.getLength?.() || 0;

            return {
              id: `route_${Date.now()}_${req.mode}_${idx}`,
              time: this.formatTime(timeSec),
              distance: this.formatDistance(distM),
              time_seconds: timeSec,
              distance_meters: distM,
              geometry: { type: 'LineString' as const, coordinates: coords },
              steps: [],
              share_link: `https://yandex.ru/maps/?rtext=${req.from[0]},${req.from[1]}~${req.to[0]},${req.to[1]}&rtt=${rtt}`,
              label: this.getLabel(req.mode, idx),
            };
          }).filter(Boolean);

          if (!options.length) return reject(new Error('Не удалось получить варианты'));
          resolve({ options, selected_index: 0 });
        })
        .catch((err: any) => reject(new Error(err.message || 'Ошибка построения маршрута')));
    });
  }
}