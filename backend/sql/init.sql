-- backend/sql/seed-tagangorg.sql
-- Очистка таблицы (опционально)
TRUNCATE TABLE infrastructure_objects
RESTART IDENTITY CASCADE;

-- Вставка 10 объектов Таганрога
-- Важно: координаты в формате [долгота, широта] для PostGIS
INSERT INTO infrastructure_objects
    (
    name, type, address, working_hours, phone, last_update, geometry, created_at, updated_at
    )
VALUES
    (
        'Общежитие 5 ЮФУ',
        'dormitory',
        'ул. Чехова, 22',
        'Круглосуточно',
        NULL,
        '2026-02-01',
        ST_SetSRID(ST_MakePoint(38.940612, 47.205331), 4326),
        NOW(), NOW()
  ),
    (
        'Учебный корпус Г ЮФУ',
        'university',
        'ул. Шевченко, 2',
        '08:00 - 18:00',
        '+7 (8634) 600-000',
        '2026-03-15',
        ST_SetSRID(ST_MakePoint(38.934843, 47.203254), 4326),
        NOW(), NOW()
  ),
    (
        'Столовая "Еда Всегда"',
        'canteen',
        'Некрасовский переулок, 21',
        '09:00 - 17:00',
        NULL,
        '2026-04-10',
        ST_SetSRID(ST_MakePoint(38.938563, 47.206794), 4326),
        NOW(), NOW()
  ),
    (
        'Спортзал №5',
        'sport',
        'ул. Чехова, 22',
        '09:00 - 17:00',
        NULL,
        '2026-04-10',
        ST_SetSRID(ST_MakePoint(38.940612, 47.205331), 4326),
        NOW(), NOW()
  ),
    (
        'Печать "Карван"',
        'copy_center',
        'Некрасовский переулок, 63',
        '09:00 - 18:00',
        NULL,
        '2026-04-10',
        ST_SetSRID(ST_MakePoint(38.936488, 47.204370), 4326),
        NOW(), NOW()
  ),
    (
        'Учебный корпус Д ЮФУ',
        'university',
        'Некрасовский переулок, 44',
        '08:00 - 18:00',
        '+7 (8634) 600-000',
        '2026-03-15',
        ST_SetSRID(ST_MakePoint(38.935727, 47.202130), 4326),
        NOW(), NOW()
  ),
    (
        'Учебный корпус А ЮФУ',
        'university',
        'ул. Чехова, 22',
        '08:00 - 18:00',
        '+7 (8634) 600-000',
        '2026-03-15',
        ST_SetSRID(ST_MakePoint(38.939632, 47.205301), 4326),
        NOW(), NOW()
  ),
    (
        'Учебный корпус И ЮФУ',
        'university',
        'ул. Чехова, 2',
        '08:00 - 18:00',
        '+7 (8634) 600-000',
        '2026-03-15',
        ST_SetSRID(ST_MakePoint(38.943917, 47.203880), 4326),
        NOW(), NOW()
  ),
    (
        'Учебный корпус Е ЮФУ',
        'university',
        'ул. Шевченко 2',
        '08:00 - 18:00',
        '+7 (8634) 600-000',
        '2026-03-15',
        ST_SetSRID(ST_MakePoint(38.944348, 47.204731), 4326),
        NOW(), NOW()
  ),
    (
        'Учебный корпус К ЮФУ',
        'university',
        'ул. Шевченко 2',
        '08:00 - 18:00',
        '+7 (8634) 600-000',
        '2026-03-15',
        ST_SetSRID(ST_MakePoint(38.943997, 47.204915), 4326),
        NOW(), NOW()
  );

-- Проверка
SELECT COUNT(*) as total, type, COUNT(*) as per_type
FROM infrastructure_objects
GROUP BY type;