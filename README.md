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
- Aplikacja FastAPI jest tworzona poprzez `create_app()` w `app/bootstrap.py`.
- `app/main.py` eksportuje gotową instancję (`app = create_app()`), więc uruchamianie `uvicorn app.main:app` działa bez dodatkowej konfiguracji.
- Testy mogą tworzyć własną instancję, wywołując `create_app(settings_override=...)` i podając np. zmodyfikowane ustawienia.

### Backend architecture
- **Warstwa API** (`app/routers`, `app/api/dependencies.py`): odpowiada za walidację żądań i zależności FastAPI; całą logikę przekazuje do serwisów application.
- **Warstwa application** (`app/application/services/`, `unit_of_work.py`, `dto.py`): implementuje use-case’y (auth, tests, files, materials), mapuje domenę na DTO i zarządza transakcjami przez `SqlAlchemyUnitOfWork`.
- **Warstwa domain** (`app/domain/`): encje, interfejsy repozytoriów, zdarzenia domenowe, kontrakty usług zewnętrznych.
- **Warstwa infrastructure** (`app/infrastructure/`): adaptery SQLModel, LLM, OCR, storage i ich rejestracja w `AppContainer`.
- **DI**: `AppContainer` udostępnia UnitOfWork i serwisy, a wstrzykiwanie odbywa się przez `Depends(get_*_service)`; `app/api/dependencies.py` zapewnia spójne źródło zależności.

### Notes
- Backend hot‑reload: mounted `