#!/usr/bin/env bash
# ==============================================================================
# MageForge: Robust Multi-Service Dependency Readiness Checker
# ==============================================================================
set -e

TIMEOUT=${WAIT_TIMEOUT:-120}

echo "============================================================"
echo " [MageForge] Checking dependency services availability..."
echo "============================================================"

# 1. Wait for MySQL / MariaDB
echo -n "==> Waiting for MySQL at ${MYSQL_HOST:-mysql}:${MYSQL_PORT:-3306}..."
count=0
until nc -z -v -w5 "${MYSQL_HOST:-mysql}" "${MYSQL_PORT:-3306}" 2>/dev/null; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then
        echo " FAILED (Timeout waiting for MySQL)"
        exit 1
    fi
    echo -n "."
    sleep 2
done

# Perform query readiness check
until mysqladmin ping -h"${MYSQL_HOST:-mysql}" -P"${MYSQL_PORT:-3306}" -u"${MYSQL_USER:-magento}" -p"${MYSQL_PASSWORD:-magento_secret_pw}" --silent; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then
        echo " FAILED (MySQL listening but ping rejected)"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo " READY!"

# 2. Wait for OpenSearch
echo -n "==> Waiting for OpenSearch at ${OPENSEARCH_HOST:-opensearch}:${OPENSEARCH_PORT:-9200}..."
count=0
until curl -s "http://${OPENSEARCH_HOST:-opensearch}:${OPENSEARCH_PORT:-9200}/_cluster/health?wait_for_status=yellow&timeout=5s" | grep -q '"status":"\(yellow\|green\)"'; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then
        echo " FAILED (Timeout waiting for OpenSearch cluster health)"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo " READY!"

# 3. Wait for Redis Cache
echo -n "==> Waiting for Redis Cache at ${REDIS_CACHE_HOST:-redis-cache}:${REDIS_CACHE_PORT:-6379}..."
count=0
until nc -z -v -w5 "${REDIS_CACHE_HOST:-redis-cache}" "${REDIS_CACHE_PORT:-6379}" 2>/dev/null; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then
        echo " FAILED (Timeout waiting for Redis Cache)"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo " READY!"

# 4. Wait for Redis Session
echo -n "==> Waiting for Redis Session at ${REDIS_SESSION_HOST:-redis-session}:${REDIS_SESSION_PORT:-6379}..."
count=0
until nc -z -v -w5 "${REDIS_SESSION_HOST:-redis-session}" "${REDIS_SESSION_PORT:-6379}" 2>/dev/null; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then
        echo " FAILED (Timeout waiting for Redis Session)"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo " READY!"

# 5. Wait for RabbitMQ
echo -n "==> Waiting for RabbitMQ at ${RABBITMQ_HOST:-rabbitmq}:${RABBITMQ_PORT:-5672}..."
count=0
until nc -z -v -w5 "${RABBITMQ_HOST:-rabbitmq}" "${RABBITMQ_PORT:-5672}" 2>/dev/null; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then
        echo " FAILED (Timeout waiting for RabbitMQ)"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo " READY!"

echo "============================================================"
echo " [MageForge] All dependent infrastructure services are ONLINE."
echo "============================================================"
