import 'dotenv/config';
export interface IsochroneRequest {
    point: [number, number];
    mode: 'pedestrian' | 'auto';
    intervals: number[];
    avoid_fees?: boolean;
}
export interface IsochroneResponse {
    type: 'FeatureCollection';
    features: Array<{
        type: 'Feature';
        properties: {
            time_min: number;
            mode: string;
        };
        geometry: {
            type: 'Polygon';
            coordinates: [number, number][][];
        };
    }>;
}
export declare class IsochroneService {
    private readonly apiKey;
    constructor(apiKey: string);
    calculateIsochrone(req: IsochroneRequest): Promise<IsochroneResponse>;
    private createCirclePolygon;
}
//# sourceMappingURL=IsochroneService.d.ts.map