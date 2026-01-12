from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models import SystemNotification, UserReadNotification

class NotificationRepository(ABC):
    @abstractmethod
    def get_notifications_for_user(self, user_id: int) -> list[SystemNotification]:
        """Get all global and private notifications for a specific user."""
        ...

    @abstractmethod
    def get_unread_count_for_user(self, user_id: int) -> int:
        """Get the count of unread notifications for a specific user."""
        ...

    @abstractmethod
    def get_read_notification_ids(self, user_id: int) -> set[int]:
        """Get IDs of notifications already read by the user."""
        ...

    @abstractmethod
    def get_notification_by_id_and_user(
        self, notification_id: int, user_id: int
    ) -> SystemNotification | None:
        """Get a specific notification if the user has access to it."""
        ...

    @abstractmethod
    def get_read_record(
        self, user_id: int, notification_id: int
    ) -> UserReadNotification | None:
        """Get a read record for a specific user and notification."""
        ...

    @abstractmethod
    def add_read_record(self, read_record: UserReadNotification) -> None:
        """Mark a notification as read by adding a record."""
        ...

