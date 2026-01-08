SHELL := /bin/bash

.PHONY: start start.backend start.frontend start.db start.celery stop logs migrate rebuild new-migration \
	start.prod start.prod.backend start.prod.db start.prod.celery stop.prod logs.prod migrate.prod rebuild.prod new-migration.prod \
	setup-hooks

setup-hooks:
	python3 -m pip install pre-commit --break-system-packages
	python3 -m pre_commit install

start:
	docker compose up --build

start.backend:
	docker compose up api

start.frontend:
	docker compose up web

start.db:
	docker compose up db adminer

start.celery:
	docker compose up celery-worker

stop:
	docker compose down

logs:
	docker compose logs -f --tail=200

migrate:
	docker compose exec api alembic upgrade head

migration:
	@if [ -z "$(msg)" ]; then echo "Error: provide msg, e.g. make migration msg='add users table'"; exit 1; fi; \
		docker compose exec api alembic revision --autogenerate -m "$(msg)"

migrate-down:
	docker compose exec api alembic downgrade -1

migration-check:
	docker compose exec api alembic check

check: migration-check
	docker compose exec api ruff check .
	docker compose exec api mypy .
	docker compose exec web npm run lint
	docker compose exec web npx tsc --noEmit
	@echo "All checks passed!"

fix:
	docker compose exec api ruff check --fix .
	docker compose exec web npm run lint -- --fix

rebuild:
	docker compose up -d --build --force-recreate

start.prod:
	docker compose -f docker-compose.prod.yml up --build

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

new-migration.prod:
	@if [ -z "$(name)" ]; then echo "Error: provide name, e.g. make new-migration.prod name='add users table'"; exit 1; fi; \
		docker compose -f docker-compose.prod.yml run --rm api alembic revision --autogenerate -m "$(name)"
