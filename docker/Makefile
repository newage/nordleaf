export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

COMPOSE = docker compose -f docker-compose.yml

.PHONY: up down build rebuild rebuild-frontend console

up:
	$(COMPOSE) up -d
	@echo "Сайт: http://localhost:4321  CMS: http://localhost:4321/admin"

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

# Повна перебудова: `-v` скидає том node_modules, інакше залежності зі старого образу лишаються
rebuild:
	$(COMPOSE) down -v
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# Швидке скидання кешів dev без повної перебудови (стара картинка, застарілий контент).
# Кеші: node_modules/.astro і .vite (том), .astro, а також .wrangler/state/v3/cache — Cache API miniflare,
# де dev-режим тримає відповіді /_image (саме він віддавав стару картинку після заміни файлу).
rebuild-frontend:
	$(COMPOSE) stop app
	rm -rf ../.wrangler/state/v3/cache ../.astro
	$(COMPOSE) run --rm --no-deps app sh -c 'rm -rf node_modules/.astro node_modules/.vite'
	$(COMPOSE) up -d app

# Оболонка в контейнері app (тут запускається `npx wrangler dev`)
console:
	$(COMPOSE) exec app sh
