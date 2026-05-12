// src/core/services/GeocoderService.ts
export class GeocoderService {
  static async geocodeAddress(address: string): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      ymaps.geocode(address, { results: 1 }).then((res: any) => {
        const firstGeo = res.geoObjects?.get(0);
        if (!firstGeo) return reject(new Error('Адрес не найден'));
        
        // @ts-ignore — geometry может быть null в типах, но в API всегда есть
        const coords = firstGeo.geometry?.getCoordinates?.();
        if (!coords || !Array.isArray(coords) || coords.length < 2) {
          return reject(new Error('Некорректные координаты'));
        }
        resolve([coords[0], coords[1]] as [number, number]);
      }).catch(reject);
    });
  }

  static async reverseGeocode(coords: [number, number]): Promise<string> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ymaps.geocode(coords, { results: 1 }).then((res: any) => {
        const firstGeo = res.geoObjects?.get(0);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — getAddressLine может отсутствовать в типах
        resolve(firstGeo?.getAddressLine?.() || firstGeo?.properties?.get?.('text') || 'Неизвестный адрес');
      }).catch(() => resolve('Неизвестный адрес'));
    });
  }
}