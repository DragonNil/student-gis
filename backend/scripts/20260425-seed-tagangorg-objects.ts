// backend/src/seeders/20260425-seed-tagangorg-objects.ts
import { InfrastructureObject } from '../models/InfrastructureObject';

export async function up() {
  // Ваши данные: [широта, долгота] → конвертируем в GeoJSON [долгота, широта]
  const objects = [
    {
      name: 'Общежитие 5 ЮФУ',
      type: 'dormitory',
      address: 'ул. Чехова, 22',
      working_hours: 'Круглосуточно',
      geometry: { type: 'Point', coordinates: [38.940612, 47.205331] }, // [lon, lat]
      last_update: '2026-02-01',
    },
    {
      name: 'Учебный корпус Г ЮФУ',
      type: 'university',
      address: 'ул. Шевченко, 2',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      geometry: { type: 'Point', coordinates: [38.934843, 47.203254] },
      last_update: '2026-03-15',
    },
    {
      name: 'Столовая "Еда Всегда"',
      type: 'canteen',
      address: 'Некрасовский переулок, 21',
      working_hours: '09:00 - 17:00',
      geometry: { type: 'Point', coordinates: [38.938563, 47.206794] },
      last_update: '2026-04-10',
    },
    {
      name: 'Спортзал №5',
      type: 'sport',
      address: 'ул. Чехова, 22',
      working_hours: '09:00 - 17:00',
      geometry: { type: 'Point', coordinates: [38.940612, 47.205331] },
      last_update: '2026-04-10',
    },
    {
      name: 'Печать "Карван"',
      type: 'copy_center',
      address: 'Некрасовский переулок, 63',
      working_hours: '09:00 - 18:00',
      geometry: { type: 'Point', coordinates: [38.936488, 47.204370] },
      last_update: '2026-04-10',
    },
    {
      name: 'Учебный корпус Д ЮФУ',
      type: 'university',
      address: 'Некрасовский переулок, 44',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      geometry: { type: 'Point', coordinates: [38.935727, 47.202130] },
      last_update: '2026-03-15',
    },
    {
      name: 'Учебный корпус А ЮФУ',
      type: 'university',
      address: 'ул. Чехова, 22',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      geometry: { type: 'Point', coordinates: [38.939632, 47.205301] },
      last_update: '2026-03-15',
    },
    {
      name: 'Учебный корпус И ЮФУ',
      type: 'university',
      address: 'ул. Чехова, 2',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      geometry: { type: 'Point', coordinates: [38.943917, 47.203880] },
      last_update: '2026-03-15',
    },
    {
      name: 'Учебный корпус Е ЮФУ',
      type: 'university',
      address: 'ул. Шевченко 2',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      geometry: { type: 'Point', coordinates: [38.944348, 47.204731] },
      last_update: '2026-03-15',
    },
    {
      name: 'Учебный корпус К ЮФУ',
      type: 'university',
      address: 'ул. Шевченко 2',
      working_hours: '08:00 - 18:00',
      phone: '+7 (8634) 600-000',
      geometry: { type: 'Point', coordinates: [38.943997, 47.204915] },
      last_update: '2026-03-15',
    },
  ];

  // Очистка и вставка
  await InfrastructureObject.destroy({ truncate: true, cascade: true });
  await InfrastructureObject.bulkCreate(objects, {
    ignoreDuplicates: false,
  });
  
  console.log(`✅ Загружено ${objects.length} объектов инфраструктуры Таганрога`);
}

export async function down() {
  await InfrastructureObject.destroy({ 
    where: { 
      name: { 
        $in: ['Общежитие 5 ЮФУ', 'Учебный корпус Г ЮФУ', 'Столовая "Еда Всегда"'] 
      } 
    } 
  });
}