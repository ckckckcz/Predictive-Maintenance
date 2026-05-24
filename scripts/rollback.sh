#!/bin/bash
# scripts/rollback.sh
# Rolls back traffic to the previous version by switching to the standby environment.

# Ensure script is run with root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)."
  exit 1
fi

NGINX_CONF="/etc/nginx/sites-available/greenfields"
HEALTH_CHECK_SCRIPT="$(dirname "$0")/health-check.sh"

if [ ! -f "$NGINX_CONF" ]; then
  echo "Error: Nginx configuration file not found at $NGINX_CONF"
  exit 1
fi

# Detect current active port from Nginx configuration
CURRENT_PORT=$(grep -E 'server[[:space:]]+127\.0\.0\.1:[0-9]+' "$NGINX_CONF" | grep -o -E '[0-9]+' | head -n 1)

if [ -z "$CURRENT_PORT" ]; then
  echo "Error: Could not detect current port from Nginx configuration."
  exit 1
fi

if [ "$CURRENT_PORT" = "8080" ]; then
  ACTIVE_COLOR="BLUE"
  ROLLBACK_COLOR="GREEN"
  ROLLBACK_PORT="8081"
  ROLLBACK_SERVICE="greenfields-green"
  ACTIVE_SERVICE="greenfields-blue"
elif [ "$CURRENT_PORT" = "8081" ]; then
  ACTIVE_COLOR="GREEN"
  ROLLBACK_COLOR="BLUE"
  ROLLBACK_PORT="8080"
  ROLLBACK_SERVICE="greenfields-blue"
  ACTIVE_SERVICE="greenfields-green"
else
  echo "Error: Unknown active port $CURRENT_PORT. Expected 8080 or 8081."
  exit 1
fi

echo "Initiating ROLLBACK from $ACTIVE_COLOR ($CURRENT_PORT) to stable $ROLLBACK_COLOR ($ROLLBACK_PORT)..."

# 1. Start the stable rollback service
echo "Starting rollback target service: $ROLLBACK_SERVICE..."
systemctl start "$ROLLBACK_SERVICE"
if [ $? -ne 0 ]; then
  echo "Error: Failed to start service $ROLLBACK_SERVICE"
  exit 1
fi

# 2. Perform health check on rollback service
echo "Verifying health of rollback target..."
bash "$HEALTH_CHECK_SCRIPT" "$ROLLBACK_PORT" 15
if [ $? -ne 0 ]; then
  echo "Error: Rollback target on port $ROLLBACK_PORT is unhealthy. Rollback aborted to protect active traffic."
  exit 1
fi

# 3. Perform atomic Nginx switch back
echo "Reverting Nginx upstream port from $CURRENT_PORT to $ROLLBACK_PORT..."
sed -i "s/127.0.0.1:$CURRENT_PORT/127.0.0.1:$ROLLBACK_PORT/g" "$NGINX_CONF"

# Verify Nginx configuration syntax
nginx -t
if [ $? -ne 0 ]; then
  echo "Error: Nginx configuration test failed. Reverting changes."
  sed -i "s/127.0.0.1:$ROLLBACK_PORT/127.0.0.1:$CURRENT_PORT/g" "$NGINX_CONF"
  exit 1
fi

# Reload Nginx config atomically
systemctl reload nginx
if [ $? -ne 0 ]; then
  echo "Error: Failed to reload Nginx. Reverting changes."
  sed -i "s/127.0.0.1:$ROLLBACK_PORT/127.0.0.1:$CURRENT_PORT/g" "$NGINX_CONF"
  systemctl reload nginx
  exit 1
fi

echo "Nginx successfully rolled back! Traffic is now routed to $ROLLBACK_COLOR ($ROLLBACK_PORT)."

# 4. Stop the buggy service
echo "Stopping the buggy service: $ACTIVE_SERVICE..."
systemctl stop "$ACTIVE_SERVICE"
echo "Rollback completed successfully!"
exit 0
