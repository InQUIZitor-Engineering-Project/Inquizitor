from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import PendingVerification


class PendingVerificationRepository(ABC):
    @abstractmethod
    def upsert(self, pending: PendingVerification) -> PendingVerification:
        raise NotImplementedError

    @abstractmethod
    def get_by_email(self, email: str) -> PendingVerification | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_token_hash(self, token_hash: str) -> PendingVerification | None:
        raise NotImplementedError

    @abstractmethod
    def delete_by_email(self, email: str) -> None:
        raise NotImplementedError


__all__ = ["PendingVerificationRepository"]
