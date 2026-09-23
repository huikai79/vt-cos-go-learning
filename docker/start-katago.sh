#!/bin/sh
set -eu
: "${VTCOS_KATAGO_ALLOWED_ORIGINS:?Set VTCOS_KATAGO_ALLOWED_ORIGINS to the exact HTTPS site origin(s).}"
export VTCOS_KATAGO_HOST="0.0.0.0"
export VTCOS_KATAGO_PORT="${PORT:-10000}"
exec node /app/katago-bridge.cjs
