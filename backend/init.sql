-- Включение PostGIS
CREATE EXTENSION
IF NOT EXISTS postgis;
CREATE EXTENSION
IF NOT EXISTS postgis_topology;

-- Создание пользователя (если нужно)
-- CREATE USER gis_user WITH PASSWORD 'gis_password';
-- GRANT ALL PRIVILEGES ON DATABASE student_gis_db TO gis_user;

-- Логирование
SELECT 'PostGIS enabled successfully' as status;