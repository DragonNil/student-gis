// src/services/RouteService.ts
import axios from 'axios';
import 'dotenv/config';

export type RoutingMode = 'pedestrian' | 'auto' | 'public_transport';

export interface RouteRequest {
  from: [number, number]; // [lat, lon]
  to: [number, number];
  mode: RoutingMode;
  avoid_fees?: boolean;
  avoid_tolls?: boolean;
}

export interface RouteResponse {
  id: string;
  time: string;
  distance: string;
  time_seconds: number;
  distance_meters: number;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  steps: Array<{ instruction: string; distance: string; time: string }>;
  share_link: string;
}

export class RouteService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://router.api.yandex.net/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async buildRoute(req: RouteRequest): Promise<RouteResponse> {
    const { from, to, mode } = req;
    
    // Конвертация [lat, lon] → [lon, lat] для API Яндекса
    const yandexFrom = [from[1], from[0]].join(',');
    const yandexTo = [to[1], to[0]].join(',');
    
    const yandexMode: Record<RoutingMode, string> = {
      pedestrian: 'pedestrian',
      auto: 'auto',
      public_transport: 'pt',
    };

    const response = await axios.get(`${this.baseUrl}/route`, {
      params: {
        apikey: this.apiKey,
        rtext: `${yandexFrom}~${yandexTo}`,
        mode: yandexMode[mode],
        format: 'json',
      },
    });

    const route = response.data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Route;
    if (!route) throw new Error('Маршрут не найден');

    const path = route.Path;
    const segments = path.segment || [];
    
    // Сбор шагов маршрута
    const steps = segments.map((seg: any) => ({
      instruction: seg.text || '',
      distance: seg.distance?.value ? `${seg.distance.value} м` : '',
      time: seg.time?.value ? `${Math.round(seg.time.value / 60)} мин` : '',
    }));

    // Генерация ссылки для Яндекс.Карт
    const shareLink = `https://yandex.ru/maps/?rtext=${yandexFrom}~${yandexTo}&rtt=${yandexMode[mode]}`;

    return {
      id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      time: path.time?.text || '—',
      distance: path.distance?.text || '—',
      time_seconds: path.time?.value || 0,
      distance_meters: path.distance?.value || 0,
      geometry: {
        type: 'LineString',
        coordinates: path.point?.map((p: any) => [p[0], p[1]]) || [],
      },
      steps,
      share_link: shareLink,
    };
  }
}