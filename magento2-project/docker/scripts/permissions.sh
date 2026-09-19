#!/usr/bin/env bash
# ==============================================================================
# MageForge: Magento 2 Filesystem Permission Normalizer
# ==============================================================================
set -e

TARGET_DIR="${1:-/var/www/html}"
echo "==> Normalizing permissions for: ${TARGET_DIR}..."

if [ ! -d "${TARGET_DIR}" ]; then
    echo "Directory ${TARGET_DIR} does not exist. Skipping."
    exit 0
fi

cd "${TARGET_DIR}"

# 1. Ensure basic file/directory modes
find . -type d -exec chmod 755 {} +
find . -type f -exec chmod 644 {} +

# 2. Make bin/magento executable
if [ -f "bin/magento" ]; then
    chmod u+x bin/magento
fi

# 3. Ensure writable runtime directories
for dir in var generated pub/static pub/media app/etc; do
    if [ -d "$dir" ]; then
        chmod -R u+rwX,g+rwX "$dir"
    fi
done

echo "==> Permissions successfully normalized."
