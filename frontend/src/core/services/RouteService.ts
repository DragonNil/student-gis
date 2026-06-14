// frontend/src/core/services/RouteService.ts

export type RoutingMode = 'pedestrian' | 'auto' | 'transit';

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
  api_limitation?: boolean;
}

export interface RouteResponse {
  options: RouteOption[];
  selected_index: number;
  segments: any[];
}

export class RouteService {
  private readonly apiKey: string;


  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined'
        ? import.meta.env.VITE_YANDEX_MAPS_API_KEY
        : '') ||
      '';
  }

  private mapMode(mode: RoutingMode): string {
    return mode;
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
      transit: ['Быстрый', 'С пересадками', 'Минимум пересадок'],
    };

    return labels[mode][index] || `Вариант ${index + 1}`;
  }

  async buildRoute(req: RouteRequest): Promise<RouteResponse> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (!window.ymaps) {
        return reject(new Error('Yandex Maps API не загружен'));
      }

      // @ts-ignore
      const ymaps = window.ymaps;

      const routingMode = this.mapMode(req.mode);

      console.log('🗺️ MultiRoute request:', req);

      ymaps.route(
        [req.from, req.to],
        {
          multiRoute: true,
          routingMode,
          results: 3,
          avoidTrafficJams: req.mode === 'auto',
        }
      )
      .then((multiRoute: any) => {
        const routes = multiRoute.getRoutes?.();

        if (!routes || !routes.getLength?.()) {
          return reject(new Error('Маршруты не найдены'));
        }

        const options: RouteOption[] = [];

  const segmentsData: any[] = [];
  routes.each((route: any, idx: number) => {
  try {
    const active = route.getActiveRoute?.() || route;

    // ----------------------------
    // TIME / DISTANCE (FIXED)
    // ----------------------------
    const durationObj =
      active.properties?.get?.("duration");

    const distanceObj =
      active.properties?.get?.("distance");

    const timeSec =
      Number(durationObj?.value ?? durationObj ?? 0);

    const distMeters =
      Number(distanceObj?.value ?? distanceObj ?? 0);

    // ----------------------------
    // PATHS
    // ----------------------------
    const paths = active.getPaths?.();

    const coords: [number, number][] = [];

    if (paths?.each) {
      paths.each((path: any) => {
        const segments = path.getSegments?.();

        if (!segments?.each) return;

        segments.each((seg: any) => {
          // ----------------------------
          // SAFE GEOMETRY ACCESS
          // ----------------------------
          const geom = seg?.geometry;

          if (!geom?.getLength) return;

          const len = geom.getLength();

          for (let i = 0; i < len; i++) {
            const point = geom.get(i);

            if (!point) continue;

            const lat = point?.[0];
            const lon = point?.[1];

            if (
              typeof lat !== "number" ||
              typeof lon !== "number"
            ) continue;

            coords.push([lon, lat]);
          }
        });
      });
    }

    // ----------------------------
    // FALLBACK (if no geometry)
    // ----------------------------
    if (coords.length === 0) {
      const line = active.properties?.get?.("line");

      if (Array.isArray(line)) {
        line.forEach((p: any) => {
          if (Array.isArray(p)) {
            coords.push([p[1], p[0]]);
          }
        });
      }
    }

    // ----------------------------
    // TRANSFERS (SAFE)
    // ----------------------------
    let transfers = 0;

    if (req.mode === "transit") {
      const paths = active.getPaths?.();

      paths?.each?.((path: any) => {
        const segments = path.getSegments?.();

        segments?.each?.((seg: any) => {
          const type = seg?.properties?.get?.("type");

          if (type === "transfer") {
            transfers++;
          }
        });
      });
    }

    // ----------------------------
    // FINAL PUSH
    // ----------------------------
    options.push({
      id: `route_${Date.now()}_${idx}`,
      time: this.formatTime(timeSec),
      distance: this.formatDistance(distMeters),
      time_seconds: timeSec,
      distance_meters: distMeters,
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
      steps: [],
      share_link: "",
      label: this.getLabel(req.mode, idx),
      transfers,
      api_limitation: false,
    });

  } catch (e) {
    console.error("Route parse error:", e);
  }
});

        if (!options.length) {
          return reject(
            new Error('Не удалось распарсить маршруты')
          );
        }

        resolve({
          options,
          selected_index: 0,
        });
      })
      .catch((err: any) => {
        console.error('Yandex route error:', err);
        reject(err);
      });
    });
  }
}