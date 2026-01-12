from __future__ import annotations

from collections.abc import Callable

from app.application.interfaces import UnitOfWork
from app.db.models import SupportCategory, SupportTicket


class SupportService:
    def __init__(self, uow_factory: Callable[[], UnitOfWork]) -> None:
        self._uow_factory = uow_factory

    def create_ticket(
        self,
        *,
        email: str,
        subject: str,
        message: str,
        category: SupportCategory = SupportCategory.general,
        first_name: str | None = None,
        last_name: str | None = None,
        user_id: int | None = None,
    ) -> SupportTicket:
        with self._uow_factory() as uow:
            ticket = SupportTicket(
                email=email,
                subject=subject,
                message=message,
                category=category,
                first_name=first_name,
                last_name=last_name,
                user_id=user_id,
            )
            uow.support_tickets.add(ticket)
            uow.commit()
            
            # Trigger support notification email via Celery
            from app.tasks.email import send_support_notification_task
            
            send_support_notification_task.delay(
                to_email="inquizitor.app@gmail.com",
                ticket_id=ticket.id,
                user_email=email,
                category=category.value,
                subject=subject,
                message=message,
                first_name=first_name,
                last_name=last_name,
            )
            
            return ticket

