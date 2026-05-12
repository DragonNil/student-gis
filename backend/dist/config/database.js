"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.initPostGIS = initPostGIS;
// src/config/database.ts
const sequelize_1 = require("sequelize");
require("dotenv/config");
const process_1 = __importDefault(require("process"));
exports.sequelize = new sequelize_1.Sequelize(process_1.default.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: process_1.default.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: process_1.default.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
// Инициализация PostGIS
async function initPostGIS() {
    await exports.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('✅ PostGIS extension enabled');
}
//# sourceMappingURL=database.js.map