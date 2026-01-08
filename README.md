# Development

## Local development (Docker Compose)

Prerequisites: Docker Desktop 4.x

### First run
1. Start all services:
   - `make start` (or `docker compose up --build`)
2. Open services:
   - API: http://localhost:8000/docs
   - Web: http://localhost:5173

### Useful commands

#### 🚀 Core Commands
- `make start`: Starts the entire development environment (API, Web, DB, Celery) and builds images.
- `make stop`: Stops all running containers and cleans up.
- `make logs`: Follows logs from all services (last 200 lines).
- `make rebuild`: Forces a clean rebuild of all Docker images without using cache.

#### 🛠️ Quality Control (Local CI)
- `make check`: Runs the **full CI suite** locally (migrations drift, linting, and type checking for both backend and frontend).
- `make fix`: Automatically fixes most linting issues in both backend (Ruff) and frontend (ESLint).

#### 🗄️ Database & Migrations
- `make migration msg="description"`: Generates a new migration file based on model changes.
- `make migrate`: Manually applies all pending migrations to the database (also happens automatically on app start).
- `make migrate-down`: Reverts the last applied migration.
- `make migration-check`: Only checks if your models are in sync with migrations (no changes made).

#### 🍱 Partial Startup
- `make start.backend`: Starts only the API container.
- `make start.frontend`: Starts only the Web container.
- `make start.db`: Starts only the Database and Adminer.
- `make start.celery`: Starts only the Celery worker.

### Backend bootstrap
- The FastAPI app is built via `create_app()` in `app/bootstrap.py`.
- `app/main.py` exports the ready-to-use instance (`app = create_app()`), so running `uvicorn app.main:app` works without extra steps.
- Tests can instantiate their own app by calling `create_app(settings_override=...)` with custom settings.

### Backend architecture
- **API layer** (`app/routers`, `app/api/dependencies.py`): validates requests and resolves FastAPI dependencies, delegating business logic to application services.
- **Application layer** (`app/application/services/`, `unit_of_work.py`, `dto.py`): implements use cases (auth, tests, files, materials), maps domain models to DTOs, and manages transactions through `SqlAlchemyUnitOfWork`.
- **Domain layer** (`app/domain/`): contains entities, repository interfaces, domain events, and external service contracts.
- **Infrastructure layer** (`app/infrastructure/`): provides adapters for SQLModel persistence, LLM, OCR, storage, and registers them in `AppContainer`.
- **Dependency Injection**: `AppContainer` exposes the UnitOfWork and services, while FastAPI injects them using `Depends(get_*_service)` with helpers from `app/api/dependencies.py`.

### Notes
- Backend hot‑reload: mounted `