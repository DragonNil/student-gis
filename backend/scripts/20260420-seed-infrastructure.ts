export async function up(queryInterface: any) {
  const objects = [
    {
      name: 'Общежитие ЮФУ №3',
      type: 'dormitory',
      address: 'ул. Чехова, 22, Таганрог',
      capacity: 450,
      year_built: 1975,
      geometry: { type: 'Point', coordinates: [38.929095, 47.206678] },
    },
    {
      name: 'Учебный корпус ЮФУ (Инженерный)',
      type: 'university',
      address: 'ул. Шевченко, 2, Таганрог',
      faculties: ['ИКТАИБ', 'ИКТИБ'],
      working_hours: 'пн-пт 08:00-18:00',
      phone: '+7 (8634) 60-00-00',
      geometry: { type: 'Point', coordinates: [38.934843, 47.203254] },
    },
    // ... добавить остальные объекты из GeoJSON
  ];
  
  await queryInterface.bulkInsert('infrastructure_objects', objects, {});
}