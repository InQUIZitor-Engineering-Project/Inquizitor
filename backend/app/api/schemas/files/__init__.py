from pydantic import BaseModel


class FileExistsResponse(BaseModel):
    exists: bool
    file_id: int | None = None
    filename: str | None = None


__all__ = ["FileExistsResponse"]
