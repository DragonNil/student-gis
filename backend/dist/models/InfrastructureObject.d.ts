import { Model, Optional } from 'sequelize';
export interface InfrastructureAttributes {
    id: number;
    name: string;
    type: 'university' | 'dormitory' | 'canteen' | 'sport' | 'copy_center';
    address: string;
    working_hours?: string;
    phone?: string;
    capacity?: number;
    year_built?: number;
    faculties?: string[];
    services?: string[];
    price_black_white?: number;
    price_color?: number;
    has_self_service?: boolean;
    accessibility_wheelchair?: boolean;
    nearest_bus_stop?: string;
    walk_time_to_stop_min?: number;
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    created_at: Date;
    updated_at: Date;
}
interface InfrastructureCreationAttributes extends Optional<InfrastructureAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export declare class InfrastructureObject extends Model<InfrastructureAttributes, InfrastructureCreationAttributes> implements InfrastructureAttributes {
    id: number;
    name: string;
    type: InfrastructureAttributes['type'];
    address: string;
    working_hours?: string;
    phone?: string;
    capacity?: number;
    year_built?: number;
    faculties?: string[];
    services?: string[];
    price_black_white?: number;
    price_color?: number;
    has_self_service?: boolean;
    accessibility_wheelchair?: boolean;
    nearest_bus_stop?: string;
    walk_time_to_stop_min?: number;
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    readonly created_at: Date;
    readonly updated_at: Date;
}
export {};
//# sourceMappingURL=InfrastructureObject.d.ts.map