export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

COMPOSE = docker compose -f docker-compose.yml

.PHONY: up down build rebuild console

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

# Оболонка в контейнері app (тут запускається `npx wrangler dev`)
console:
	$(COMPOSE) exec app sh
