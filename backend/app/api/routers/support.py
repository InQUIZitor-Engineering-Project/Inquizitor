from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_support_service, get_turnstile_service
from app.api.schemas.support import SupportTicketCreate
from app.application.services import SupportService, TurnstileService
from app.core.limiter import limiter
from app.core.security import get_optional_current_user
from app.db.models import User

router = APIRouter()

@router.post(
    "/contact",
    response_model=dict[str, str],
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("3/10minute")
async def create_support_ticket(
    request: Request,
    ticket_in: SupportTicketCreate,
    support_service: Annotated[SupportService, Depends(get_support_service)],
    turnstile_service: Annotated[TurnstileService, Depends(get_turnstile_service)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)],
) -> dict[str, str]:
    """
    Create a new support ticket.
    Verifies Turnstile token and optionally links to the current user.
    """
    if not await turnstile_service.verify_token(ticket_in.turnstile_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Błąd weryfikacji Turnstile. Spróbuj ponownie.",
        )

    try:
        support_service.create_ticket(
            email=ticket_in.email,
            subject=ticket_in.subject,
            message=ticket_in.message,
            category=ticket_in.category,
            first_name=ticket_in.first_name,
            last_name=ticket_in.last_name,
            user_id=current_user.id if current_user else None,
        )
        return {"message": "Dziękujemy za kontakt! Twoja wiadomość została wysłana."}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Wystąpił błąd podczas wysyłania wiadomości.",
        ) from exc

__all__ = ["router"]

