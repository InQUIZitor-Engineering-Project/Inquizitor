from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, col, desc, func, or_, select  # Ważny import or_

from app.core.security import get_current_user
from app.db.models import SystemNotification, User, UserReadNotification
from app.db.session import get_session

router = APIRouter()

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    created_at: datetime
    is_read: bool

class UnreadCount(BaseModel):
    count: int

@router.get("/me/list", response_model=list[NotificationOut])
def get_my_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """
    Pobiera powiadomienia globalne (recipient_id IS NULL)
    ORAZ prywatne dla tego użytkownika (recipient_id == current_user.id).
    """
    
    query = select(SystemNotification).where(
        or_(
            col(SystemNotification.recipient_id).is_(None),
            SystemNotification.recipient_id == current_user.id
        )
    ).order_by(desc(SystemNotification.created_at))
    
    notifications = session.exec(query).all()

    read_ids = session.exec(
        select(UserReadNotification.notification_id)
        .where(UserReadNotification.user_id == current_user.id)
    ).all()
    read_ids_set = set(read_ids)

    return [
        NotificationOut(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            created_at=n.created_at,
            is_read=(n.id in read_ids_set)
        )
        for n in notifications
    ]

@router.get("/me/unread-count", response_model=UnreadCount)
def get_unread_count(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    total_query = select(func.count(SystemNotification.id)).where(
        or_(
            col(SystemNotification.recipient_id).is_(None),
            SystemNotification.recipient_id == current_user.id
        )
    )
    total_count = session.exec(total_query).one()
    
    read_query = select(func.count(UserReadNotification.notification_id)).where(
        UserReadNotification.user_id == current_user.id
    )
    read_count = session.exec(read_query).one()
    
    unread = max(0, total_count - read_count)
    return UnreadCount(count=unread)

@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_as_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    notification = session.exec(
        select(SystemNotification).where(
            SystemNotification.id == notification_id,
            or_(
                col(SystemNotification.recipient_id).is_(None),
                SystemNotification.recipient_id == current_user.id
            )
        )
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Powiadomienie nie istnieje lub brak dostępu"
        )

    existing = session.exec(
        select(UserReadNotification)
        .where(UserReadNotification.user_id == current_user.id)
        .where(UserReadNotification.notification_id == notification_id)
    ).first()

    if not existing:
        new_entry = UserReadNotification(
            user_id=current_user.id,
            notification_id=notification_id
        )
        session.add(new_entry)
        session.commit()
    
    return None