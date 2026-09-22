# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /src

# Manifests first: the npm ci stays cached as long as they do not change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/simple-stock-flow-app/browser /usr/share/nginx/html

EXPOSE 80
