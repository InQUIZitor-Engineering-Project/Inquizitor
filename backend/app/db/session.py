from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session, SQLModel

from app.core.config import Settings, get_settings


@lru_cache()
def _build_engine(database_url: str, sql_echo: bool):
    return create_engine(
        database_url,
        echo=sql_echo,
    )


def get_engine(settings: Settings | None = None):
    cfg = settings or get_settings()
    return _build_engine(cfg.DATABASE_URL, cfg.SQL_ECHO)


@lru_cache()
def _build_session_factory(database_url: str, sql_echo: bool):
    engine = _build_engine(database_url, sql_echo)
    return sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=Session,
    )


def get_session_factory(settings: Settings | None = None):
    cfg = settings or get_settings()
    return _build_session_factory(cfg.DATABASE_URL, cfg.SQL_ECHO)


def get_session():
    session_factory = get_session_factory()

    db = session_factory()
    try:
        yield db
    finally:
        db.close()


def init_db(create_tables: bool = False, settings: Settings | None = None) -> None:
    if not create_tables:
        return
    engine = get_engine(settings=settings)
    SQLModel.metadata.create_all(bind=engine)
