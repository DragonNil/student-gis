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
  api_limitation?: boolean;
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

      ymaps.route([req.from, req.to], { routingMode: rtt, results: 3, avoidFees: false, avoidTolls: false })
        .then((route: any) => {
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

              // 🔥 Нативные методы API учитывают режим маршрутизации
              const timeSeconds = r.getTime?.() || 0;
              const distMeters = r.getLength?.() || 0;
              
              // Для авто используем время с пробками, если доступно
              const accurateTime = req.mode === 'auto' ? (r.getJamsTime?.() || timeSeconds) : timeSeconds;

              let transfers = 0;
              let transport_info = '';
              let departure_stop = '';

              if (req.mode === 'public_transport') {
                const paths = r.getPaths?.();
                if (paths?.getLength) {
                  transfers = Math.max(0, paths.getLength() - 1);
                  const segments = paths.get(0).getSegments?.();
                  if (segments) {
                    for (let i = 0; i < segments.getLength(); i++) {
                      const seg = segments.get(i);
                      const meta = seg.getMetadata?.() || {};
                      if (meta.type === 'transit') {
                        const t = meta.transport || {};
                        transport_info = t.name || t.type || 'Общественный транспорт';
                        departure_stop = meta.departureStop || meta.departure?.name || 'Остановка не определена';
                        break;
                      }
                    }
                  }
                }
              }

              return {
                id: `route_${Date.now()}_${req.mode}_${idx}`,
                time: r.getHumanTime?.() || `${Math.round(accurateTime / 60)} мин`,
                distance: r.getHumanLength?.() || this.formatDistance(distMeters),
                time_seconds: accurateTime,
                distance_meters: distMeters,
                geometry: { type: 'LineString' as const, coordinates: coords },
                steps: [],
                share_link: `https://yandex.ru/maps/?rtext=${req.from[0]},${req.from[1]}~${req.to[0]},${req.to[1]}&rtt=${rtt}`,
                label: this.getLabel(req.mode, idx),
                transfers,
                transport_info: transport_info || undefined,
                departure_stop: departure_stop || undefined,
                api_limitation: req.mode === 'public_transport',
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