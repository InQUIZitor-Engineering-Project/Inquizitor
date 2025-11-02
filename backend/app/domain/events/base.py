from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class DomainEvent:
    occurred_at: datetime


__all__ = ["DomainEvent"]

