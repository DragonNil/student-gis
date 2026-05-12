// src/types.ts

// Базовый интерфейс
export interface IInfrastructureProperties {
  id: number;
  name: string;
  type: 'university' | 'dormitory' | 'canteen' | 'sport' | 'copy_center';
  address: string;
  working_hours?: string;
  phone?: string;
  last_update: string;
  coords: number[];
}

// Специфичные поля для ВУЗов
export interface IUniversityProperties extends IInfrastructureProperties {
  type: 'university';
  faculties?: string[];
}

// Специфичные поля для Общежитий
export interface IDormitoryProperties extends IInfrastructureProperties {
  type: 'dormitory';
  capacity?: number;
  yearBuilt?: number;
}

// Объединенный тип фичи GeoJSON (упрощенно для React-списка)
export type InfrastructureItem = IInfrastructureProperties;