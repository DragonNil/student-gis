// frontend/src/hooks/useInfrastructureData.ts
import { useState, useEffect, useCallback } from 'react';
import { TInfrastructureFeature, TInfrastructureProperties } from '@/types/infrastructure';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Моковые данные как фолбэк
const FALLBACK_DATA: TInfrastructureFeature[] = [
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [38.940612, 47.205331] },
    properties: {
      id: 1,
      name: 'Общежитие 5 ЮФУ',
      type: 'dormitory',
      address: 'ул. Чехова, 22',
      working_hours: 'Круглосуточно',
      last_update: '2026-02-01',
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [38.934843, 47.203254] },
    properties: {
      id: 2,
      name: 'Учебный корпус Г ЮФУ',
      type: 'university',
      address: 'ул. Шевченко, 2',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      last_update: '2026-03-15',
    }
  },
  // ... добавьте остальные 8 объектов при необходимости
];

// Вспомогательная функция: конвертация ответа API → GeoJSON Feature
function apiResponseToFeature(item: any): TInfrastructureFeature {
  return {
    type: 'Feature',
    geometry: {
      type: item.geometry?.type || 'Point',
      coordinates: item.geometry?.coordinates || [0, 0],
    },
    properties: {
      id: item.id,
      name: item.name,
      type: item.type, // 👈 type берётся из корня ответа!
      address: item.address,
      working_hours: item.working_hours,
      phone: item.phone,
      capacity: item.capacity,
      yearBuilt: item.year_built,
      faculties: item.faculties,
      services: item.services,
      last_update: item.last_update || item.updated_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    } as TInfrastructureProperties,
  };
}

export function useInfrastructureData() {
  const [features, setFeatures] = useState<TInfrastructureFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE}/infrastructure`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
.then((data: any[]) => {
  if (!isMounted) return;
  
  console.log('=== DEBUG: API Response ===');
  console.log('Raw data length:', data.length);
  if (data[0]) {
    console.log('First item keys:', Object.keys(data[0]));
    console.log('First item.type:', data[0].type);
    console.log('First item.properties:', (data[0] as any).properties);
    console.log('First item.geometry.coordinates:', data[0].geometry?.coordinates);
  }
  
  const converted = data.map(apiResponseToFeature);
  console.log('Converted features:', converted.length);
  if (converted[0]) {
    console.log('Converted[0].properties.type:', converted[0].properties?.type);
  }
  
  setFeatures(converted);
  setLoading(false);
})
      .catch((err) => {
        if (!isMounted) return;
        console.warn('⚠️ API недоступен, используем фолбэк-данные', err);
        setFeatures(FALLBACK_DATA);
        setError(null); // Не блокируем интерфейс, если есть фолбэк
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const filterByTypes = useCallback((types: string[]) => {
    if (types.length === 0) return features;
    return features.filter(f => {
      // Безопасная проверка: f.properties может быть undefined
      const featureType = (f as any).properties?.type;
      return types.includes(featureType);
    });
  }, [features]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/infrastructure`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const converted = data.map(apiResponseToFeature);
      setFeatures(converted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  }, []);

  return { features, loading, error, filterByTypes, refresh };
}