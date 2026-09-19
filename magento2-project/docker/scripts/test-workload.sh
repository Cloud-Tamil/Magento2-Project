#!/usr/bin/env bash
# ==============================================================================
# MageForge: Automated Temporary Workload & Performance Testing Suite
# Simulates realistic multi-user shopping traffic, search queries, cache hits,
# and gathers microservice metrics across Varnish, PHP, MySQL, Redis, & OpenSearch.
# ==============================================================================

set -euo pipefail

# Configuration Defaults (can be overridden via environment variables)
BASE_URL="${BASE_URL:-http://localhost}"
NGINX_URL="${NGINX_URL:-http://localhost:8080}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-50}"
CONCURRENCY="${CONCURRENCY:-5}"
SEARCH_TERMS=("shirt" "bag" "watch" "shoes" "pants" "jacket" "hoodie" "accessories")

# Text Formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}${BOLD}======================================================================${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}======================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# ------------------------------------------------------------------------------
# Phase 1: Pre-flight Health Verification
# ------------------------------------------------------------------------------
print_header "Phase 1: Pre-Flight Microservice Health Checks"

echo -n "Checking Storefront availability ($BASE_URL)... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BASE_URL/" || echo "000")

if [[ "$HTTP_CODE" =~ ^(200|301|302|503)$ ]]; then
    print_success "Storefront responded with HTTP $HTTP_CODE"
else
    print_warning "Storefront returned HTTP $HTTP_CODE (Stack may still be initializing or URL unreachable)"
fi

echo -n "Checking Direct Nginx endpoint ($NGINX_URL)... "
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$NGINX_URL/" || echo "000")
if [[ "$NGINX_CODE" =~ ^(200|301|302|503)$ ]]; then
    print_success "Nginx responded with HTTP $NGINX_CODE"
else
    print_warning "Nginx returned HTTP $NGINX_CODE"
fi

# ------------------------------------------------------------------------------
# Phase 2: Varnish Full-Page Cache (FPC) Latency Test
# ------------------------------------------------------------------------------
print_header "Phase 2: Varnish Cache Hit vs Miss Latency Benchmark"

print_info "Sending initial request to warm cache..."
curl -s -o /dev/null "$BASE_URL/" || true

print_info "Benchmarking 10 consecutive requests to measure cached response time..."
TOTAL_TIME=0
for i in {1..10}; do
    TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/")
    TOTAL_TIME=$(awk "BEGIN {print $TOTAL_TIME + $TIME}")
    echo -e "  Request $i: ${GREEN}${TIME}s${NC}"
done

AVG_TIME=$(awk "BEGIN {printf \"%.3f\", $TOTAL_TIME / 10}")
echo -e "\n${BOLD}Average Varnish Response Time:${NC} ${GREEN}${AVG_TIME}s${NC}"

# Inspect Varnish Headers
print_info "Inspecting HTTP caching headers on homepage:"
curl -s -I "$BASE_URL/" | grep -iE "(x-magento|age|x-cache|via|cache-control)" || true

# ------------------------------------------------------------------------------
# Phase 3: Synthetic OpenSearch Catalog Search Spike
# ------------------------------------------------------------------------------
print_header "Phase 3: Simulating Catalog Search Spike (OpenSearch Load)"

print_info "Dispatching concurrent product searches across terms: ${SEARCH_TERMS[*]}"

SEARCH_SUCCESS=0
SEARCH_TOTAL=0

for term in "${SEARCH_TERMS[@]}"; do
    SEARCH_URL="$BASE_URL/catalogsearch/result/?q=$term"
    SEARCH_TIME=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 8 "$SEARCH_URL" || echo "9.99")
    echo -e "  Search query [?q=${term}]: ${CYAN}${SEARCH_TIME}s${NC}"
    SEARCH_TOTAL=$((SEARCH_TOTAL + 1))
    if (( $(echo "$SEARCH_TIME < 5.0" | bc -l 2>/dev/null || echo 1) )); then
        SEARCH_SUCCESS=$((SEARCH_SUCCESS + 1))
    fi
done

print_success "Search queries executed: $SEARCH_SUCCESS / $SEARCH_TOTAL completed successfully."

# ------------------------------------------------------------------------------
# Phase 4: Multi-User Concurrent Session Simulation (Redis Session Load)
# ------------------------------------------------------------------------------
print_header "Phase 4: Concurrent Customer Session Simulation"

TEMP_COOKIE_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'mage_workload')
print_info "Simulating $CONCURRENCY unique shopping visitors with independent session cookies..."

for i in $(seq 1 "$CONCURRENCY"); do
    COOKIE_FILE="$TEMP_COOKIE_DIR/cookie_user_$i.txt"
    (
        # Step 1: Visit homepage
        curl -s -c "$COOKIE_FILE" -o /dev/null "$BASE_URL/"
        # Step 2: Browse catalog
        curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -o /dev/null "$BASE_URL/catalogsearch/result/?q=shirt"
        # Step 3: Hit customer section
        curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -o /dev/null "$BASE_URL/customer/account/login/"
    ) &
done

# Wait for all background requests to complete
wait
rm -rf "$TEMP_COOKIE_DIR"
print_success "Simulated $CONCURRENCY concurrent visitor journeys hitting Redis session storage."

# ------------------------------------------------------------------------------
# Phase 5: High-Frequency Load Generator
# ------------------------------------------------------------------------------
print_header "Phase 5: High-Frequency Request Burst ($TOTAL_REQUESTS Requests)"

print_info "Sending burst of $TOTAL_REQUESTS requests to storefront..."

START_TIME=$(date +%s)
SUCCESS_COUNT=0

for i in $(seq 1 "$TOTAL_REQUESTS"); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 4 "$BASE_URL/" || echo "000")
    if [[ "$CODE" =~ ^(200|301|302)$ ]]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
    if (( i % 10 == 0 )); then
        echo -n "."
    fi
done
echo ""

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
if [ "$DURATION" -eq 0 ]; then DURATION=1; fi
RPS=$((TOTAL_REQUESTS / DURATION))

print_success "Burst Completed: $SUCCESS_COUNT / $TOTAL_REQUESTS successful (approx $RPS req/sec)"

# ------------------------------------------------------------------------------
# Phase 6: Post-Workload Resource Diagnostic Summary
# ------------------------------------------------------------------------------
print_header "Phase 6: Microservice Post-Workload Health Summary"

if command -v docker &> /dev/null; then
    print_info "Querying Docker container states..."
    docker compose ps 2>/dev/null || true

    echo ""
    print_info "Checking Redis Session Database size:"
    docker compose exec redis-session redis-cli dbsize 2>/dev/null || echo "Redis session container query bypassed"

    print_info "Checking Redis Cache Memory:"
    docker compose exec redis-cache redis-cli info memory 2>/dev/null | grep -E "(used_memory_human|maxmemory_human)" || true

    print_info "Checking OpenSearch Cluster Health:"
    curl -s http://localhost:9200/_cluster/health 2>/dev/null || echo "OpenSearch query bypassed"
    echo ""
fi

print_header "Workload Test Completed Successfully"
echo -e "${GREEN}${BOLD}All synthetic user journeys, search queries, and cache tests finished!${NC}\n"
