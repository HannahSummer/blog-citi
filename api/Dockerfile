# API do Blog CITi (NestJS + Prisma). O contexto do build é a RAIZ do repositório,
# porque a API usa regras compartilhadas com o site (pasta src/).
#   docker build -f api/Dockerfile -t blog-citi-api .
# No Coolify: Base Directory "/" e Dockerfile Location "/api/Dockerfile".
FROM node:20-alpine AS base
# O Prisma precisa do OpenSSL no Alpine.
RUN apk add --no-cache openssl
WORKDIR /app

# Desenvolvimento (docker-compose): o código entra por volume e recompila ao salvar.
FROM base AS dev
WORKDIR /app/api
CMD ["sh", "-c", "npm install && npx prisma migrate deploy && npm run dev"]

FROM base AS build
COPY api/package*.json api/
COPY api/prisma api/prisma
RUN cd api && npm ci
COPY api api
COPY src src
RUN cd api && npm run build && npm prune --omit=dev

# Produção (último estágio, o que o Coolify usa).
FROM base AS producao
ENV NODE_ENV=production PORT=3000
WORKDIR /app/api
COPY --from=build /app/api/package.json ./
COPY --from=build /app/api/node_modules node_modules
COPY --from=build /app/api/prisma prisma
COPY --from=build /app/api/dist dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD wget -qO- "http://127.0.0.1:$PORT/api/saude" || exit 1
# Aplica as migrações pendentes e sobe a API. Migração que falha impede a API de subir.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/api/src/main.js"]
