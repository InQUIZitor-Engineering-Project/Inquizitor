from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models import SupportTicket

class SupportRepository(ABC):
    @abstractmethod
    def add(self, ticket: SupportTicket) -> None:
        """Add a new support ticket to the repository."""
        ...

    @abstractmethod
    def get(self, ticket_id: int) -> SupportTicket | None:
        """Retrieve a support ticket by ID."""
        ...

