// frontend/src/core/services/DataRepository.ts
import { TInfrastructureFeature, TInfrastructureFeatureCollection } from '@/types/infrastructure';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class DataRepository {
  private features: TInfrastructureFeature[] = [];
  private filterCache: Map<string, TInfrastructureFeature[]> = new Map();
  private lastFetch: number | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут

  async loadFromAPI(): Promise<void> {
    // Проверка кэша
    if (this.features.length > 0 && this.lastFetch && Date.now() - this.lastFetch < this.CACHE_TTL) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/infrastructure`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const data: TInfrastructureFeature[] = await response.json();
      this.features = data;
      this.lastFetch = Date.now();
      this.filterCache.clear();
    } catch (error) {
      console.error('❌ DataRepository: Ошибка загрузки с API', error);
      throw error;
    }
  }

  async loadFromGeoJSON(url: string): Promise<void> {
    // Фолбэк на локальный GeoJSON если API недоступен
    if (this.features.length > 0) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const collection: TInfrastructureFeatureCollection = await response.json();
      this.features = collection.features;
    } catch (error) {
      console.warn('⚠️ GeoJSON не загружен, пробуем API...', error);
      await this.loadFromAPI();
    }
  }

  getAll(): TInfrastructureFeature[] {
    return this.features;
  }

  getByType(type: string): TInfrastructureFeature[] {
    const cached = this.filterCache.get(type);
    if (cached) return cached;
    
    const filtered = this.features.filter(f => f.properties.type === type);
    this.filterCache.set(type, filtered);
    return filtered;
  }

  getFeaturesByTypes(types: string[]): TInfrastructureFeature[] {
    if (types.length === 0) return this.features;
    return this.features.filter(f => types.includes(f.properties.type));
  }
}

export const dataRepository = new DataRepository();