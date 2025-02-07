# Stage 1: Base image
FROM node:20 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Development (Vite)
FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 3: Production (Build)
FROM base AS build
COPY . .
ARG VITE_API_URL
RUN npm run build

# Stage 4: Production (Nginx)
FROM nginx:1 AS production
COPY --from=build /app/dist/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
