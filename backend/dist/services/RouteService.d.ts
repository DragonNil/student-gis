import 'dotenv/config';
export type RoutingMode = 'pedestrian' | 'auto' | 'public_transport';
export interface RouteRequest {
    from: [number, number];
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
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
    steps: Array<{
        instruction: string;
        distance: string;
        time: string;
    }>;
    share_link: string;
}
export declare class RouteService {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(apiKey: string);
    buildRoute(req: RouteRequest): Promise<RouteResponse>;
}
//# sourceMappingURL=RouteService.d.ts.map