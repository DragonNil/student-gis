// src/controllers/infrastructure.controller.ts
import { Request, Response } from 'express';
import { InfrastructureObject } from '../models/InfrastructureObject';
import { RouteService } from '../services/RouteService';
import { IsochroneService } from '../services/IsochroneService';
import { Op, WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';

const routeService = new RouteService(process.env.YANDEX_MAPS_API_KEY!);
const isochroneService = new IsochroneService(process.env.YANDEX_MAPS_API_KEY!);

// Вспомогательная функция для безопасного получения сообщения об ошибке
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
};

// ✅ Исправлено: добавлен тип для где-условия
type InfrastructureWhere = WhereOptions<InfrastructureObject>;

// GET /api/infrastructure
export const getAll = async (req: Request, res: Response) => {
  try {
    const { type, bbox } = req.query;
    const where: InfrastructureWhere = {};
    
    if (type && typeof type === 'string') where.type = type;
    
    if (bbox && typeof bbox === 'string') {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      where.geometry = {
        [Op.and]: [
          sequelize.where(sequelize.fn('ST_X', sequelize.col('geometry')), { [Op.gte]: minLon, [Op.lte]: maxLon }),
          sequelize.where(sequelize.fn('ST_Y', sequelize.col('geometry')), { [Op.gte]: minLat, [Op.lte]: maxLat }),
        ],
      } as any;
    }
    
    const objects = await InfrastructureObject.findAll({ where });
    res.json(objects);
  } catch (error) {
    // ✅ Исправлено: безопасное получение сообщения
    res.status(500).json({ error: 'Ошибка загрузки объектов', details: getErrorMessage(error) });
  }
};

// POST /api/routes
export const buildRoute = async (req: Request, res: Response) => {
  try {
    const { from, to, mode = 'pedestrian' } = req.body;
    if (!from || !to) return res.status(400).json({ error: 'Требуется from и to координаты' });
    
    const result = await routeService.buildRoute({ from, to, mode });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка построения маршрута', details: getErrorMessage(error) });
  }
};

// POST /api/isochrones
export const calculateIsochrone = async (req: Request, res: Response) => {
  try {
    const { point, mode = 'pedestrian', intervals = [5, 10, 15] } = req.body;
    if (!point) return res.status(400).json({ error: 'Требуется точка point' });
    
    const result = await isochroneService.calculateIsochrone({ point, mode, intervals });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка расчёта изохрон', details: getErrorMessage(error) });
  }
};

// POST /api/infrastructure
export const create = async (req: Request, res: Response) => {
  try {
    const object = await InfrastructureObject.create(req.body);
    res.status(201).json(object);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка создания объекта', details: getErrorMessage(error) });
  }
};


export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // ✅ Явно приводим id к string, так как findByPk не принимает string[]
    const objectId = Array.isArray(id) ? id[0] : id;
    if (!objectId) return res.status(400).json({ error: 'Требуется ID объекта' });
    
    const [updatedCount] = await InfrastructureObject.update(req.body, {
      where: { id: objectId },
    });
    
    if (!updatedCount) return res.status(404).json({ error: 'Объект не найден' });
    
    // ✅ Передаём явно number или string
    const updatedObject = await InfrastructureObject.findByPk(Number(objectId) || objectId);
    
    res.json(updatedObject);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка обновления объекта', details: getErrorMessage(error) });
  }
};

// ✅ Добавлен delete
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await InfrastructureObject.destroy({ where: { id } });
    
    if (!deleted) return res.status(404).json({ error: 'Объект не найден' });
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Ошибка удаления объекта', details: getErrorMessage(error) });
  }
};