# Stage 1: Base image
FROM node:20 AS base
WORKDIR /app
COPY ./frontend/package*.json ./
RUN corepack enable && npm ci --legacy-peer-deps

# Stage 2: Development (Vite)
FROM base AS dev
COPY ./frontend .
ENV PATH="/app/node_modules/.bin:$PATH"
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 3: Production (Build)
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_FRONTEND_HOST
ENV VITE_FRONTEND_HOST=${VITE_FRONTEND_HOST}
COPY ./frontend .
RUN npm run build

# Stage 4: Production (Nginx)
FROM nginx:1 AS production
ARG ENV=production
COPY --from=build /app/dist/ /usr/share/nginx/html

# Копируем SSL-сертификаты только для production
RUN if [ "$ENV" = "production" ]; then mkdir -p /etc/nginx/ssl && cp -r /tmp/ssl/* /etc/nginx/ssl; fi

# Копируем нужный конфиг в зависимости от значения ENV
COPY ./frontend/nginx.${ENV}.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
