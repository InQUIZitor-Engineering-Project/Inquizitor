SHELL := /bin/bash

.PHONY: start start.app start.web start.backend start.db start.celery stop logs \
	migrate migration migration-check migrate-down \
	check fix rebuild \
	start.prod start.prod.app start.prod.web start.prod.backend \
	start.prod.db start.prod.celery stop.prod logs.prod migrate.prod rebuild.prod

# ─── Dev ──────────────────────────────────────────────────────────────────────

start:
	docker compose up

start.app:
	docker compose up app

start.web:
	docker compose up web

start.backend:
	docker compose up api

start.db:
	docker compose up db adminer

start.celery:
	docker compose up celery-worker

stop:
	docker compose down

logs:
	docker compose logs -f --tail=200

rebuild:
	docker compose up -d --build --force-recreate

# ─── Database / Migrations ────────────────────────────────────────────────────

migrate:
	docker compose exec api alembic upgrade head

migration:
	@if [ -z "$(msg)" ]; then echo "Error: provide msg, e.g. make migration msg='add users table'"; exit 1; fi; \
		docker compose exec api alembic revision --autogenerate -m "$(msg)"

migrate-down:
	docker compose exec api alembic downgrade -1

migration-check:
	docker compose exec api alembic check

# ─── Code Quality ─────────────────────────────────────────────────────────────

check: migration-check
	docker compose exec api ruff check .
	docker compose exec api mypy .
	docker compose exec app npm run lint --workspace=@inquizitor/app
	docker compose exec app npx tsc --noEmit --project apps/app/tsconfig.json
	docker compose exec web npm run lint --workspace=@inquizitor/web
	docker compose exec web npx tsc --noEmit --project apps/web/tsconfig.json
	@echo "All checks passed!"

fix:
	docker compose exec api ruff check --fix .
	docker compose exec app npm run lint --workspace=@inquizitor/app -- --fix
	docker compose exec web npm run lint --workspace=@inquizitor/web -- --fix

# ─── Production ───────────────────────────────────────────────────────────────

start.prod:
	docker compose -f docker-compose.prod.yml up --build

start.prod.app:
	docker compose -f docker-compose.prod.yml up app

start.prod.web:
	docker compose -f docker-compose.prod.yml up web

start.prod.backend:
	docker compose -f docker-compose.prod.yml up api

start.prod.db:
	docker compose -f docker-compose.prod.yml up db

start.prod.celery:
	docker compose -f docker-compose.prod.yml up celery-worker

stop.prod:
	docker compose -f docker-compose.prod.yml down

logs.prod:
	docker compose -f docker-compose.prod.yml logs -f --tail=200

migrate.prod:
	docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head

rebuild.prod:
	docker compose -f docker-compose.prod.yml build --no-cache
