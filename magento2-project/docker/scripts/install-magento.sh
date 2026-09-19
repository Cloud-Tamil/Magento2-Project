#!/usr/bin/env bash
# ==============================================================================
# MageForge: Fully Automated Zero-Touch Magento 2 Installer
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAGENTO_ROOT="${MAGENTO_ROOT:-/var/www/html}"

cd "${MAGENTO_ROOT}"

echo "=========================================================================="
echo "    __  ___                  ______                    "
echo "   /  |/  /___ _____ ____   / ____/___  _________ ____ "
echo "  / /|_/ / __ \`/ __ \`/ _ \ / /_  / __ \/ ___/ __ \`/ _ \\"
echo " / /  / / /_/ / /_/ /  __// __/ / /_/ / /  / /_/ /  __/"
echo "/_/  /_/\__,_/\__, /\___//_/    \____/_/   \__, /\___/ "
echo "             /____/                       /____/       "
echo " Automated End-to-End Magento 2 Orchestrator"
echo "=========================================================================="

# Step 1: Wait for backend infrastructure to be fully ready
"${SCRIPT_DIR}/wait-for-services.sh"

# Step 2: Check if already installed
if [ -f "${MAGENTO_ROOT}/app/etc/env.php" ] && [ -f "${MAGENTO_ROOT}/.installed" ]; then
    echo "=========================================================================="
    echo " [MageForge] Existing Magento 2 installation detected!"
    echo " Running sanity upgrade and cache flush..."
    echo "=========================================================================="

    php bin/magento setup:upgrade --keep-generated
    php bin/magento cache:flush

    "${SCRIPT_DIR}/permissions.sh" "${MAGENTO_ROOT}"

    echo " [MageForge] Environment is up to date and ready for traffic."
    exit 0
fi

# Step 3: Check codebase presence or bootstrap via Composer
if [ ! -f "${MAGENTO_ROOT}/composer.json" ]; then
    echo "=========================================================================="
    echo " [MageForge] composer.json not found in ${MAGENTO_ROOT}"
    echo " Bootstrapping fresh Magento ${MAGENTO_VERSION:-2.4.7} project via Composer..."
    echo "=========================================================================="

    # Configure Composer Authentication for repo.magento.com
    if [ -n "${COMPOSER_MAGENTO_USERNAME}" ] && [ -n "${COMPOSER_MAGENTO_PASSWORD}" ]; then
        echo " Configuring Magento Marketplace credentials..."
        mkdir -p "${COMPOSER_HOME:-/var/www/.composer}"
        cat <<EOF > "${COMPOSER_HOME:-/var/www/.composer}/auth.json"
{
    "http-basic": {
        "repo.magento.com": {
            "username": "${COMPOSER_MAGENTO_USERNAME}",
            "password": "${COMPOSER_MAGENTO_PASSWORD}"
        }
    }
}
EOF
        cp "${COMPOSER_HOME:-/var/www/.composer}/auth.json" "${MAGENTO_ROOT}/auth.json" 2>/dev/null || true
    else
        echo "WARNING: COMPOSER_MAGENTO_USERNAME and COMPOSER_MAGENTO_PASSWORD not set."
        echo "Please provide free Adobe Commerce access keys in your .env file."
        echo "Get keys: https://marketplace.magento.com/ -> My Profile -> Access Keys"
    fi

    echo " Running composer create-project..."
    composer create-project \
        --repository-url=https://repo.magento.com/ \
        "magento/${MAGENTO_EDITION:-project-community-edition}:${MAGENTO_VERSION:-2.4.7}" \
        "${MAGENTO_ROOT}" \
        --no-install

    echo " Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Step 4: Execute Automated Magento Setup Install
echo "=========================================================================="
echo " [MageForge] Executing bin/magento setup:install..."
echo "=========================================================================="

