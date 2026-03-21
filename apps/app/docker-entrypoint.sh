#!/bin/sh
set -e

# Check if node_modules exists and has content
if [ ! -d "node_modules" ] || [ ! "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "📦 node_modules is missing or empty, installing dependencies..."
  npm ci
# Check if package.json or package-lock.json is newer than node_modules
elif [ "package.json" -nt "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
  echo "📦 package.json or package-lock.json changed, updating dependencies..."
  npm ci
else
  echo "✓ Dependencies are up to date"
fi

# Execute the command passed to the entrypoint
exec "$@"

