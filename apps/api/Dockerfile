FROM oven/bun:1.2.5-alpine

WORKDIR /app

COPY apps/api/package.json package.json

RUN bun install

COPY apps/api .

RUN bunx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/server.ts"]