php -d memory_limit=4G bin/magento setup:install \
    --base-url="${BASE_URL:-http://localhost/}" \
    --base-url-secure="${SECURE_BASE_URL:-https://localhost/}" \
    --use-secure=0 \
    --use-secure-admin=0 \
    --db-host="${MYSQL_HOST:-mysql}" \
    --db-name="${MYSQL_DATABASE:-magento}" \
    --db-user="${MYSQL_USER:-magento}" \
    --db-password="${MYSQL_PASSWORD:-magento_secret_pw}" \
    --admin-firstname="${ADMIN_FIRSTNAME:-Store}" \
    --admin-lastname="${ADMIN_LASTNAME:-Admin}" \
    --admin-email="${ADMIN_EMAIL:-admin@example.com}" \
    --admin-user="${ADMIN_USERNAME:-admin}" \
    --admin-password="${ADMIN_PASSWORD:-Admin12345Password!}" \
    --backend-frontname="${ADMIN_FRONTNAME:-admin_secure}" \
    --language=en_US \
    --currency=USD \
    --timezone=America/Chicago \
    --use-rewrites=1 \
    --search-engine="${SEARCH_ENGINE:-opensearch}" \
    --opensearch-host="${OPENSEARCH_HOST:-opensearch}" \
    --opensearch-port="${OPENSEARCH_PORT:-9200}" \
    --opensearch-index-prefix="${OPENSEARCH_INDEX_PREFIX:-magento2}" \
    --opensearch-enable-auth="${OPENSEARCH_ENABLE_AUTH:-0}" \
    --opensearch-username="${OPENSEARCH_USERNAME:-admin}" \
    --opensearch-password="${OPENSEARCH_PASSWORD:-admin}" \
    --opensearch-timeout=15 \
    --session-save=redis \
    --session-save-redis-host="${REDIS_SESSION_HOST:-redis-session}" \
    --session-save-redis-port="${REDIS_SESSION_PORT:-6379}" \
    --session-save-redis-db="${REDIS_SESSION_DB:-2}" \
    --session-save-redis-max-concurrency=20 \
    --page-cache=redis \
    --page-cache-redis-server="${REDIS_PAGE_CACHE_HOST:-redis-cache}" \
    --page-cache-redis-port="${REDIS_PAGE_CACHE_PORT:-6379}" \
    --page-cache-redis-db="${REDIS_PAGE_CACHE_DB:-1}" \
    --cache-backend=redis \
    --cache-backend-redis-server="${REDIS_CACHE_HOST:-redis-cache}" \
    --cache-backend-redis-port="${REDIS_CACHE_PORT:-6379}" \
    --cache-backend-redis-db="${REDIS_CACHE_DB:-0}" \
    --amqp-host="${RABBITMQ_HOST:-rabbitmq}" \
    --amqp-port="${RABBITMQ_PORT:-5672}" \
    --amqp-user="${RABBITMQ_USER:-magento}" \
    --amqp-password="${RABBITMQ_PASSWORD:-rabbit_secret_pw}" \
    --amqp-virtualhost="${RABBITMQ_VHOST:-/}" \
    --cleanup-database \
    --no-interaction

# Step 5: Configure Magento Mode (developer vs production)
TARGET_MODE="${MAGENTO_MODE:-developer}"
echo "=========================================================================="
echo " [MageForge] Setting Magento deployment mode to: ${TARGET_MODE}..."
echo "=========================================================================="
php bin/magento deploy:mode:set "${TARGET_MODE}" -s

# Step 6: Compilation & Static Content Deployment
echo "=========================================================================="
echo " [MageForge] Compiling Dependency Injection (DI)..."
echo "=========================================================================="
php -d memory_limit=4G bin/magento setup:di:compile

echo "=========================================================================="
echo " [MageForge] Deploying Static View Content..."
echo "=========================================================================="
php -d memory_limit=4G bin/magento setup:static-content:deploy -f en_US

# Step 7: Configure Varnish Full Page Cache backend in DB
echo "=========================================================================="
echo " [MageForge] Configuring Full Page Cache (Varnish)..."
echo "=========================================================================="
php bin/magento config:set system/full_page_cache/caching_application 2 || true

# Step 8: Reindex & Flush Caches
echo "=========================================================================="
echo " [MageForge] Reindexing catalog & flushing caches..."
echo "=========================================================================="
php bin/magento indexer:reindex
php bin/magento cache:flush

# Step 9: Fix Permissions
"${SCRIPT_DIR}/permissions.sh" "${MAGENTO_ROOT}"

# Step 10: Create lockfile
date -u +"%Y-%m-%dT%H:%M:%SZ" > "${MAGENTO_ROOT}/.installed"

echo "=========================================================================="
echo "   🎉 SUCCESS: Magento 2 Installation Successfully Completed! 🎉         "
echo "=========================================================================="
echo " Frontend URL:     ${BASE_URL:-http://localhost/}"
echo " Admin Panel:      ${BASE_URL:-http://localhost/}${ADMIN_FRONTNAME:-admin_secure}"
echo " Admin Username:   ${ADMIN_USERNAME:-admin}"
echo " Admin Password:   ${ADMIN_PASSWORD:-Admin12345Password!}"
echo " OpenSearch:       http://localhost:9200"
echo " RabbitMQ Mgmt:    http://localhost:15672"
echo " Mailpit Web UI:   http://localhost:8025"
echo "=========================================================================="
