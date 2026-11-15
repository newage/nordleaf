# Debian (glibc): workerd і sharp не працюють на musl/alpine
FROM node:24-bookworm-slim

# UID/GID хоста, щоб файли, створені в контейнері (dist, .astro, правки Decap), не були root-овими
ARG HOST_UID=1000
ARG HOST_GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupmod -g ${HOST_GID} node && usermod -u ${HOST_UID} -g ${HOST_GID} node \
    && mkdir -p /app && chown node:node /app

WORKDIR /app
USER node

# Залежності ставимо окремим шаром; вихідний код монтується томом
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

EXPOSE 4321 8081 8787
CMD ["npm", "run", "dev"]
