FROM oven/bun:1.3-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma.config.ts ./
COPY prisma ./prisma

ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN bunx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["bun", "run", "start"]
