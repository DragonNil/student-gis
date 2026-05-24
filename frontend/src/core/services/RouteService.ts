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

  // Безопасная конвертация секунд в читаемый вид
  private formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    if (seconds < 60) return `${Math.round(seconds)} сек`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  }

  // Безопасная конвертация метров в читаемый вид
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

      console.log(`🗺️ Запрос маршрута [${req.mode}]:`, { from: req.from, to: req.to });

      ymaps.route(
        [req.from, req.to], 
        { routingMode: rtt, results: 3, avoidFees: false, avoidTolls: false }
      )
        .then((route: any) => {
          console.log('✅ Ответ получен от Яндекс');
          const routes = route.getRoutes?.() || [route];
          if (!routes || routes.length === 0) return reject(new Error('Маршруты не найдены.'));

          const options: RouteOption[] = [];

          routes.forEach((r: any, idx: number) => {
            try {
              const path = r.getPaths?.()?.get(0);
              if (!path) return;

              // 1. Геометрия
              const coords: [number, number][] = [];
              const geoLen = path.geometry.getLength();
              for (let i = 0; i < geoLen; i++) {
                const [lat, lon] = path.geometry.get(i);
                coords.push([lon, lat]);
              }

              // 2. Время и Расстояние (используем нативные методы API, они точные!)
              // Для авто берем время с учетом пробок, если есть, иначе обычное
              let timeSec = r.getTime?.() || 0;
              if (req.mode === 'auto') {
                 timeSec = r.getJamsTime?.() || timeSec;
              }
              const distMeters = r.getLength?.() || 0;

              // 3. Данные для ОТ (безопасный парсинг, без .getLength() на сегментах)
              let transfers = 0;
              let transport_info = '';
              let departure_stop = '';

              if (req.mode === 'public_transport') {
                const paths = r.getPaths?.();
                if (paths && paths.getLength) {
                   // Количество пересадок = количество путей - 1
                   transfers = Math.max(0, paths.getLength() - 1);
                   
                   // Пытаемся найти инфо о транспорте (безопасно)
                   try {
                      const firstPath = paths.get(0);
                      const segments = firstPath.getSegments?.();
                      if (segments) {
                         // segments может быть коллекцией или массивом
                         const segCount = segments.getLength ? segments.getLength() : segments.length;
                         for(let i=0; i<segCount; i++) {
                            const seg = segments.get ? segments.get(i) : segments[i];
                            const meta = seg.getMetadata?.();
                            if (meta && meta.type === 'transit') {
                               transport_info = meta.transport?.name || 'Общественный транспорт';
                               departure_stop = meta.departureStop || 'Остановка';
                               break; 
                            }
                         }
                      }
                   } catch (e) {
                      // Если Яндекс не отдал детали - не страшно, просто оставляем пусто
                      console.log('ℹ️ Детали ОТ недоступны в бесплатной версии');
                   }
                }
              }

              options.push({
                id: `route_${Date.now()}_${req.mode}_${idx}`,
                time: this.formatTime(timeSec),
                distance: this.formatDistance(distMeters),
                time_seconds: timeSec,
                distance_meters: distMeters,
                geometry: { type: 'LineString' as const, coordinates: coords },
                steps: [],
                share_link: `https://yandex.ru/maps/?rtext=${req.from[0]},${req.from[1]}~${req.to[0]},${req.to[1]}&rtt=${rtt}`,
                label: this.getLabel(req.mode, idx),
                transfers,
                transport_info: transport_info || undefined,
                departure_stop: departure_stop || undefined,
                api_limitation: req.mode === 'public_transport',
              });

            } catch (err) {
              console.error(`❌ Ошибка при обработке варианта ${idx}:`, err);
            }
          });

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