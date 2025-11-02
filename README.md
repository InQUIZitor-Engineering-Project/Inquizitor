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
- Start only backend: `make start.backend`
- Start only frontend: `make start.frontend`
- Start only db: `make start.db`
- Stop all: `make stop`
- Logs (follow): `make logs`
- Run migrations: `make migrate`

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