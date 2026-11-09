# Produção do SITE (Coolify): gera o site estático com o Vite e serve a pasta dist com o nginx.
# A API tem o próprio Dockerfile em api/Dockerfile. Para desenvolvimento local, use o docker-compose.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# O Vite grava as variáveis VITE_* no site durante o build. No Coolify, marque-as como "Build Variable".
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
# A porta pode ser trocada por $PORT; o template do nginx a recebe ao iniciar.
ENV PORT=8080
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
