// src/data/mockData.ts
import { type IInfrastructureProperties } from '../types';


export const mockInfrastructure: IInfrastructureProperties[] = [
  {
    id: 1,
    name: 'Общежитие 5 ЮФУ ',
    type: 'dormitory',
    address: 'ул. Чехова, 22',
    working_hours: 'Круглосуточно',
    coords: [47.205331, 38.940612],
    last_update: '2026-02-01',
  },
  {
    id: 2,
    name: 'Учебный корпус Г ЮФУ',
    type: 'university',
    address: 'ул. Шевченко, 2',
    working_hours: '08:00 - 18:00',
    phone: '+7 (8634) 600-000',
    coords: [47.203254, 38.934843],
    last_update: '2026-03-15',
    // @ts-ignore
  },
  {
    id: 3,
    name: 'Столовая "Еда Всегда"',
    type: 'canteen',
    address: 'Некрасовский переулок, 21',
    working_hours: '09:00 - 17:00',
    coords: [47.206794, 38.938563], 
    last_update: '2026-04-10',
    // @ts-ignore
  },
  {
    id: 4,
    name: 'Спортзал №5',
    type: 'sport',
    address: 'ул. Чехова, 22',
    working_hours: '09:00 - 17:00',
    coords: [47.205331, 38.940612],
    last_update: '2026-04-10',
  },
   {
    id: 5,
    name: 'Печать "Карван"',
    type: 'copy_center',
    address: 'Некрасовский переулок, 63',
    working_hours: '09:00 - 18:00',
    coords: [47.204370, 38.936488],
    last_update: '2026-04-10',
  },
  {
    id: 6,
    name: 'Учебный корпус Д ЮФУ',
    type: 'university',
    address: 'Некрасовский переулок, 44',
    working_hours: '08:00 - 18:00',
    phone: '+7 (8634) 600-000',
    coords: [47.202130, 38.935727], // Из примера маршрута в отчете
    last_update: '2026-03-15',
    // @ts-ignore
  },
  {
    id: 7,
    name: 'Учебный корпус А ЮФУ',
    type: 'university',
    address: 'ул. Чехова, 22',
    working_hours: '08:00 - 18:00',
    phone: '+7 (8634) 600-000',
    coords: [47.205301, 38.939632], // Из примера маршрута в отчете
    last_update: '2026-03-15',
    // @ts-ignore
  },
   {
    id: 8,
    name: 'Учебный корпус И ЮФУ',
    type: 'university',
    address: 'ул. Чехова, 2',
    working_hours: '08:00 - 18:00',
    phone: '+7 (8634) 600-000',
    coords: [47.203880, 38.943917], // Из примера маршрута в отчете
    last_update: '2026-03-15',
    // @ts-ignore
  },
  {
    id: 9,
    name: 'Учебный корпус Е ЮФУ',
    type: 'university',
    address: 'ул. Шевченко 2',
    working_hours: '08:00 - 18:00',
    phone: '+7 (8634) 600-000',
    coords: [47.204731, 38.944348], // Из примера маршрута в отчете
    last_update: '2026-03-15',
    // @ts-ignore
  },
   {
    id: 10,
    name: 'Учебный корпус К ЮФУ',
    type: 'university',
    address: 'ул. Шевченко 2',
    working_hours: '08:00 - 18:00',
    phone: '+7 (8634) 600-000',
    coords: [47.204915, 38.943997], // Из примера маршрута в отчете
    last_update: '2026-03-15',
    // @ts-ignore
  },
];

