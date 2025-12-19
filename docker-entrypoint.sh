#!/bin/sh
set -e

# Default values
API_BASE_URL=${API_BASE_URL:-/api}

# Generate runtime config
echo "window.__APP_CONFIG__={API_BASE_URL:\"${API_BASE_URL}\"};" > /usr/share/nginx/html/config.js

echo "Starting nginx with API_BASE_URL=${API_BASE_URL}"

# Start nginx
exec nginx -g "daemon off;"
