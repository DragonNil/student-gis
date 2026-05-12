// src/types/infrastructure.ts

// Базовый интерфейс
export interface IInfrastructureProperties {
  id: number;
  name: string;
  type: 'university' | 'dormitory' | 'canteen' | 'sport' | 'copy_center';
  address: string;
  working_hours?: string;
  phone?: string;
  last_update: string;
}

// Расширения для конкретных типов
export interface IUniversityProperties extends IInfrastructureProperties {
  type: 'university';
  faculties?: string[];
}

export interface IDormitoryProperties extends IInfrastructureProperties {
  type: 'dormitory';
  capacity?: number;
  yearBuilt?: number;
}

export interface ICanteenProperties extends IInfrastructureProperties {
  type: 'canteen';
  cuisine?: string;
}

export interface ISportProperties extends IInfrastructureProperties {
  type: 'sport';
  sportType?: string;
}

export interface ICopyCenterProperties extends IInfrastructureProperties {
  type: 'copy_center';
  services?: string[];
  price_black_white?: number;
  price_color?: number;
  has_self_service?: boolean;
}

// Объединяющий тип (дисриминантное объединение)
export type TInfrastructureProperties =
  | IUniversityProperties
  | IDormitoryProperties
  | ICanteenProperties
  | ISportProperties
  | ICopyCenterProperties;

// Геометрия GeoJSON (ручное определение, чтобы не тянуть лишние зависимости)
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [долгота, широта] по стандарту GeoJSON
}

export interface TInfrastructureFeature {
  type: 'Feature';
  geometry: GeoPoint;
  properties: TInfrastructureProperties;
}

export interface TInfrastructureFeatureCollection {
  type: 'FeatureCollection';
  features: TInfrastructureFeature[];
}