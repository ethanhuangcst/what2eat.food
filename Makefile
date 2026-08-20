.PHONY: help dev up down build test lint test-coverage quality db-migrate-test test-e2e-mvp1 test-e2e-mvp2-live test-e2e-mvp3-live test-e2e-mvp4-live

.DEFAULT_GOAL := help

COMPOSE_DEV := docker compose -f docker-compose.dev.yml
PG_BIN := /opt/homebrew/opt/postgresql@16/bin
PORT := 5435

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf " %-18s %s\n", $$1, $$2}'

dev: ## Start Next dev (foreground; Postgres must already be up)
	npm run dev

up: ## Start local Postgres on :5435 (Docker or Homebrew)
	@if command -v pg_isready >/dev/null 2>&1 && pg_isready -h localhost -p $(PORT) >/dev/null 2>&1; then \
		echo "Postgres already ready on :$(PORT)"; \
	elif command -v docker >/dev/null 2>&1; then \
		$(COMPOSE_DEV) up -d postgres; \
	else \
		if ! $(PG_BIN)/pg_isready -h localhost -p $(PORT) >/dev/null 2>&1; then \
			brew services start postgresql@16; \
			sleep 2; \
		fi; \
		echo "Postgres ready on :$(PORT) (Homebrew)"; \
	fi

down: ## Stop local Postgres
	@if command -v docker >/dev/null 2>&1; then \
		$(COMPOSE_DEV) down; \
	else \
		brew services stop postgresql@16 || true; \
	fi

db-migrate: up ## Apply Prisma migrations to dev DB (what2eat on :5435)
	DATABASE_URL=postgresql://what2eat:what2eat@localhost:$(PORT)/what2eat npx prisma migrate deploy

db-migrate-test: up ## Create test DB and run migrations
	@psql "postgresql://what2eat:what2eat@localhost:$(PORT)/postgres" -tc "SELECT 1 FROM pg_database WHERE datname = 'what2eat_test'" | grep -q 1 || \
		psql "postgresql://what2eat:what2eat@localhost:$(PORT)/postgres" -c "CREATE DATABASE what2eat_test;"
	DATABASE_URL=postgresql://what2eat:what2eat@localhost:$(PORT)/what2eat_test npx prisma migrate deploy

build: ## Production build (guards NODE_ENV)
	NODE_ENV=production npm run build

lint: ## Typecheck
	npm run typecheck

test: db-migrate-test ## Unit/integration tests
	npm test

test-coverage: db-migrate-test ## Unit tests with coverage gate
	npm run test:coverage

quality: lint test-coverage build test-e2e-mvp1 ## Full MVP-1 quality gate

test-e2e-mvp1: up ## MVP-1 Playwright journey
	python3 e2e/run.py mvp1

test-e2e-mvp2-live: up ## MVP-2 live journey (what2eat + places-agent)
	python3 e2e/run.py mvp2-live

test-e2e-mvp3-live: up ## MVP-3 live journey (chat + history)
	python3 e2e/run.py mvp3-live

test-e2e-mvp4-live: up ## MVP-4 live journey (sort + reshuffle)
	python3 e2e/run.py mvp4-live
