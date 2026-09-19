#!/usr/bin/env bash
# ==============================================================================
# MageForge: Container Entrypoint Wrapper
# ==============================================================================
set -e

# If automated installation was requested as the command
if [ "$1" = "auto-install" ]; then
    exec /var/www/scripts/install-magento.sh
fi

exec "$@"
