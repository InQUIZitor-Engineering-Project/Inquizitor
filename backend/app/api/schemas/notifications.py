from datetime import datetime
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    created_at: datetime
    is_read: bool

class UnreadCount(BaseModel):
    count: int

