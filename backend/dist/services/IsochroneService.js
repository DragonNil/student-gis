"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsochroneService = void 0;
require("dotenv/config");
class IsochroneService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async calculateIsochrone(req) {
        const { point, mode, intervals } = req;
        const [lon, lat] = [point[1], point[0]]; // GeoJSON order
        // Яндекс.Карты API не предоставляет изохроны напрямую,
        // поэтому используем эмуляцию через множественные маршруты по радиусу
        // В продакшене можно подключить Mapbox Isochrone API или OSRM + Turf.js
        const features = [];
        for (const minutes of intervals) {
            // Эмуляция: создаём круговой полигон радиусом ~80м/мин для пешехода
            const radius = mode === 'pedestrian' ? minutes * 80 : minutes * 300;
            const polygon = this.createCirclePolygon([lon, lat], radius, 32);
            features.push({
                type: 'Feature',
                properties: { time_min: minutes, mode },
                geometry: polygon,
            });
        }
        return {
            type: 'FeatureCollection',
            features,
        };
    }
    // Вспомогательная функция: создание кругового полигона
    createCirclePolygon(center, radiusMeters, steps) {
        const [lon, lat] = center;
        const earthRadius = 6371000;
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        const points = [];
        for (let i = 0; i <= steps; i++) {
            const bearing = (i * 2 * Math.PI) / steps;
            const newLat = Math.asin(Math.sin(latRad) * Math.cos(radiusMeters / earthRadius) +
                Math.cos(latRad) * Math.sin(radiusMeters / earthRadius) * Math.cos(bearing));
            const newLon = lonRad + Math.atan2(Math.sin(bearing) * Math.sin(radiusMeters / earthRadius) * Math.cos(latRad), Math.cos(radiusMeters / earthRadius) - Math.sin(latRad) * Math.sin(newLat));
            points.push([(newLon * 180) / Math.PI, (newLat * 180) / Math.PI]);
        }
        return {
            type: 'Polygon',
            coordinates: [points],
        };
    }
}
exports.IsochroneService = IsochroneService;
//# sourceMappingURL=IsochroneService.js.map