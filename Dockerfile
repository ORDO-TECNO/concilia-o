FROM node:22-slim AS builder
WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma client (schema was unavailable during npm ci)
RUN npm run prisma:generate --workspace=apps/api

# Build shared first (API depends on it), then API
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# Drop devDependencies
RUN npm prune --omit=dev


FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Workspace structure (node_modules/@conciliacao/shared symlinks into packages/shared)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# shared dist (resolved by workspace symlink at runtime)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
