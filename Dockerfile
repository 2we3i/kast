# Kast is a static site: Node builds it, Caddy serves the files. Nothing in
# the image runs server-side code or receives résumé content.

FROM node:24-slim AS build
WORKDIR /app
ENV HUSKY=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
# Baked into canonical links, the sitemap, and the "Source code" link.
ARG PUBLIC_SITE_URL
ARG PUBLIC_SOURCE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_SOURCE_URL=$PUBLIC_SOURCE_URL
RUN pnpm build

FROM caddy:2.10-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
