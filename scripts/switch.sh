#!/bin/bash
# scripts/switch.sh
# Automates the atomic transition from active to standby env (Blue/Green)

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

# Detect current active port from Nginx configuration upstream block
CURRENT_PORT=$(grep -E 'server[[:space:]]+127\.0\.0\.1:[0-9]+' "$NGINX_CONF" | grep -o -E '[0-9]+' | head -n 1)

if [ -z "$CURRENT_PORT" ]; then
  echo "Error: Could not detect current port from Nginx configuration upstream block."
  exit 1
fi

echo "Current active port is: $CURRENT_PORT"

if [ "$CURRENT_PORT" = "8080" ]; then
  ACTIVE_COLOR="BLUE"
  STANDBY_COLOR="GREEN"
  STANDBY_PORT="8081"
  STANDBY_SERVICE="greenfields-green"
  ACTIVE_SERVICE="greenfields-blue"
elif [ "$CURRENT_PORT" = "8081" ]; then
  ACTIVE_COLOR="GREEN"
  STANDBY_COLOR="BLUE"
  STANDBY_PORT="8080"
  STANDBY_SERVICE="greenfields-blue"
  ACTIVE_SERVICE="greenfields-green"
else
  echo "Error: Unknown active port $CURRENT_PORT in Nginx configuration. Expected 8080 or 8081."
  exit 1
fi

echo "Targeting deployment switch: $ACTIVE_COLOR ($CURRENT_PORT) -> $STANDBY_COLOR ($STANDBY_PORT)"

# 1. Start standby service
echo "Starting standby service: $STANDBY_SERVICE..."
systemctl start "$STANDBY_SERVICE"
if [ $? -ne 0 ]; then
  echo "Error: Failed to start service $STANDBY_SERVICE"
  exit 1
fi

# 2. Perform health check on standby port
echo "Verifying standby service health..."
bash "$HEALTH_CHECK_SCRIPT" "$STANDBY_PORT" 15
if [ $? -ne 0 ]; then
  echo "Error: Standby service on port $STANDBY_PORT failed health check. Aborting switch."
  # Stop standby service since it's unhealthy
  systemctl stop "$STANDBY_SERVICE"
  exit 1
fi

# 3. Perform atomic Nginx switch
echo "Switching Nginx upstream port from $CURRENT_PORT to $STANDBY_PORT..."
sed -i "s/127.0.0.1:$CURRENT_PORT/127.0.0.1:$STANDBY_PORT/g" "$NGINX_CONF"

# Verify Nginx configuration syntax
nginx -t
if [ $? -ne 0 ]; then
  echo "Error: Nginx configuration test failed. Reverting changes."
  sed -i "s/127.0.0.1:$STANDBY_PORT/127.0.0.1:$CURRENT_PORT/g" "$NGINX_CONF"
  exit 1
fi

# Reload Nginx config atomically
systemctl reload nginx
if [ $? -ne 0 ]; then
  echo "Error: Failed to reload Nginx. Reverting changes."
  sed -i "s/127.0.0.1:$STANDBY_PORT/127.0.0.1:$CURRENT_PORT/g" "$NGINX_CONF"
  systemctl reload nginx
  exit 1
fi

echo "Nginx switched successfully. Traffic is now routed to $STANDBY_COLOR ($STANDBY_PORT)!"

# 4. Stop previous active service to free resource
echo "Stopping old active service: $ACTIVE_SERVICE..."
systemctl stop "$ACTIVE_SERVICE"

echo "Deployment switch completed successfully!"
exit 0
