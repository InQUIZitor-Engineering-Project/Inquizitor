#!/bin/bash

set -e

# Wait for database to be ready
# We use a simple python script to check connection if pg_isready is not available
echo "Waiting for database..."
python << END
import sys
import time
import psycopg2
from app.core.config import get_settings

settings = get_settings()
# Extract connection params from DATABASE_URL
# Format: postgresql+psycopg2://user:password@host:port/dbname
url = settings.DATABASE_URL
if url.startswith("postgresql+psycopg2://"):
    url = url.replace("postgresql+psycopg2://", "postgresql://")

start_time = time.time()
while True:
    try:
        conn = psycopg2.connect(url)
        conn.close()
        break
    except Exception as e:
        if time.time() - start_time > 30:
            print("Timeout waiting for database")
            sys.exit(1)
        time.sleep(1)
END

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Database is up - running migrations"
    alembic upgrade head
else
    echo "Skipping migrations (RUN_MIGRATIONS != true)"
fi

echo "Starting application..."
exec "$@"

