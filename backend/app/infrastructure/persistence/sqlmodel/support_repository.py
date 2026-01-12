from __future__ import annotations

from typing import TYPE_CHECKING

from sqlmodel import Session

from app.db.models import SupportTicket
from app.domain.repositories.support_repository import SupportRepository

if TYPE_CHECKING:
    pass

class SqlModelSupportRepository(SupportRepository):
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, ticket: SupportTicket) -> None:
        self._session.add(ticket)

    def get(self, ticket_id: int) -> SupportTicket | None:
        return self._session.get(SupportTicket, ticket_id)

