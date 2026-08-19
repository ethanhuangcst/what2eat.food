.PHONY: help dev up down test

.DEFAULT_GOAL := help

COMPOSE_DEV := docker compose -f docker-compose.dev.yml

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf " %-12s %s\n", $$1, $$2}'

dev: ## Start Next dev (foreground; Postgres must already be up)
	npm run dev

up: ## Start local Postgres (5435) in background
	$(COMPOSE_DEV) up -d postgres

down: ## Stop local Postgres
	$(COMPOSE_DEV) down

test: ## Run unit/integration tests (requires Postgres + TEST_DATABASE_URL)
	npm test
