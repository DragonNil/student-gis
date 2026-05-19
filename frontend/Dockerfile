# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for caching
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source
COPY . .

# Create .env.production if not exists
RUN if [ ! -f .env.production ]; then \
    echo "VITE_API_BASE_URL=/api" > .env.production; \
    fi

# Build arguments for environment variables
ARG VITE_API_BASE_URL=/api
ARG VITE_YANDEX_MAPS_API_KEY=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_YANDEX_MAPS_API_KEY=${VITE_YANDEX_MAPS_API_KEY}

# Build the app
RUN yarn build --mode production

# === Production stage ===
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]