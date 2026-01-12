from __future__ import annotations

from typing import TYPE_CHECKING

from sqlmodel import Session, col, desc, func, or_, select

from app.db.models import SystemNotification, UserReadNotification
from app.domain.repositories.notification_repository import NotificationRepository

if TYPE_CHECKING:
    pass

class SqlModelNotificationRepository(NotificationRepository):
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_notifications_for_user(self, user_id: int) -> list[SystemNotification]:
        query = select(SystemNotification).where(
            or_(
                col(SystemNotification.recipient_id).is_(None),
                SystemNotification.recipient_id == user_id
            )
        ).order_by(desc(SystemNotification.created_at))
        return list(self._session.exec(query).all())

    def get_unread_count_for_user(self, user_id: int) -> int:
        total_query = select(func.count(SystemNotification.id)).where(
            or_(
                col(SystemNotification.recipient_id).is_(None),
                SystemNotification.recipient_id == user_id
            )
        )
        total_count = self._session.exec(total_query).one()
        
        read_query = select(func.count(UserReadNotification.notification_id)).where(
            UserReadNotification.user_id == user_id
        )
        read_count = self._session.exec(read_query).one()
        
        return max(0, total_count - read_count)

    def get_read_notification_ids(self, user_id: int) -> set[int]:
        read_ids = self._session.exec(
            select(UserReadNotification.notification_id)
            .where(UserReadNotification.user_id == user_id)
        ).all()
        return set(read_ids)

    def get_notification_by_id_and_user(
        self, notification_id: int, user_id: int
    ) -> SystemNotification | None:
        query = select(SystemNotification).where(
            SystemNotification.id == notification_id,
            or_(
                col(SystemNotification.recipient_id).is_(None),
                SystemNotification.recipient_id == user_id
            )
        )
        return self._session.exec(query).first()

    def get_read_record(
        self, user_id: int, notification_id: int
    ) -> UserReadNotification | None:
        query = select(UserReadNotification).where(
            UserReadNotification.user_id == user_id,
            UserReadNotification.notification_id == notification_id
        )
        return self._session.exec(query).first()

    def add_read_record(self, read_record: UserReadNotification) -> None:
        self._session.add(read_record)

