# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем только package-файлы сначала (для кэширования зависимостей)
COPY package*.json yarn.lock* ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile --ignore-scripts

# Копируем исходный код
COPY . .

# Создаём .env с дефолтными значениями для сборки (если не передан)
# Это предотвратит падение сборки из-за отсутствия VITE_ переменных
RUN if [ ! -f .env ]; then \
    echo "VITE_API_BASE_URL=http://localhost:4000/api" > .env; \
    echo "VITE_YANDEX_MAPS_API_KEY=dummy_key_for_build" >> .env; \
    fi

# Собираем приложение (игнорируем ошибки типов для продакшн-сборки)
RUN yarn build

# Production stage
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем nginx конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck для Docker Compose
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]