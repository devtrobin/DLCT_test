FROM oven/bun:1.3-alpine

WORKDIR /app

COPY 02_Back-End/ExpressStarterDCT/package.json ./
COPY 02_Back-End/ExpressStarterDCT/bun.lock ./
RUN bun install --frozen-lockfile

COPY 02_Back-End/ExpressStarterDCT/prisma.config.ts ./
COPY 02_Back-End/ExpressStarterDCT/prisma ./prisma

ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN bunx prisma generate

CMD ["bunx", "prisma", "migrate", "deploy"]
