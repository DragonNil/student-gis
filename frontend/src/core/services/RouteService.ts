// frontend/src/core/services/RouteService.ts

export type RoutingMode = 'pedestrian' | 'auto' | 'public_transport';

export interface RouteRequest {
  from: [number, number];
  to: [number, number];
  mode: RoutingMode;
}

export interface RouteOption {
  id: string;
  time: string;
  distance: string;
  time_seconds: number;
  distance_meters: number;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  steps: Array<{ instruction: string; distance: string; time: string }>;
  share_link: string;
  label: string;
  transfers: number;
  transport_info?: string;
  departure_stop?: string;
  api_limitation?: boolean; // 👈 Флаг для UI
}

export interface RouteResponse {
  options: RouteOption[];
  selected_index: number;
}

export class RouteService {
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof import.meta !== 'undefined' ? import.meta.env.VITE_YANDEX_MAPS_API_KEY : '') || '';
  }

  private mapMode(mode: RoutingMode): string {
    const mapping: Record<RoutingMode, string> = {
      pedestrian: 'pedestrian',
      auto: 'auto',
      public_transport: 'masstransit',
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

      console.log('🗺️ Building route:', { from: req.from, to: req.to, mode: req.mode, rtt });

      ymaps.route(
        [req.from, req.to],
        { routingMode: rtt, results: 3, avoidFees: false, avoidTolls: false }
      )
        .then((route: any) => {
          console.log('✅ Route response received');
          
          // 📊 Отладка: посмотрите, что реально отдает Яндекс в консоли
          console.log('🔍 Raw route metadata:', route.getMetadata?.());
          
          const routes = route.getRoutes?.() || [route];
          if (!routes || routes.length === 0) return reject(new Error('Маршруты не найдены.'));

          const options: RouteOption[] = routes.map((r: any, idx: number) => {
            try {
              const path = r.getPaths?.()?.get(0);
              if (!path) return null;

              const coords: [number, number][] = [];
              for (let i = 0; i < path.geometry.getLength(); i++) {
                const [lat, lon] = path.geometry.get(i);
                coords.push([lon, lat]);
              }

              const timeSec = r.getJamsTime?.() || r.getTime?.() || 0;
              const distM = r.getLength?.() || 0;

              let transfers = 0;
              let transport_info = '';
              let departure_stop = '';

              if (req.mode === 'public_transport') {
                // В бесплатном API v2.1 детали ОТ не экспонируются
                // Но мы можем рассчитать количество пересадок по сегментам
                const paths = r.getPaths?.();
                if (paths?.getLength) {
                  const segmentsCount = paths.getLength();
                  transfers = Math.max(0, segmentsCount - 1);
                }
              }

              return {
                id: `route_${Date.now()}_${req.mode}_${idx}`,
                time: this.formatTime(timeSec),
                distance: this.formatDistance(distM),
                time_seconds: timeSec,
                distance_meters: distM,
                geometry: { type: 'LineString' as const, coordinates: coords },
                steps: [],
                share_link: `https://yandex.ru/maps/?rtext=${req.from[0]},${req.from[1]}~${req.to[0]},${req.to[1]}&rtt=mt`,
                label: this.getLabel(req.mode, idx),
                transfers,
                transport_info: transport_info || undefined,
                departure_stop: departure_stop || undefined,
                api_limitation: true, // 👈 Включаем профессиональный фолбэк
              };
            } catch (err) {
              console.error('❌ Error parsing route option:', err);
              return null;
            }
          }).filter((opt: RouteOption | null): opt is RouteOption => opt !== null);

          if (options.length === 0) return reject(new Error('Не удалось обработать варианты маршрута'));
          resolve({ options, selected_index: 0 });
        })
        .catch((err: any) => {
          console.error('❌ Yandex route error:', err);
          reject(new Error(err.message || 'Не удалось построить маршрут'));
        });
    });
  }
}