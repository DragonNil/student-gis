"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.calculateIsochrone = exports.buildRoute = exports.getAll = void 0;
const InfrastructureObject_1 = require("../models/InfrastructureObject");
const RouteService_1 = require("../services/RouteService");
const IsochroneService_1 = require("../services/IsochroneService");
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const routeService = new RouteService_1.RouteService(process.env.YANDEX_MAPS_API_KEY);
const isochroneService = new IsochroneService_1.IsochroneService(process.env.YANDEX_MAPS_API_KEY);
// Вспомогательная функция для безопасного получения сообщения об ошибке
const getErrorMessage = (error) => {
    return error instanceof Error ? error.message : 'Неизвестная ошибка';
};
// GET /api/infrastructure
const getAll = async (req, res) => {
    try {
        const { type, bbox } = req.query;
        const where = {};
        if (type && typeof type === 'string')
            where.type = type;
        if (bbox && typeof bbox === 'string') {
            const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
            where.geometry = {
                [sequelize_1.Op.and]: [
                    database_1.sequelize.where(database_1.sequelize.fn('ST_X', database_1.sequelize.col('geometry')), { [sequelize_1.Op.gte]: minLon, [sequelize_1.Op.lte]: maxLon }),
                    database_1.sequelize.where(database_1.sequelize.fn('ST_Y', database_1.sequelize.col('geometry')), { [sequelize_1.Op.gte]: minLat, [sequelize_1.Op.lte]: maxLat }),
                ],
            };
        }
        const objects = await InfrastructureObject_1.InfrastructureObject.findAll({ where });
        res.json(objects);
    }
    catch (error) {
        // ✅ Исправлено: безопасное получение сообщения
        res.status(500).json({ error: 'Ошибка загрузки объектов', details: getErrorMessage(error) });
    }
};
exports.getAll = getAll;
// POST /api/routes
const buildRoute = async (req, res) => {
    try {
        const { from, to, mode = 'pedestrian' } = req.body;
        if (!from || !to)
            return res.status(400).json({ error: 'Требуется from и to координаты' });
        const result = await routeService.buildRoute({ from, to, mode });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Ошибка построения маршрута', details: getErrorMessage(error) });
    }
};
exports.buildRoute = buildRoute;
// POST /api/isochrones
const calculateIsochrone = async (req, res) => {
    try {
        const { point, mode = 'pedestrian', intervals = [5, 10, 15] } = req.body;
        if (!point)
            return res.status(400).json({ error: 'Требуется точка point' });
        const result = await isochroneService.calculateIsochrone({ point, mode, intervals });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Ошибка расчёта изохрон', details: getErrorMessage(error) });
    }
};
exports.calculateIsochrone = calculateIsochrone;
// POST /api/infrastructure
const create = async (req, res) => {
    try {
        const object = await InfrastructureObject_1.InfrastructureObject.create(req.body);
        res.status(201).json(object);
    }
    catch (error) {
        res.status(400).json({ error: 'Ошибка создания объекта', details: getErrorMessage(error) });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ Явно приводим id к string, так как findByPk не принимает string[]
        const objectId = Array.isArray(id) ? id[0] : id;
        if (!objectId)
            return res.status(400).json({ error: 'Требуется ID объекта' });
        const [updatedCount] = await InfrastructureObject_1.InfrastructureObject.update(req.body, {
            where: { id: objectId },
        });
        if (!updatedCount)
            return res.status(404).json({ error: 'Объект не найден' });
        // ✅ Передаём явно number или string
        const updatedObject = await InfrastructureObject_1.InfrastructureObject.findByPk(Number(objectId) || objectId);
        res.json(updatedObject);
    }
    catch (error) {
        res.status(400).json({ error: 'Ошибка обновления объекта', details: getErrorMessage(error) });
    }
};
exports.update = update;
// ✅ Добавлен delete
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await InfrastructureObject_1.InfrastructureObject.destroy({ where: { id } });
        if (!deleted)
            return res.status(404).json({ error: 'Объект не найден' });
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: 'Ошибка удаления объекта', details: getErrorMessage(error) });
    }
};
exports.remove = remove;
//# sourceMappingURL=infrastructure.controller.js.map