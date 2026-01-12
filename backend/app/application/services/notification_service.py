from __future__ import annotations
from collections.abc import Callable
from typing import TYPE_CHECKING
from app.db.models import UserReadNotification

if TYPE_CHECKING:
    from app.application.interfaces import UnitOfWork
    from app.api.schemas.notifications import NotificationOut, UnreadCount

class NotificationService:
    def __init__(self, uow_factory: Callable[[], UnitOfWork]) -> None:
        self._uow_factory = uow_factory

    def get_my_notifications(self, user_id: int) -> list[NotificationOut]:
        from app.api.schemas.notifications import NotificationOut
        with self._uow_factory() as uow:
            notifications = uow.notifications.get_notifications_for_user(user_id)
            read_ids = uow.notifications.get_read_notification_ids(user_id)
            
            return [
                NotificationOut(
                    id=n.id, # type: ignore
                    title=n.title,
                    message=n.message,
                    type=n.type,
                    created_at=n.created_at,
                    is_read=(n.id in read_ids) # type: ignore
                )
                for n in notifications
            ]

    def get_unread_count(self, user_id: int) -> UnreadCount:
        from app.api.schemas.notifications import UnreadCount
        with self._uow_factory() as uow:
            count = uow.notifications.get_unread_count_for_user(user_id)
            return UnreadCount(count=count)

    def mark_as_read(self, user_id: int, notification_id: int) -> None:
        with self._uow_factory() as uow:
            notification = uow.notifications.get_notification_by_id_and_user(notification_id, user_id)
            if not notification:
                return # Or raise a specific domain exception

            existing = uow.notifications.get_read_record(user_id, notification_id)
            if not existing:
                new_entry = UserReadNotification(
                    user_id=user_id,
                    notification_id=notification_id
                )
                uow.notifications.add_read_record(new_entry)
                uow.commit()

