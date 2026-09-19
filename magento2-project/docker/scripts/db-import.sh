#!/usr/bin/env bash
# ==============================================================================
# MageForge: Database Import and Sanitation Utility
# Usage: ./docker/scripts/db-import.sh /path/to/dump.sql.gz
# ==============================================================================
set -e

DUMP_FILE="$1"
DB_HOST="${MYSQL_HOST:-mysql}"
DB_USER="${MYSQL_USER:-magento}"
DB_PASS="${MYSQL_PASSWORD:-magento_secret_pw}"
DB_NAME="${MYSQL_DATABASE:-magento}"
BASE_URL="${BASE_URL:-http://localhost/}"

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
    echo "Error: Please specify a valid SQL or .sql.gz dump file."
    echo "Usage: $0 <path_to_dump.sql or path_to_dump.sql.gz>"
    exit 1
fi

echo "==> Importing database dump into ${DB_NAME} on ${DB_HOST}..."

if [[ "$DUMP_FILE" == *.gz ]]; then
    gunzip < "$DUMP_FILE" | mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"
else
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$DUMP_FILE"
fi

echo "==> Updating core_config_data base URLs to: ${BASE_URL}..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
UPDATE core_config_data SET value = '${BASE_URL}' WHERE path IN ('web/unsecure/base_url', 'web/secure/base_url');
UPDATE core_config_data SET value = '0' WHERE path IN ('web/secure/use_in_frontend', 'web/secure/use_in_adminhtml');
EOF

echo "==> Database imported and base URLs updated successfully."
