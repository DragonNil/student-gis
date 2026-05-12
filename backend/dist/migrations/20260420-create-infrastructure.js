"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
// Использовать sequelize-cli или написать вручную
async function up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await queryInterface.createTable('infrastructure_objects', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        type: {
            type: Sequelize.ENUM('university', 'dormitory', 'canteen', 'sport', 'copy_center'),
            allowNull: false,
        },
        address: { type: Sequelize.STRING(255), allowNull: false },
        working_hours: Sequelize.STRING(100),
        phone: Sequelize.STRING(50),
        capacity: Sequelize.INTEGER,
        year_built: Sequelize.INTEGER,
        faculties: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
        services: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
        price_black_white: Sequelize.FLOAT,
        price_color: Sequelize.FLOAT,
        has_self_service: Sequelize.BOOLEAN,
        accessibility_wheelchair: { type: Sequelize.BOOLEAN, defaultValue: false },
        nearest_bus_stop: Sequelize.STRING(255),
        walk_time_to_stop_min: Sequelize.INTEGER,
        geometry: {
            type: Sequelize.GEOMETRY('POINT', 4326),
            allowNull: false,
        },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    // Индексы
    await queryInterface.addIndex('infrastructure_objects', ['type']);
    await queryInterface.addIndex('infrastructure_objects', ['name']);
    await queryInterface.sequelize.query('CREATE INDEX idx_infrastructure_geometry ON infrastructure_objects USING GIST (geometry)');
}
async function down(queryInterface) {
    await queryInterface.dropTable('infrastructure_objects');
}
//# sourceMappingURL=20260420-create-infrastructure.js.map