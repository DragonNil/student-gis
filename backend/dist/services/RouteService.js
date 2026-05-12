"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteService = void 0;
// src/services/RouteService.ts
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
class RouteService {
    constructor(apiKey) {
        this.baseUrl = 'https://router.api.yandex.net/v1';
        this.apiKey = apiKey;
    }
    async buildRoute(req) {
        const { from, to, mode } = req;
        // Конвертация [lat, lon] → [lon, lat] для API Яндекса
        const yandexFrom = [from[1], from[0]].join(',');
        const yandexTo = [to[1], to[0]].join(',');
        const yandexMode = {
            pedestrian: 'pedestrian',
            auto: 'auto',
            public_transport: 'pt',
        };
        const response = await axios_1.default.get(`${this.baseUrl}/route`, {
            params: {
                apikey: this.apiKey,
                rtext: `${yandexFrom}~${yandexTo}`,
                mode: yandexMode[mode],
                format: 'json',
            },
        });
        const route = response.data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Route;
        if (!route)
            throw new Error('Маршрут не найден');
        const path = route.Path;
        const segments = path.segment || [];
        // Сбор шагов маршрута
        const steps = segments.map((seg) => ({
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
                coordinates: path.point?.map((p) => [p[0], p[1]]) || [],
            },
            steps,
            share_link: shareLink,
        };
    }
}
exports.RouteService = RouteService;
//# sourceMappingURL=RouteService.js.map