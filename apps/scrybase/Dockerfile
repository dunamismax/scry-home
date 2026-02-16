FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runtime

RUN addgroup --system --gid 1001 scrybase && \
    adduser --system --uid 1001 --ingroup scrybase scrybase

COPY --from=build --chown=scrybase:scrybase /app/.output ./.output
COPY --from=build --chown=scrybase:scrybase /app/node_modules ./node_modules
COPY --from=build --chown=scrybase:scrybase /app/package.json ./

USER scrybase
ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
