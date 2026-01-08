from __future__ import annotations

import mimetypes
import uuid
from collections.abc import Iterator
from contextlib import contextmanager, suppress
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urlparse

import boto3
from botocore.config import Config

from app.domain.services import FileStorage


class R2FileStorage(FileStorage):
    """S3-compatible storage adapter for Cloudflare R2."""

    def __init__(
        self,
        *,
        bucket: str,
        access_key_id: str,
        secret_access_key: str,
        endpoint_url: str,
        region: str = "auto",
        base_prefix: str = "uploads",
        public_base_url: str | None = None,
        presign_expiration: int = 3600,
    ) -> None:
        self._bucket = bucket
        self._base_prefix = base_prefix.strip("/ ")
        self._public_base_url = public_base_url.rstrip("/") if public_base_url else None
        self._presign_expiration = presign_expiration

        # Validate endpoint: must NOT contain bucket in the path
        # (common R2 gotcha that breaks signatures/CORS)
        parsed = urlparse(endpoint_url)
        if parsed.path and parsed.path != "/":
            raise ValueError(
                "R2_ENDPOINT_URL must NOT include bucket in the path "
                f"(got path='{parsed.path}'). Use e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
            )
        safe_endpoint = endpoint_url.rstrip("/")

        self._client = boto3.client(
            "s3",
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            endpoint_url=safe_endpoint,
            region_name=region,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        )

    def _build_key(self, filename: str) -> str:
        extension = Path(filename).suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{extension}"
        if self._base_prefix:
            return f"{self._base_prefix}/{unique_name}"
        return unique_name

    def save(self, *, owner_id: int, filename: str, content: bytes) -> str:
        key = self._build_key(filename)
        content_type, _ = mimetypes.guess_type(filename)
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=content,
            Metadata={"owner_id": str(owner_id)},
            **extra_args,
        )
        return key

    def delete(self, *, stored_path: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=stored_path)

    def get_url(self, *, stored_path: str) -> str:
        if self._public_base_url:
            return f"{self._public_base_url}/{stored_path}"
        # Return API download path to keep downloads same-origin and avoid CORS issues.
        return f"/files/exports/{stored_path}"

    @contextmanager
    def download_to_temp(self, *, stored_path: str) -> Iterator[Path]:
        obj = self._client.get_object(Bucket=self._bucket, Key=stored_path)
        with NamedTemporaryFile(delete=False) as tmp:
            tmp.write(obj["Body"].read())
            tmp.flush()
            tmp_path = Path(tmp.name)
        try:
            yield tmp_path
        finally:
            with suppress(Exception):
                tmp_path.unlink(missing_ok=True)


__all__ = ["R2FileStorage"]

