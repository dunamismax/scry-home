FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 scrybase && \
    adduser --system --uid 1001 --ingroup scrybase scrybase

COPY --from=build --chown=scrybase:scrybase /app/build ./build
COPY --from=build --chown=scrybase:scrybase /app/app ./app
COPY --from=build --chown=scrybase:scrybase /app/server.ts ./server.ts
COPY --from=build --chown=scrybase:scrybase /app/package.json ./package.json
COPY --from=build --chown=scrybase:scrybase /app/node_modules ./node_modules

USER scrybase
EXPOSE 3000
CMD ["bun", "run", "start"]
