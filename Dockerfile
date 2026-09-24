# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- base
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

# ---------------------------------------------------------------- deps
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------- build
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @inktype/web build

# ---------------------------------------------------------------- runtime
FROM node:22-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Prisma CLI applies database migrations on start-up.
RUN npm install -g prisma@5.22.0 && npm cache clean --force

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/data/inktype.db

COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /app/apps/web/prisma ./prisma
COPY --chown=node:node docker/entrypoint.sh ./entrypoint.sh

RUN mkdir -p /data && chown node:node /data && chmod +x ./entrypoint.sh
USER node
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
