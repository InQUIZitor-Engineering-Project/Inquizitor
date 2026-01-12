from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_notification_service
from app.api.schemas.notifications import NotificationOut, UnreadCount
from app.application.services import NotificationService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

@router.get("/me/list", response_model=list[NotificationOut])
def get_my_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> list[NotificationOut]:
    """
    Pobiera powiadomienia globalne (recipient_id IS NULL)
    ORAZ prywatne dla tego użytkownika (recipient_id == current_user.id).
    """
    return notification_service.get_my_notifications(current_user.id) # type: ignore


@router.get("/me/unread-count", response_model=UnreadCount)
def get_unread_count(
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> UnreadCount:
    return notification_service.get_unread_count(current_user.id) # type: ignore


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_as_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> None:
    notification_service.mark_as_read(current_user.id, notification_id) # type: ignore
    return None
