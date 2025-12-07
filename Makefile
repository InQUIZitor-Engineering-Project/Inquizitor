SHELL := /bin/bash

.PHONY: start start.backend start.frontend start.db start.celery stop logs migrate rebuild new-migration \
	start.prod start.prod.backend start.prod.db start.prod.celery stop.prod logs.prod migrate.prod rebuild.prod new-migration.prod

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
	docker compose run --rm api alembic upgrade head

rebuild:
	docker compose build --no-cache

new-migration:
	@if [ -z "$(name)" ]; then echo "Error: provide name, e.g. make new-migration name='add users table'"; exit 1; fi; \
		docker compose run --rm api alembic revision --autogenerate -m "$(name)"

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
