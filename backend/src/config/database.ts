// backend/src/config/database.ts
import { Sequelize } from 'sequelize';
import 'dotenv/config';

// Безопасное получение переменных
const DATABASE_URL = process.env.DATABASE_URL;
const DB_HOST = process.env.DB_HOST || 'postgres';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_NAME = process.env.DB_NAME || 'student_gis_db';
const DB_USER = process.env.DB_USER || 'user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Формируем строку подключения
const connectionString = DATABASE_URL || 
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Маскируем пароль в логах
const maskedUrl = connectionString.replace(/:[^:@]+@/, ':***@');
console.log(`[DB] Connecting to: ${maskedUrl} (env: ${NODE_ENV})`);

export const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  
  // 🔧 Ключевое исправление: отключаем SSL для локальной разработки
  dialectOptions: NODE_ENV === 'production' && process.env.DB_SSL === 'true' 
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {
        // Явно отключаем SSL для локального PostgreSQL
        ssl: false,
      },
  
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function initPostGIS() {
  try {
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('✅ PostGIS extension enabled');
  } catch (error) {
    console.warn('⚠️ PostGIS may already be enabled:', error);
  }
}