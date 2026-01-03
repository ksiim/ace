COMPOSE ?= docker-compose
MSG ?= $(word 2,$(MAKECMDGOALS))

.PHONY: dev-up
dev-up: ## Запустить сервер в режиме разработки с зависимостями
	$(COMPOSE) up --build -d

.PHONY: migration
migration:
	@if [ -z "$(MSG)" ]; then echo "ERROR: MSG is empty. Usage: make migration \"Your migrate message\" or make migration \"Your message\""; exit 1; fi
	$(COMPOSE) run --rm --build alembic alembic revision --autogenerate -m "$(MSG)"

%:
	@: