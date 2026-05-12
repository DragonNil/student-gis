"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureObject = void 0;
// src/models/InfrastructureObject.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class InfrastructureObject extends sequelize_1.Model {
}
exports.InfrastructureObject = InfrastructureObject;
InfrastructureObject.init({
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    type: {
        type: sequelize_1.DataTypes.ENUM('university', 'dormitory', 'canteen', 'sport', 'copy_center'),
        allowNull: false,
        // ✅ Убрано: index: true — перенесено в indexes ниже
    },
    address: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    working_hours: sequelize_1.DataTypes.STRING(100),
    phone: sequelize_1.DataTypes.STRING(50),
    capacity: sequelize_1.DataTypes.INTEGER,
    year_built: sequelize_1.DataTypes.INTEGER,
    faculties: { type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING), defaultValue: [] },
    services: { type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING), defaultValue: [] },
    price_black_white: sequelize_1.DataTypes.FLOAT,
    price_color: sequelize_1.DataTypes.FLOAT,
    has_self_service: sequelize_1.DataTypes.BOOLEAN,
    accessibility_wheelchair: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    nearest_bus_stop: sequelize_1.DataTypes.STRING(255),
    walk_time_to_stop_min: sequelize_1.DataTypes.INTEGER,
    geometry: {
        type: sequelize_1.DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
    },
    created_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updated_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: database_1.sequelize,
    tableName: 'infrastructure_objects',
    timestamps: false,
    // ✅ Индексы вынесены в отдельный массив
    indexes: [
        { fields: ['type'] },
        { fields: ['name'] },
        {
            fields: [database_1.sequelize.fn('ST_Transform', database_1.sequelize.col('geometry'), 4326)],
            using: 'gist',
            name: 'idx_infrastructure_geometry',
        },
    ],
});
//# sourceMappingURL=InfrastructureObject.js.map