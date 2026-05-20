# frontend/Dockerfile — MULTI-STAGE, РАБОЧИЙ ВАРИАНТ
# === Stage 1: Builder ===
FROM node:20-alpine AS builder

WORKDIR /app

# Install yarn
RUN apk add --no-cache yarn

# Copy package files first for caching
COPY package*.json yarn.lock* ./
RUN yarn install --production=false

# Copy source
COPY . .

# Create .env.production if not exists
RUN if [ ! -f .env.production ]; then \
      echo "VITE_API_BASE_URL=/api" > .env.production; \
    fi

# Build args
ARG VITE_API_BASE_URL=/api
ARG VITE_YANDEX_MAPS_API_KEY=8ea7d884-6708-4459-8032-556d2eb89a65
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_YANDEX_MAPS_API_KEY=${VITE_YANDEX_MAPS_API_KEY}

# Build (без минификации для демо)
RUN yarn build

# === Stage 2: Production nginx ===
FROM nginx:alpine

# Копируем сборку из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем наш конфиг (перезаписывает дефолтный)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 👇 КРИТИЧНО: исправляем путь к pid-файлу для Alpine
RUN sed -i 's|pid /run/nginx.pid|pid /var/run/nginx.pid|g' /etc/nginx/nginx.conf

# 👇 КРИТИЧНО: для демо запускаем от root (избегаем проблем с правами)
# Для продакшена потом можно раскомментировать:
# RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run
# USER nginx

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
