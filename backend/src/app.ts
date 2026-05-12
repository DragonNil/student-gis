// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { sequelize, initPostGIS } from './config/database';
import { InfrastructureObject } from './models/InfrastructureObject';
import * as infrastructureCtrl from './controllers/infrastructure.controller';

const app = express();
const PORT = process.env.PORT || 4000;


// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/api/infrastructure', infrastructureCtrl.getAll);
app.post('/api/infrastructure', infrastructureCtrl.create);
app.put('/api/infrastructure/:id', infrastructureCtrl.update);
app.delete('/api/infrastructure/:id', infrastructureCtrl.remove); // ✅ Исправлено: remove вместо delete
app.post('/api/routes', infrastructureCtrl.buildRoute);
app.post('/api/isochrones', infrastructureCtrl.calculateIsochrone);

// 404 handler
app.use(/.*/, (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await initPostGIS();
    
    // ✅ Синхронизация моделей (вместо миграций для демо)
    // В продакшене использовать настоящие миграции
    await InfrastructureObject.sync({ 
      alter: process.env.NODE_ENV === 'development' 
    });
    console.log('✅ Models synced');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();