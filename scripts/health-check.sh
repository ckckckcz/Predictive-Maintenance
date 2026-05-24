#!/bin/bash
# scripts/health-check.sh
# Usage: ./health-check.sh [port] [retries]

PORT=${1:-8080}
RETRIES=${2:-10}
DELAY=2
HEALTH_URL="http://127.0.0.1:$PORT/health"

echo "Checking health of backend on port $PORT (URL: $HEALTH_URL)..."

for ((i=1; i<=RETRIES; i++)); do
  # Perform request
  RESPONSE=$(curl -s -f "$HEALTH_URL" 2>/dev/null)
  STATUS=$?
  
  if [ $STATUS -eq 0 ] && echo "$RESPONSE" | grep -q '"status":"ok"'; then
    echo "Success: Backend on port $PORT is healthy!"
    exit 0
  fi
  
  echo "Attempt $i/$RETRIES: Backend is not ready yet. Retrying in ${DELAY}s..."
  sleep $DELAY
done

echo "Error: Backend on port $PORT failed health check after $RETRIES attempts."
exit 1
