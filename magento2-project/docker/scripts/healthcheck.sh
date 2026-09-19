#!/usr/bin/env bash
# ==============================================================================
# MageForge: Comprehensive Container Healthcheck
# ==============================================================================
set -e

# Check 1: PHP-FPM fastcgi ping (if inside php-fpm container)
if command -v cgi-fcgi >/dev/null 2>&1; then
    SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET \
    cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1
fi

# Check 2: Verify MySQL connectivity from PHP
if [ -f "/var/www/html/bin/magento" ]; then
    /usr/local/bin/php -r '
    $host = getenv("MYSQL_HOST") ?: "mysql";
    $port = getenv("MYSQL_PORT") ?: 3306;
    $user = getenv("MYSQL_USER") ?: "magento";
    $pass = getenv("MYSQL_PASSWORD") ?: "magento_secret_pw";
    $db   = getenv("MYSQL_DATABASE") ?: "magento";
    try {
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass, [PDO::ATTR_TIMEOUT => 5]);
        exit(0);
    } catch (Exception $e) {
        exit(1);
    }
    ' || exit 1
fi

exit 0
