# Stage 1: Base image
FROM node:20 AS base
WORKDIR /app
COPY ./frontend/package*.json ./
RUN corepack enable && npm install --legacy-peer-deps

# Stage 2: Development (Vite)
FROM base AS dev
COPY ./frontend .
RUN npm install --legacy-peer-deps
ENV PATH="/app/node_modules/.bin:$PATH"
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 3: Production (Build)
FROM base AS build
COPY ./frontend .
RUN npm install --legacy-peer-deps && npm run build

# Stage 4: Production (Nginx)
FROM nginx:1 AS production
COPY --from=build /app/dist/ /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
