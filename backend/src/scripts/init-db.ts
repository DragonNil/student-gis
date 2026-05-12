// backend/src/scripts/init-db.ts
import { sequelize } from '../config/database';
import { initPostGIS } from '../config/database';
import { InfrastructureObject } from '../models/InfrastructureObject';

async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await initPostGIS();
    
    // Синхронизация всех моделей
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ All models synced');
    
    // Здесь можно добавить сидирование тестовыми данными
    // await seedTestData();
    
    console.log('🎉 Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDB();