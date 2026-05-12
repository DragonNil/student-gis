// src/models/InfrastructureObject.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

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
  geometry: { type: 'Point'; coordinates: [number, number] }; // GeoJSON Point [lon, lat]
  created_at: Date;
  updated_at: Date;
}

interface InfrastructureCreationAttributes extends Optional<InfrastructureAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class InfrastructureObject extends Model<InfrastructureAttributes, InfrastructureCreationAttributes> implements InfrastructureAttributes {
  public id!: number;
  public name!: string;
  public type!: InfrastructureAttributes['type'];
  public address!: string;
  public working_hours?: string;
  public phone?: string;
  public capacity?: number;
  public year_built?: number;
  public faculties?: string[];
  public services?: string[];
  public price_black_white?: number;
  public price_color?: number;
  public has_self_service?: boolean;
  public accessibility_wheelchair?: boolean;
  public nearest_bus_stop?: string;
  public walk_time_to_stop_min?: number;
  public geometry!: { type: 'Point'; coordinates: [number, number] };
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InfrastructureObject.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { 
      type: DataTypes.ENUM('university', 'dormitory', 'canteen', 'sport', 'copy_center'),
      allowNull: false,
      // ✅ Убрано: index: true — перенесено в indexes ниже
    },
    address: { type: DataTypes.STRING(255), allowNull: false },
    working_hours: DataTypes.STRING(100),
    phone: DataTypes.STRING(50),
    capacity: DataTypes.INTEGER,
    year_built: DataTypes.INTEGER,
    faculties: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    services: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    price_black_white: DataTypes.FLOAT,
    price_color: DataTypes.FLOAT,
    has_self_service: DataTypes.BOOLEAN,
    accessibility_wheelchair: { type: DataTypes.BOOLEAN, defaultValue: false },
    nearest_bus_stop: DataTypes.STRING(255),
    walk_time_to_stop_min: DataTypes.INTEGER,
    geometry: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'infrastructure_objects',
    timestamps: false,
    // ✅ Индексы вынесены в отдельный массив
    indexes: [
      { fields: ['type'] },
      { fields: ['name'] },
      { 
        fields: [sequelize.fn('ST_Transform', sequelize.col('geometry'), 4326)],
        using: 'gist',
        name: 'idx_infrastructure_geometry',
      },
    ],
  }
);