from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from app.domain.models import Job


class JobRepository(ABC):
    @abstractmethod
    def add(self, job: Job) -> Job:
        raise NotImplementedError

    @abstractmethod
    def update(self, job: Job) -> Job:
        raise NotImplementedError

    @abstractmethod
    def get(self, job_id: int) -> Job | None:
        raise NotImplementedError

    @abstractmethod
    def list_for_user(self, owner_id: int) -> Iterable[Job]:
        raise NotImplementedError


__all__ = ["JobRepository"]
