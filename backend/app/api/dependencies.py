"""FastAPI dependency providers for application services."""

from __future__ import annotations

from typing import TYPE_CHECKING, cast

from fastapi import Depends, Request

from app.application.services import AuthService, FileService, MaterialService, TestService, UserService, JobService
from app.domain.services import FileStorage

if TYPE_CHECKING:  # pragma: no cover - only for type hints
    from app.bootstrap import AppContainer


def get_app_container(request: Request):
    container = getattr(request.app.state, "container", None)
    if container is None:
        from app.bootstrap import get_container  # late import to avoid circular dependency

        container = get_container()
    return cast("AppContainer", container)


def get_auth_service(container=Depends(get_app_container)) -> AuthService:
    return container.provide_auth_service()


def get_test_service(container=Depends(get_app_container)) -> TestService:
    return container.provide_test_service()


def get_file_service(container=Depends(get_app_container)) -> FileService:
    return container.provide_file_service()


def get_material_service(container=Depends(get_app_container)) -> MaterialService:
    return container.provide_material_service()


def get_job_service(container=Depends(get_app_container)) -> JobService:
    return container.provide_job_service()


def get_export_storage(container=Depends(get_app_container)) -> FileStorage:
    return container.provide_export_storage()

def get_user_service(container=Depends(get_app_container)) -> UserService:
    return container.provide_user_service()

__all__ = [
    "get_app_container",
    "get_auth_service",
    "get_test_service",
    "get_file_service",
    "get_material_service",
    "get_job_service",
    "get_export_storage",
    "get_user_service",
]

