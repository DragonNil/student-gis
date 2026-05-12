// frontend/src/core/services/IsochroneService.ts
export interface IsochroneRequest {
  point: [number, number];
  mode: 'pedestrian' | 'auto';
  intervals: number[];
}

export interface IsochroneFeature {
  type: 'Feature';
  properties: { time_min: number; mode: string };
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
}

export interface IsochroneResponse {
  type: 'FeatureCollection';
  features: IsochroneFeature[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class IsochroneService {
  async calculate(req: IsochroneRequest): Promise<IsochroneResponse> {
    const response = await fetch(`${API_BASE}/isochrones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Ошибка расчёта изохрон`);
    }
    
    return response.json();
  }
}