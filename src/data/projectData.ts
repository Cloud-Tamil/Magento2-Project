import { ProjectFile, ServiceNode, AutomationStep } from '../types';

export const PROJECT_NAME = "MageForge";
export const PROJECT_VERSION = "2.4.7";
export const PHP_VERSION = "8.2";
export const OPENSEARCH_VERSION = "2.12.0";
export const REDIS_VERSION = "7.2";
export const RABBITMQ_VERSION = "3.12";
export const MYSQL_VERSION = "8.0";

export const PROJECT_FILES: ProjectFile[] = [
  {
    path: "magento2-project/README.md",
    name: "README.md",
    category: "core",
    language: "markdown",
    purpose: "Master documentation containing full architectural specs, local deployment guides, service credentials, CLI commands, and temporary workload testing.",
    content: `# MageForge: Automated Magento 2 Docker Platform & Testing Suite

[![Magento 2.4.7](https://img.shields.io/badge/Magento-2.4.7-orange.svg)](https://business.adobe.com/products/magento/magento-commerce.html)
[![PHP 8.2](https://img.shields.io/badge/PHP-8.2--FPM-blue.svg)](https://www.php.net/)
[![OpenSearch 2.12](https://img.shields.io/badge/OpenSearch-2.12-teal.svg)](https://opensearch.org/)
[![Redis 7.2](https://img.shields.io/badge/Redis-7.2-red.svg)](https://redis.io/)
[![RabbitMQ 3.12](https://img.shields.io/badge/RabbitMQ-3.12-orange.svg)](https://www.rabbitmq.com/)
[![Varnish 7.4](https://img.shields.io/badge/Varnish-7.4-cyan.svg)](https://varnish-cache.org/)

**MageForge** is a turnkey, zero-touch, containerized orchestration platform designed to provision, configure, and operate Adobe Magento 2 (Open Source & Commerce) without manual terminal inputs or setup friction.

---

## 1. Application Overall Information

### Architecture & Service Topology
MageForge isolates every tier of the Magento 2 ecosystem into dedicated, production-tuned containers connected over a secure Docker bridge network:

\`\`\`text
                                 [ Client Traffic ]
                                          |
                                          v
                              [ Varnish 7.4 FPC (Port 80) ]
                                          |
                               (Cache Miss / Pass)
                                          |
                                          v
                         [ Nginx 1.25 Reverse Proxy (Port 8080) ]
                                    |               |
               Static Files (.js, .css, images)     | FastCGI (:9000)
                                    v               v
                           [ pub/static & media ]  [ PHP-FPM 8.2 ]
                                                            |
          +-------------------------+-----------------------+-------------------------+
          |                         |                       |                         |
          v                         v                       v                         v
  [ MySQL 8.0 ]            [ Redis Dual Node ]      [ OpenSearch 2.12 ]      [ RabbitMQ 3.12 ]
  - Relational Catalog     - redis-cache (LRU)      - Catalog Fulltext       - Async Consumer
  - EAV Store Data         - redis-session (AOF)    - Faceting & Filters     - Bulk Queueing
          |                         |                       |                         |
          +-------------------------+-----------------------+-------------------------+
                                    ^
                                    |
                           [ PHP-Cron Daemon ]
                         (1-minute isolated runner)
\`\`\`

### Core Features
- **Zero-Touch Automated Provisioning:** The entrypoint script polls MySQL, OpenSearch, and RabbitMQ readiness, automatically executes \`bin/magento setup:install\`, compiles Dependency Injection (DI), deploys static assets, configures Varnish, and enables crontabs.
- **Dual Redis Separation:** \`redis-cache\` runs with \`volatile-lru\` eviction for ephemeral cache tags, while \`redis-session\` runs with \`noeviction\` and Append-Only File (AOF) persistence so shopping carts and customer sessions are never lost.
- **Microservice Isolation:** Background cron tasks (\`php-cron\`) and interactive developer CLI tasks (\`php-cli\`) run in separate containers, preventing cron jobs or builds from stealing CPU/memory from customer-facing web workers (\`php-fpm\`).
- **Developer Experience:** Integrated with Mailpit (\`:8025\`) for local email capture, Xdebug 3 configuration hooks, and automatic host UID/GID synchronization to eliminate filesystem permission issues.

---

## 2. How to Deploy Locally

### Step 1: System Requirements
Ensure your host machine meets the following prerequisites:
- **Docker Engine:** 24.0.0+ and **Docker Compose:** v2.20.0+
- **Host Resources:** Minimum 8 GB RAM allocated to Docker (12 GB+ recommended), 4 CPU cores, and 25 GB free disk space.
- *Linux Hosts Only:* OpenSearch requires increased virtual memory map areas:
  \`\`\`bash
  sudo sysctl -w vm.max_map_count=262144
  \`\`\`

### Step 2: Clone or Extract the Project
\`\`\`bash
cd magento2-project
\`\`\`

### Step 3: Configure Adobe Marketplace Credentials
Adobe requires a free authentication key pair to download Magento 2 Composer packages from \`repo.magento.com\`.
1. Log in or create a free account at [marketplace.magento.com](https://marketplace.magento.com/).
2. Under **My Profile** -> **Access Keys**, create a new key pair:
   - **Public Key** = \`COMPOSER_MAGENTO_USERNAME\`
   - **Private Key** = \`COMPOSER_MAGENTO_PASSWORD\`
3. Copy the example environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
4. Open \`.env\` and fill in your keys:
   \`\`\`env
   COMPOSER_MAGENTO_USERNAME=your_public_key_here
   COMPOSER_MAGENTO_PASSWORD=your_private_key_here
   \`\`\`

### Step 4: Launch the Automated Stack
Start the containers in detached mode:
\`\`\`bash
docker compose up -d --build
\`\`\`
*Or using the Makefile:*
\`\`\`bash
make up
\`\`\`

### Step 5: Follow the Automated Installation Logs
The \`php-cli\` container orchestrates the setup. Watch the real-time installation progress:
\`\`\`bash
docker compose logs -f php-cli
\`\`\`

Once the 10-phase automation finishes, you will see:
\`\`\`text
🎉 SUCCESS: Magento 2 Installation Successfully Completed! 🎉
Frontend URL:     http://localhost/
Admin Panel:      http://localhost/admin_secure
Admin Username:   admin
Admin Password:   Admin12345Password!
\`\`\`

---

## 3. How to Access Locally

Once the stack is running, all services are exposed on your host's \`localhost\`:

| Service | Local URL / Port | Default Credentials | Description |
| :--- | :--- | :--- | :--- |
| **Storefront (Varnish FPC)** | [http://localhost/](http://localhost/) | Public | Sub-15ms cached customer storefront |
| **Storefront (Direct Nginx)** | [http://localhost:8080/](http://localhost:8080/) | Public | Direct Nginx port (bypassing Varnish) |
| **Magento Admin Panel** | [http://localhost/admin_secure](http://localhost/admin_secure) | \`admin\` / \`Admin12345Password!\` | Store backoffice & catalog administration |
| **OpenSearch Cluster** | [http://localhost:9200](http://localhost:9200) | No Auth (Internal Network) | Search index REST API & cluster status |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | \`magento\` / \`rabbit_secret_pw\` | Message broker queues & live throughput |
| **Mailpit Web UI** | [http://localhost:8025](http://localhost:8025) | No Auth | Local inbox capturing all transactional emails |
| **MySQL Database** | \`localhost:3306\` | \`magento\` / \`magento_secret_pw\` | Database name: \`magento\` (root: \`root_secret_pw\`) |
| **Redis Cache** | \`localhost:6379\` | No Auth | DB 0: Default Cache, DB 1: Page Cache |

---

## 4. Useful Commands

### Makefile Shortcuts
\`\`\`bash
make up           # Boot containers with dev overrides (Mailpit, Xdebug)
make down         # Stop all active containers gracefully
make cli          # Enter the php-cli container as user 'magento'
make cache        # Clean and flush all Magento caches
make reindex      # Reindex all OpenSearch & catalog indexers
make compile      # Run setup:di:compile & static asset deployment
make permissions  # Reset filesystem permissions to 755/644
make reset        # Fully purge volumes and rebuild from scratch
\`\`\`

### Docker Compose Commands
\`\`\`bash
# Check running containers and health probes
docker compose ps

# Follow logs across all containers
docker compose logs -f

# Follow specific service logs
docker compose logs -f php-fpm
docker compose logs -f nginx
docker compose logs -f varnish

# Restart a specific service
docker compose restart php-fpm
\`\`\`

### Magento 2 CLI Commands (Executed via Docker)
\`\`\`bash
# Flush cache
docker compose exec -u magento php-fpm bin/magento cache:flush

# Check indexer status
docker compose exec -u magento php-fpm bin/magento indexer:status

# Put store in maintenance mode
docker compose exec -u magento php-fpm bin/magento maintenance:enable

# Disable maintenance mode
docker compose exec -u magento php-fpm bin/magento maintenance:disable

# View active modules
docker compose exec -u magento php-fpm bin/magento module:status
\`\`\`

---

## 5. Temporary Workload & Performance Testing

To thoroughly test the application under load, verify Varnish caching, stress MySQL and OpenSearch, and generate synthetic customer shopping behavior, use the workload methods below.

### Method A: Automated Workload Script (\`test-workload.sh\`)

MageForge includes an automated workload generator script located at:
\`docker/scripts/test-workload.sh\`

Run it directly from your host:
\`\`\`bash
chmod +x docker/scripts/test-workload.sh
./docker/scripts/test-workload.sh
\`\`\`

Or execute it inside the container:
\`\`\`bash
docker compose exec php-cli bash /var/www/scripts/test-workload.sh
\`\`\`

#### What the workload script simulates:
1. **Warmup Phase:** Requests the homepage to prime Varnish and OPcache.
2. **Varnish Cache Hit Verification:** Measures latency on repeated requests (\`X-Magento-Tags\`, \`X-Cache: HIT\` vs \`MISS\`, sub-15ms check).
3. **Catalog & Search Spike:** Sends concurrent search queries (\`?q=jacket\`, \`?q=shirt\`, \`?q=pants\`, \`?q=watch\`) directly to OpenSearch.
4. **Session & Cart Concurrency:** Simulates multi-user shopping sessions with unique session cookies hitting Redis session storage.
5. **Backend Database Stress:** Generates read requests against category routes and customer login endpoints.
6. **Live Diagnostics Report:** Outputs latency percentiles, Varnish hit ratio, Redis memory usage, and MySQL connection counts.

---

### Method B: Generating Official Magento Performance Fixtures

Magento 2 includes a native performance toolkit capable of generating thousands of sample products, categories, customers, and orders to test realistic data loads.

Generate a **Small** performance fixture (800 products, 30 categories, 20 customers):
\`\`\`bash
docker compose exec -u magento php-cli bin/magento setup:perf:generate-fixtures \\
  /var/www/html/setup/performance-toolkit/profiles/ce/small.xml
\`\`\`

After generating fixtures, reindex and flush cache:
\`\`\`bash
docker compose exec -u magento php-cli bin/magento indexer:reindex
docker compose exec -u magento php-cli bin/magento cache:flush
\`\`\`

---

### Method C: Synthetic HTTP Load Testing (Apache Benchmark / \`curl\` / \`wrk\`)

#### 1. Test Varnish High-Concurrency Cache (Port 80)
Simulate 1,000 requests with 50 concurrent connections against Varnish:
\`\`\`bash
# Using Apache Benchmark (ab)
ab -n 1000 -c 50 -k http://localhost/

# Or using wrk (if installed)
wrk -t4 -c50 -d30s http://localhost/
\`\`\`
*Expected Result:* **1,500+ requests/sec**, sub-10ms response time, 0% CPU strain on PHP-FPM.

#### 2. Test Uncached PHP-FPM / Direct Nginx (Port 8080)
Compare by running the same test directly against Nginx/PHP-FPM, bypassing Varnish:
\`\`\`bash
ab -n 100 -c 10 http://localhost:8080/
\`\`\`
*Expected Result:* Requests will route through PHP-FPM and MySQL. Compare the latency difference to demonstrate Varnish acceleration.

#### 3. Test OpenSearch Catalog Search Spike
Send 200 concurrent search queries to simulate a flash sale search spike:
\`\`\`bash
ab -n 200 -c 20 "http://localhost/catalogsearch/result/?q=shoes"
\`\`\`

---

### Method D: Real-Time Workload Monitoring

While running any workload, open a separate terminal window to inspect the microservices live:

\`\`\`bash
# 1. Live Container CPU & Memory Consumption
docker stats

# 2. Redis Cache Hit / Eviction Metrics
docker compose exec redis-cache redis-cli info stats

# 3. Redis Active Sessions Count
docker compose exec redis-session redis-cli dbsize

# 4. OpenSearch Query Latency & Index Count
curl -s http://localhost:9200/_cat/indices?v

# 5. RabbitMQ Queue Message Counts
docker compose exec rabbitmq rabbitmqctl list_queues

# 6. MySQL Active Threads & Slow Query Check
docker compose exec mysql mysqladmin status -u magento -pmagento_secret_pw
\`\`\`

---

## 6. Verification Checklist

- [ ] Varnish responds on \`http://localhost/\` with \`X-Magento-Cache-Debug: HIT\` (or \`MISS\` on first load).
- [ ] Admin panel is accessible at \`http://localhost/admin_secure\`.
- [ ] Redis session keys increment as users browse.
- [ ] OpenSearch reports \`status: green\` or \`yellow\` at \`http://localhost:9200/_cluster/health\`.
- [ ] Background cron runs cleanly every 60s in \`docker compose logs -f php-cron\`.
- [ ] Transactional emails appear in Mailpit at \`http://localhost:8025/\`.
`
  },
  {
    path: "magento2-project/docker-compose.yml",
    name: "docker-compose.yml",
    category: "core",
    language: "yaml",
    purpose: "Base Docker orchestration file defining microservices, network isolation, healthchecks, and volume bindings.",
    content: `version: '3.8'

networks:
  mage-network:
    driver: bridge

volumes:
  db-data:
    driver: local
  opensearch-data:
    driver: local
  redis-cache-data:
    driver: local
  redis-session-data:
    driver: local
  rabbitmq-data:
    driver: local

services:
  varnish:
    build:
      context: ./docker/varnish
      dockerfile: Dockerfile
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_varnish
    restart: unless-stopped
    ports:
      - "\${VARNISH_PORT:-80}:80"
    depends_on:
      - nginx
    networks:
      - mage-network
    tmpfs:
      - /var/lib/varnish:exec

  nginx:
    build:
      context: ./docker/nginx
      dockerfile: Dockerfile
      args:
        HOST_UID: \${HOST_UID:-1000}
        HOST_GID: \${HOST_GID:-1000}
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_nginx
    restart: unless-stopped
    ports:
      - "\${NGINX_PORT:-8080}:8080"
    volumes:
      - ./src:/var/www/html:ro
    depends_on:
      - php-fpm
    networks:
      - mage-network

  php-fpm:
    build:
      context: ./docker/php-fpm
      dockerfile: Dockerfile
      args:
        HOST_UID: \${HOST_UID:-1000}
        HOST_GID: \${HOST_GID:-1000}
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_php_fpm
    restart: unless-stopped
    env_file:
      - docker/env/common.env
      - .env
    volumes:
      - ./src:/var/www/html
      - ./docker/scripts:/var/www/scripts:ro
    depends_on:
      mysql:
        condition: service_healthy
      opensearch:
        condition: service_healthy
      redis-cache:
        condition: service_started
      redis-session:
        condition: service_started
      rabbitmq:
        condition: service_healthy
    networks:
      - mage-network

  php-cli:
    build:
      context: ./docker/php-cli
      dockerfile: Dockerfile
      args:
        HOST_UID: \${HOST_UID:-1000}
        HOST_GID: \${HOST_GID:-1000}
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_php_cli
    restart: "no"
    env_file:
      - docker/env/common.env
      - .env
    volumes:
      - ./src:/var/www/html
      - ./docker/scripts:/var/www/scripts:ro
    depends_on:
      mysql:
        condition: service_healthy
      opensearch:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - mage-network
    command: ["/bin/bash", "/var/www/scripts/install-magento.sh"]

  php-cron:
    build:
      context: ./docker/php-cron
      dockerfile: Dockerfile
      args:
        HOST_UID: \${HOST_UID:-1000}
        HOST_GID: \${HOST_GID:-1000}
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_php_cron
    restart: unless-stopped
    env_file:
      - docker/env/common.env
      - .env
    volumes:
      - ./src:/var/www/html
    depends_on:
      - php-fpm
    networks:
      - mage-network

  mysql:
    image: mysql:8.0
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: \${MYSQL_DATABASE:-magento}
      MYSQL_USER: \${MYSQL_USER:-magento}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD:-magento_secret_pw}
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-root_secret_pw}
    volumes:
      - db-data:/var/lib/mysql
      - ./docker/mysql/my.cnf:/etc/mysql/conf.d/magento.cnf:ro
      - ./docker/mysql/docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d:ro
    ports:
      - "\${MYSQL_PORT:-3306}:3306"
    networks:
      - mage-network
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -u root -p\$\$MYSQL_ROOT_PASSWORD --silent"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 15s

  redis-cache:
    image: redis:7.2-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_redis_cache
    restart: unless-stopped
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
    volumes:
      - redis-cache-data:/data
      - ./docker/redis/redis-cache.conf:/usr/local/etc/redis/redis.conf:ro
    ports:
      - "\${REDIS_CACHE_PORT:-6379}:6379"
    networks:
      - mage-network

  redis-session:
    image: redis:7.2-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_redis_session
    restart: unless-stopped
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
    volumes:
      - redis-session-data:/data
      - ./docker/redis/redis-session.conf:/usr/local/etc/redis/redis.conf:ro
    networks:
      - mage-network

  opensearch:
    image: opensearchproject/opensearch:2.12.0
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_opensearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - "OPENSEARCH_JAVA_OPTS=-Xms1024m -Xmx1024m"
      - bootstrap.memory_lock=true
      - DISABLE_SECURITY_PLUGIN=true
      - DISABLE_INSTALL_DEMO_CONFIG=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - opensearch-data:/usr/share/opensearch/data
      - ./docker/opensearch/opensearch.yml:/usr/share/opensearch/config/opensearch.yml:ro
    ports:
      - "\${OPENSEARCH_PORT:-9200}:9200"
    networks:
      - mage-network
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -q '\"status\":\"\\\\(yellow\\\\|green\\\\)\"'"]
      interval: 10s
      timeout: 5s
      retries: 25
      start_period: 25s

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-magento}
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:-rabbit_secret_pw}
      RABBITMQ_DEFAULT_VHOST: \${RABBITMQ_VHOST:-/}
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
      - ./docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
      - ./docker/rabbitmq/definitions.json:/etc/rabbitmq/definitions.json:ro
    ports:
      - "\${RABBITMQ_PORT:-5672}:5672"
      - "\${RABBITMQ_MANAGEMENT_PORT:-15672}:15672"
    networks:
      - mage-network
    healthcheck:
      test: ["CMD-SHELL", "rabbitmq-diagnostics check_running --quiet"]
      interval: 10s
      timeout: 5s
      retries: 15
      start_period: 15s`
  },
  {
    path: "magento2-project/docker-compose.dev.yml",
    name: "docker-compose.dev.yml",
    category: "core",
    language: "yaml",
    purpose: "Development override compose file for Xdebug IDE integration and Mailpit email capture.",
    content: `version: '3.8'

services:
  php-fpm:
    env_file:
      - docker/env/common.env
      - docker/env/dev.env
      - .env
    environment:
      PHP_IDE_CONFIG: "serverName=localhost"
    extra_hosts:
      - "host.docker.internal:host-gateway"

  php-cli:
    env_file:
      - docker/env/common.env
      - docker/env/dev.env
      - .env
    extra_hosts:
      - "host.docker.internal:host-gateway"

  mailpit:
    image: axllent/mailpit:latest
    container_name: \${COMPOSE_PROJECT_NAME:-mageforge}_mailpit
    restart: unless-stopped
    ports:
      - "\${MAILPIT_PORT:-8025}:8025"
      - "1025:1025"
    networks:
      - mage-network`
  },
  {
    path: "magento2-project/.env.example",
    name: ".env.example",
    category: "core",
    language: "properties",
    purpose: "Template environment configuration containing credentials, ports, and Adobe Marketplace API access keys.",
    content: `# Project Name & Environment
COMPOSE_PROJECT_NAME=mageforge
APP_ENV=development
MAGENTO_MODE=developer

# Domain & Web Access
BASE_URL=http://localhost/
SECURE_BASE_URL=https://localhost/
VARNISH_PORT=80
NGINX_PORT=8080
RABBITMQ_MANAGEMENT_PORT=15672
MAILPIT_PORT=8025

# Magento Marketplace Authentication (repo.magento.com)
COMPOSER_MAGENTO_USERNAME=your_public_key_here
COMPOSER_MAGENTO_PASSWORD=your_private_key_here

# Magento Version & Edition
MAGENTO_VERSION=2.4.7
MAGENTO_EDITION=project-community-edition

# Magento Admin Credentials
ADMIN_FIRSTNAME=Store
ADMIN_LASTNAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin12345Password!
ADMIN_FRONTNAME=admin_secure

# Database Configuration
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=magento
MYSQL_USER=magento
MYSQL_PASSWORD=magento_secret_pw
MYSQL_ROOT_PASSWORD=root_secret_pw

# Search Engine Configuration
SEARCH_ENGINE=opensearch
OPENSEARCH_HOST=opensearch
OPENSEARCH_PORT=9200
OPENSEARCH_INDEX_PREFIX=magento2
OPENSEARCH_ENABLE_AUTH=0
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# Redis Configuration (Split Cache & Session)
REDIS_CACHE_HOST=redis-cache
REDIS_CACHE_PORT=6379
REDIS_CACHE_DB=0
REDIS_CACHE_PASSWORD=

REDIS_PAGE_CACHE_HOST=redis-cache
REDIS_PAGE_CACHE_PORT=6379
REDIS_PAGE_CACHE_DB=1
REDIS_PAGE_CACHE_PASSWORD=

REDIS_SESSION_HOST=redis-session
REDIS_SESSION_PORT=6379
REDIS_SESSION_DB=2
REDIS_SESSION_PASSWORD=

# RabbitMQ Message Broker
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=magento
RABBITMQ_PASSWORD=rabbit_secret_pw
RABBITMQ_VHOST=/

# System IDs
HOST_UID=1000
HOST_GID=1000`
  },
  {
    path: "magento2-project/Makefile",
    name: "Makefile",
    category: "core",
    language: "bash",
    purpose: "Developer CLI shortcuts for starting, stopping, compiling, flushing cache, and resetting the Docker environment.",
    content: `.DEFAULT_GOAL := help
SHELL := /bin/bash

COMPOSE_FILE := docker-compose.yml
COMPOSE_DEV_FILE := docker-compose.dev.yml
ENV_FILE := .env

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-18s\\033[0m %s\\n", $$1, $$2}'

setup: ## Initial copy of .env.example to .env
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env"; fi

up: ## Start all containers in background
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) up -d

down: ## Stop all active containers
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) down

restart: down up ## Restart the stack

build: ## Rebuild Docker images without cache
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) build --no-cache

install: ## Run the automated end-to-end Magento installer
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) run --rm php-cli /var/www/scripts/install-magento.sh

cli: ## Open bash shell in the PHP-CLI container
	docker compose -f $(COMPOSE_FILE) exec -u magento php-cli bash

bash: ## Open interactive shell inside PHP-FPM
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bash

logs: ## Tail real-time logs across all services
	docker compose -f $(COMPOSE_FILE) logs -f

logs-installer: ## Follow the automated installation progress logs
	docker compose -f $(COMPOSE_FILE) logs -f php-cli

cache: ## Flush and clean Magento caches
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bin/magento cache:flush

reindex: ## Reindex all OpenSearch & database indexers
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bin/magento indexer:reindex

compile: ## Run DI compilation and static content deployment
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bin/magento setup:di:compile
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bin/magento setup:static-content:deploy -f

permissions: ## Fix file and folder permissions across the codebase
	docker compose -f $(COMPOSE_FILE) exec -u root php-fpm /var/www/scripts/permissions.sh

reset: ## DANGER: Destroy all containers and persistent database volumes
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	rm -f src/.installed`
  },
  {
    path: "magento2-project/docker/scripts/install-magento.sh",
    name: "install-magento.sh",
    category: "scripts",
    language: "bash",
    purpose: "Master zero-touch orchestrator: validates dependencies, runs composer create-project, executes bin/magento setup:install with all flags, compiles DI, and sets permissions.",
    content: `#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
MAGENTO_ROOT="\${MAGENTO_ROOT:-/var/www/html}"
cd "\${MAGENTO_ROOT}"

echo "=========================================================================="
echo " Automated End-to-End Magento 2 Orchestrator"
echo "=========================================================================="

# Step 1: Wait for backend infrastructure to be fully ready
"\${SCRIPT_DIR}/wait-for-services.sh"

# Step 2: Check if already installed
if [ -f "\${MAGENTO_ROOT}/app/etc/env.php" ] && [ -f "\${MAGENTO_ROOT}/.installed" ]; then
    echo "Existing Magento 2 installation detected! Running upgrade..."
    php bin/magento setup:upgrade --keep-generated
    php bin/magento cache:flush
    "\${SCRIPT_DIR}/permissions.sh" "\${MAGENTO_ROOT}"
    exit 0
fi

# Step 3: Check codebase presence or bootstrap via Composer
if [ ! -f "\${MAGENTO_ROOT}/composer.json" ]; then
    if [ -n "\${COMPOSER_MAGENTO_USERNAME}" ] && [ -n "\${COMPOSER_MAGENTO_PASSWORD}" ]; then
        mkdir -p "\${COMPOSER_HOME:-/var/www/.composer}"
        cat <<EOF > "\${COMPOSER_HOME:-/var/www/.composer}/auth.json"
{
    "http-basic": {
        "repo.magento.com": {
            "username": "\${COMPOSER_MAGENTO_USERNAME}",
            "password": "\${COMPOSER_MAGENTO_PASSWORD}"
        }
    }
}
EOF
    fi

    echo "Running composer create-project..."
    composer create-project \\
        --repository-url=https://repo.magento.com/ \\
        "magento/\${MAGENTO_EDITION:-project-community-edition}:\${MAGENTO_VERSION:-2.4.7}" \\
        "\${MAGENTO_ROOT}" \\
        --no-install

    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Step 4: Execute Automated Magento Setup Install
echo "Executing bin/magento setup:install..."
php -d memory_limit=4G bin/magento setup:install \\
    --base-url="\${BASE_URL:-http://localhost/}" \\
    --base-url-secure="\${SECURE_BASE_URL:-https://localhost/}" \\
    --use-secure=0 \\
    --use-secure-admin=0 \\
    --db-host="\${MYSQL_HOST:-mysql}" \\
    --db-name="\${MYSQL_DATABASE:-magento}" \\
    --db-user="\${MYSQL_USER:-magento}" \\
    --db-password="\${MYSQL_PASSWORD:-magento_secret_pw}" \\
    --admin-firstname="\${ADMIN_FIRSTNAME:-Store}" \\
    --admin-lastname="\${ADMIN_LASTNAME:-Admin}" \\
    --admin-email="\${ADMIN_EMAIL:-admin@example.com}" \\
    --admin-user="\${ADMIN_USERNAME:-admin}" \\
    --admin-password="\${ADMIN_PASSWORD:-Admin12345Password!}" \\
    --backend-frontname="\${ADMIN_FRONTNAME:-admin_secure}" \\
    --language=en_US \\
    --currency=USD \\
    --timezone=America/Chicago \\
    --use-rewrites=1 \\
    --search-engine="\${SEARCH_ENGINE:-opensearch}" \\
    --opensearch-host="\${OPENSEARCH_HOST:-opensearch}" \\
    --opensearch-port="\${OPENSEARCH_PORT:-9200}" \\
    --opensearch-index-prefix="\${OPENSEARCH_INDEX_PREFIX:-magento2}" \\
    --opensearch-enable-auth="\${OPENSEARCH_ENABLE_AUTH:-0}" \\
    --session-save=redis \\
    --session-save-redis-host="\${REDIS_SESSION_HOST:-redis-session}" \\
    --session-save-redis-port="\${REDIS_SESSION_PORT:-6379}" \\
    --session-save-redis-db="\${REDIS_SESSION_DB:-2}" \\
    --session-save-redis-max-concurrency=20 \\
    --page-cache=redis \\
    --page-cache-redis-server="\${REDIS_PAGE_CACHE_HOST:-redis-cache}" \\
    --page-cache-redis-port="\${REDIS_PAGE_CACHE_PORT:-6379}" \\
    --page-cache-redis-db="\${REDIS_PAGE_CACHE_DB:-1}" \\
    --cache-backend=redis \\
    --cache-backend-redis-server="\${REDIS_CACHE_HOST:-redis-cache}" \\
    --cache-backend-redis-port="\${REDIS_CACHE_PORT:-6379}" \\
    --cache-backend-redis-db="\${REDIS_CACHE_DB:-0}" \\
    --amqp-host="\${RABBITMQ_HOST:-rabbitmq}" \\
    --amqp-port="\${RABBITMQ_PORT:-5672}" \\
    --amqp-user="\${RABBITMQ_USER:-magento}" \\
    --amqp-password="\${RABBITMQ_PASSWORD:-rabbit_secret_pw}" \\
    --amqp-virtualhost="\${RABBITMQ_VHOST:-/}" \\
    --cleanup-database \\
    --no-interaction

# Step 5: Configure Magento Mode
php bin/magento deploy:mode:set "\${MAGENTO_MODE:-developer}" -s

# Step 6: Compilation & Static Content Deployment
php -d memory_limit=4G bin/magento setup:di:compile
php -d memory_limit=4G bin/magento setup:static-content:deploy -f en_US

# Step 7: Configure Varnish Full Page Cache backend
php bin/magento config:set system/full_page_cache/caching_application 2 || true

# Step 8: Reindex & Flush Caches
php bin/magento indexer:reindex
php bin/magento cache:flush

# Step 9: Fix Permissions
"\${SCRIPT_DIR}/permissions.sh" "\${MAGENTO_ROOT}"

# Step 10: Create lockfile
date -u +"%Y-%m-%dT%H:%M:%SZ" > "\${MAGENTO_ROOT}/.installed"

echo "SUCCESS: Magento 2 Installation Successfully Completed!"`
  },
  {
    path: "magento2-project/docker/scripts/wait-for-services.sh",
    name: "wait-for-services.sh",
    category: "scripts",
    language: "bash",
    purpose: "Network readiness gatekeeper: polls MySQL ping, OpenSearch cluster health API, Redis sockets, and RabbitMQ.",
    content: `#!/usr/bin/env bash
set -e

TIMEOUT=\${WAIT_TIMEOUT:-120}
echo "Checking dependency services availability..."

# MySQL
echo -n "Waiting for MySQL at \${MYSQL_HOST:-mysql}:\${MYSQL_PORT:-3306}..."
count=0
until mysqladmin ping -h"\${MYSQL_HOST:-mysql}" -P"\${MYSQL_PORT:-3306}" -u"\${MYSQL_USER:-magento}" -p"\${MYSQL_PASSWORD:-magento_secret_pw}" --silent; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then exit 1; fi
    sleep 2
done
echo " READY!"

# OpenSearch
echo -n "Waiting for OpenSearch at \${OPENSEARCH_HOST:-opensearch}:\${OPENSEARCH_PORT:-9200}..."
count=0
until curl -s "http://\${OPENSEARCH_HOST:-opensearch}:\${OPENSEARCH_PORT:-9200}/_cluster/health?wait_for_status=yellow&timeout=5s" | grep -q '"status":"\\(yellow\\|green\\)"'; do
    count=$((count + 2))
    if [ $count -gt $TIMEOUT ]; then exit 1; fi
    sleep 2
done
echo " READY!"

# Redis Cache
echo -n "Waiting for Redis Cache..."
nc -z -v -w5 "\${REDIS_CACHE_HOST:-redis-cache}" "\${REDIS_CACHE_PORT:-6379}"
echo " READY!"

# Redis Session
echo -n "Waiting for Redis Session..."
nc -z -v -w5 "\${REDIS_SESSION_HOST:-redis-session}" "\${REDIS_SESSION_PORT:-6379}"
echo " READY!"

# RabbitMQ
echo -n "Waiting for RabbitMQ..."
nc -z -v -w5 "\${RABBITMQ_HOST:-rabbitmq}" "\${RABBITMQ_PORT:-5672}"
echo " READY!"`
  },
  {
    path: "magento2-project/docker/scripts/permissions.sh",
    name: "permissions.sh",
    category: "scripts",
    language: "bash",
    purpose: "Enforces Adobe Magento official security permissions: directories 755, files 644, bin/magento executable, and writable runtime folders.",
    content: `#!/usr/bin/env bash
set -e

TARGET_DIR="\${1:-/var/www/html}"
cd "\${TARGET_DIR}"

find . -type d -exec chmod 755 {} +
find . -type f -exec chmod 644 {} +

if [ -f "bin/magento" ]; then
    chmod u+x bin/magento
fi

for dir in var generated pub/static pub/media app/etc; do
    if [ -d "$dir" ]; then
        chmod -R u+rwX,g+rwX "$dir"
    fi
done`
  },
  {
    path: "magento2-project/docker/scripts/healthcheck.sh",
    name: "healthcheck.sh",
    category: "scripts",
    language: "bash",
    purpose: "Deep healthcheck script testing PHP-FPM fastcgi ping and MySQL PDO connectivity from within the container.",
    content: `#!/usr/bin/env bash
set -e

if command -v cgi-fcgi >/dev/null 2>&1; then
    SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET \\
    cgi-fcgi -bind -connect 127.0.0.1:9000 || exit 1
fi

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
exit 0`
  },
  {
    path: "magento2-project/docker/php-fpm/Dockerfile",
    name: "Dockerfile (php-fpm)",
    category: "php",
    language: "dockerfile",
    purpose: "PHP 8.2-FPM image containing bcmath, gd, intl, pdo_mysql, soap, sockets, xsl, zip, sodium, opcache, and PECL redis.",
    content: `FROM php:8.2-fpm-bookworm

ENV DEBIAN_FRONTEND=noninteractive \\
    MAGENTO_ROOT=/var/www/html \\
    COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl git unzip libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev \\
    libicu-dev libxml2-dev libxslt1-dev libzip-dev libsodium-dev \\
    procps default-mysql-client netcat-traditional \\
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \\
    && docker-php-ext-install -j\$(nproc) \\
        bcmath gd intl pdo_mysql soap sockets xsl zip sodium opcache pcntl

RUN pecl install redis-6.0.2 && docker-php-ext-enable redis

ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g \${HOST_GID} magento \\
    && useradd -u \${HOST_UID} -g magento -m -s /bin/bash magento \\
    && mkdir -p /var/www/html /var/www/.composer \\
    && chown -R magento:magento /var/www

COPY php.ini /usr/local/etc/php/conf.d/99-magento.ini
COPY opcache.ini /usr/local/etc/php/conf.d/10-opcache.ini
COPY www.conf /usr/local/etc/php-fpm.d/www.conf

WORKDIR /var/www/html
EXPOSE 9000
USER magento
CMD ["php-fpm", "-F"]`
  },
  {
    path: "magento2-project/docker/php-cli/Dockerfile",
    name: "Dockerfile (php-cli)",
    category: "php",
    language: "dockerfile",
    purpose: "Dedicated PHP 8.2 CLI container with official Composer v2.7, database clients, and unlimited execution time for installer jobs.",
    content: `FROM php:8.2-cli-bookworm

ENV DEBIAN_FRONTEND=noninteractive \\
    MAGENTO_ROOT=/var/www/html \\
    COMPOSER_ALLOW_SUPERUSER=1 \\
    COMPOSER_MEMORY_LIMIT=-1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl git unzip libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev \\
    libicu-dev libxml2-dev libxslt1-dev libzip-dev libsodium-dev \\
    procps default-mysql-client netcat-traditional jq \\
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \\
    && docker-php-ext-install -j\$(nproc) \\
        bcmath gd intl pdo_mysql soap sockets xsl zip sodium opcache pcntl

RUN pecl install redis-6.0.2 && docker-php-ext-enable redis

COPY --from=composer:2.7 /usr/bin/composer /usr/local/bin/composer

ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g \${HOST_GID} magento \\
    && useradd -u \${HOST_UID} -g magento -m -s /bin/bash magento \\
    && mkdir -p /var/www/html /var/www/.composer \\
    && chown -R magento:magento /var/www

COPY php.ini /usr/local/etc/php/conf.d/99-magento-cli.ini
WORKDIR /var/www/html
USER magento
ENTRYPOINT ["/bin/bash"]
CMD ["-c", "tail -f /dev/null"]`
  },
  {
    path: "magento2-project/docker/php-cron/Dockerfile",
    name: "Dockerfile (php-cron)",
    category: "php",
    language: "dockerfile",
    purpose: "Isolated Cron worker running Magento's scheduled jobs every minute without competing with web server request cycles.",
    content: `FROM php:8.2-cli-bookworm

ENV DEBIAN_FRONTEND=noninteractive \\
    MAGENTO_ROOT=/var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \\
    cron procps default-mysql-client \\
    libfreetype6-dev libjpeg62-turbo-dev libpng-dev libicu-dev \\
    libxml2-dev libxslt1-dev libzip-dev libsodium-dev \\
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \\
    && docker-php-ext-install -j\$(nproc) bcmath gd intl pdo_mysql soap sockets xsl zip sodium

RUN pecl install redis-6.0.2 && docker-php-ext-enable redis

ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g \${HOST_GID} magento && useradd -u \${HOST_UID} -g magento -m -s /bin/bash magento

COPY crontab /etc/cron.d/magento-cron
RUN chmod 0644 /etc/cron.d/magento-cron && crontab -u magento /etc/cron.d/magento-cron

WORKDIR /var/www/html
CMD ["cron", "-f", "-l", "2"]`
  },
  {
    path: "magento2-project/docker/nginx/conf.d/magento.conf",
    name: "magento.conf",
    category: "nginx",
    language: "nginx",
    purpose: "Nginx configuration implementing Magento's pub/ document root, versioned static asset rewrites, and FastCGI buffers.",
    content: `root $MAGE_ROOT/pub;
index index.php;
autoindex off;
charset UTF-8;
error_page 404 403 = /errors/404.php;

location = /ping {
    access_log off;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass fastcgi_backend;
}

location / {
    try_files $uri $uri/ /index.php$is_args$args;
}

location /static/ {
    location ~ ^/static/version\\d*/ {
        rewrite ^/static/version\\d*/(.*)$ /static/$1 last;
    }
    location ~* \\.(ico|jpg|jpeg|png|gif|svg|js|css|woff|woff2)$ {
        add_header Cache-Control "public";
        expires +1y;
        if (!-f $request_filename) {
            rewrite ^/static/(.*)$ /static.php?resource=$1 last;
        }
    }
    if (!-f $request_filename) {
        rewrite ^/static/(.*)$ /static.php?resource=$1 last;
    }
}

location ~ ^/(index|get|static|health_check)\\.php$ {
    try_files $uri =404;
    fastcgi_pass fastcgi_backend;
    fastcgi_buffers 16 16k;
    fastcgi_buffer_size 32k;
    fastcgi_read_timeout 600s;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}`
  },
  {
    path: "magento2-project/docker/varnish/default.vcl",
    name: "default.vcl",
    category: "nginx",
    language: "properties",
    purpose: "Varnish 7.4 cache rules configured for X-Magento-Tags cache purging, cookie hashing, and admin path bypassing.",
    content: `vcl 4.1;
import std;

backend default {
    .host = "nginx";
    .port = "8080";
    .first_byte_timeout = 600s;
    .probe = {
        .url = "/ping";
        .timeout = 2s;
        .interval = 5s;
    }
}

acl purge {
    "localhost";
    "127.0.0.1";
    "php-fpm";
}

sub vcl_recv {
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Method not allowed"));
        }
        ban("obj.http.X-Magento-Tags ~ " + req.http.X-Magento-Tags-Pattern);
        return (synth(200, "Purged"));
    }
    if (req.url ~ "^/(pub/)?(admin_secure|admin|api|graphql)") {
        return (pass);
    }
    return (hash);
}`
  },
  {
    path: "magento2-project/docker/mysql/my.cnf",
    name: "my.cnf",
    category: "database",
    language: "ini",
    purpose: "MySQL 8.0 InnoDB tuning for Magento: 2G buffer pool, utf8mb4 collation, 128M max_allowed_packet, and transaction commit safety.",
    content: `[mysqld]
default_authentication_plugin = mysql_native_password
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

max_connections = 250
max_allowed_packet = 128M
thread_cache_size = 16

innodb_buffer_pool_size = 2G
innodb_buffer_pool_instances = 2
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
innodb_file_per_table = 1
sql_mode = "NO_ENGINE_SUBSTITUTION"`
  },
  {
    path: "magento2-project/docker/redis/redis-cache.conf",
    name: "redis-cache.conf",
    category: "database",
    language: "properties",
    purpose: "Redis Cache node: ephemeral storage with 1024MB memory cap and volatile-lru eviction policy for cache tags.",
    content: `port 6379
bind 0.0.0.0
protected-mode no
timeout 0
tcp-keepalive 300
databases 16

save ""
appendonly no

maxmemory 1024mb
maxmemory-policy volatile-lru
lazyfree-lazy-eviction yes`
  },
  {
    path: "magento2-project/docker/redis/redis-session.conf",
    name: "redis-session.conf",
    category: "database",
    language: "properties",
    purpose: "Redis Session node: strict noeviction policy and appendonly persistence to guarantee active customer carts are never lost.",
    content: `port 6379
bind 0.0.0.0
protected-mode no
timeout 0
tcp-keepalive 300
databases 16

save 900 1
save 300 10
appendonly yes
appendfsync everysec

maxmemory 512mb
maxmemory-policy noeviction`
  },
  {
    path: "magento2-project/docker/opensearch/opensearch.yml",
    name: "opensearch.yml",
    category: "search",
    language: "yaml",
    purpose: "OpenSearch 2.12 catalog search cluster configuration with single-node mode and internal Docker bridge security bypass.",
    content: `cluster.name: magento2-cluster
node.name: magento2-node-1
network.host: 0.0.0.0
http.port: 9200

discovery.type: single-node
bootstrap.memory_lock: true
plugins.security.disabled: true
compatibility.override_main_response_version: true
indices.query.bool.max_clause_count: 10240`
  },
  {
    path: "magento2-project/docker/rabbitmq/rabbitmq.conf",
    name: "rabbitmq.conf",
    category: "queue",
    language: "properties",
    purpose: "RabbitMQ AMQP message broker configuration for asynchronous bulk indexing, inventory updates, and email dispatch queues.",
    content: `loopback_users.guest = false
listeners.tcp.default = 5672
management.tcp.port = 15672

default_user = magento
default_pass = rabbit_secret_pw
default_vhost = /

management.load_definitions = /etc/rabbitmq/definitions.json
vm_memory_high_watermark.relative = 0.7`
  }
];

export const SERVICE_NODES: ServiceNode[] = [
  {
    id: "varnish",
    name: "Varnish Accelerator",
    containerName: "mageforge_varnish",
    image: "varnish:7.4-alpine",
    ports: ["80:80"],
    role: "Full Page Cache (FPC)",
    purpose: "Intercepts client requests on port 80. Delivers cached storefront pages in under 15ms. Passes misses to Nginx.",
    healthcheck: "varnishadm status / probe /ping",
    configFile: "docker/varnish/default.vcl",
    dependencies: ["nginx"],
    icon: "Zap"
  },
  {
    id: "nginx",
    name: "Nginx Web Server",
    containerName: "mageforge_nginx",
    image: "nginx:1.25-alpine",
    ports: ["8080:8080"],
    role: "Reverse Proxy & Static Server",
    purpose: "Serves static assets directly from /pub/static and /pub/media. Forwards dynamic requests to PHP-FPM pool.",
    healthcheck: "curl -I http://localhost:8080/ping",
    configFile: "docker/nginx/conf.d/magento.conf",
    dependencies: ["php-fpm"],
    icon: "Server"
  },
  {
    id: "php-fpm",
    name: "PHP-FPM Application Server",
    containerName: "mageforge_php_fpm",
    image: "custom (php:8.2-fpm-bookworm)",
    ports: ["9000 (internal)"],
    role: "Core Execution Engine",
    purpose: "Runs Magento 2 core logic, controllers, blocks, and templates. Loaded with bcmath, gd, intl, pdo_mysql, and redis extensions.",
    healthcheck: "cgi-fcgi ping on port 9000",
    configFile: "docker/php-fpm/php.ini",
    dependencies: ["mysql", "opensearch", "redis-cache", "redis-session", "rabbitmq"],
    icon: "Cpu"
  },
  {
    id: "php-cli",
    name: "Automated Installer & CLI",
    containerName: "mageforge_php_cli",
    image: "custom (php:8.2-cli-bookworm)",
    ports: ["None"],
    role: "Zero-Touch Orchestrator",
    purpose: "Executes install-magento.sh on first boot. Handles Composer dependencies, bin/magento setup:install, setup:di:compile, and static content deploy.",
    healthcheck: "Exits 0 on completion",
    configFile: "docker/scripts/install-magento.sh",
    dependencies: ["mysql", "opensearch", "rabbitmq"],
    icon: "Terminal"
  },
  {
    id: "php-cron",
    name: "Isolated Cron Runner",
    containerName: "mageforge_php_cron",
    image: "custom (php:8.2-cli-bookworm)",
    ports: ["None"],
    role: "Background Task Scheduler",
    purpose: "Runs 'bin/magento cron:run' every 60 seconds to process pending emails, catalog price rules, and automated reindexes.",
    healthcheck: "crontab -l & process monitor",
    configFile: "docker/php-cron/crontab",
    dependencies: ["php-fpm"],
    icon: "Clock"
  },
  {
    id: "mysql",
    name: "MySQL 8.0 Database",
    containerName: "mageforge_mysql",
    image: "mysql:8.0",
    ports: ["3306:3306"],
    role: "Relational Data Storage",
    purpose: "Houses Magento's EAV architecture, orders, customer accounts, and configuration records. Tuned with 2GB InnoDB buffer pool.",
    healthcheck: "mysqladmin ping -u root -p password",
    configFile: "docker/mysql/my.cnf",
    dependencies: [],
    icon: "Database"
  },
  {
    id: "redis-cache",
    name: "Redis Cache Node",
    containerName: "mageforge_redis_cache",
    image: "redis:7.2-alpine",
    ports: ["6379:6379"],
    role: "System & Page Cache",
    purpose: "In-memory caching for configuration, layouts, and Varnish tag invalidations with volatile-lru eviction.",
    healthcheck: "redis-cli ping",
    configFile: "docker/redis/redis-cache.conf",
    dependencies: [],
    icon: "Layers"
  },
  {
    id: "redis-session",
    name: "Redis Session Node",
    containerName: "mageforge_redis_session",
    image: "redis:7.2-alpine",
    ports: ["Internal 6379"],
    role: "Durable Session Store",
    purpose: "Holds active shopping carts and user login sessions with strict noeviction and AOF persistence.",
    healthcheck: "redis-cli ping",
    configFile: "docker/redis/redis-session.conf",
    dependencies: [],
    icon: "Shield"
  },
  {
    id: "opensearch",
    name: "OpenSearch 2.12 Engine",
    containerName: "mageforge_opensearch",
    image: "opensearchproject/opensearch:2.12.0",
    ports: ["9200:9200"],
    role: "Catalog Search & Faceting",
    purpose: "Required catalog search backend for Magento 2.4.4+. Handles category filtering, fuzzy search, and autocomplete.",
    healthcheck: "curl -s http://localhost:9200/_cluster/health",
    configFile: "docker/opensearch/opensearch.yml",
    dependencies: [],
    icon: "Search"
  },
  {
    id: "rabbitmq",
    name: "RabbitMQ Message Broker",
    containerName: "mageforge_rabbitmq",
    image: "rabbitmq:3.12-management-alpine",
    ports: ["5672:5672", "15672:15672"],
    role: "Asynchronous Queue Broker",
    purpose: "AMQP broker for mass customer operations, asynchronous catalog changes, and message queues. Web management on 15672.",
    healthcheck: "rabbitmq-diagnostics check_running",
    configFile: "docker/rabbitmq/rabbitmq.conf",
    dependencies: [],
    icon: "Radio"
  }
];

export const AUTOMATION_STEPS: AutomationStep[] = [
  {
    step: 1,
    title: "Dependency Readiness Probing",
    command: "docker/scripts/wait-for-services.sh",
    description: "Actively tests MySQL socket ping, OpenSearch cluster health status, Redis ports, and RabbitMQ readiness before proceeding.",
    purpose: "Prevents race conditions where Magento installer fails due to premature database access.",
    container: "php-cli"
  },
  {
    step: 2,
    title: "Composer Marketplace Authentication",
    command: "composer create-project ... /var/www/html",
    description: "Configures auth.json with Adobe Marketplace public/private keys and pulls magento/project-community-edition:2.4.7.",
    purpose: "Automates the proprietary Adobe repository package retrieval without prompting the developer.",
    container: "php-cli"
  },
  {
    step: 3,
    title: "Core Installation Execution",
    command: "bin/magento setup:install --base-url=... --db-host=mysql ...",
    description: "Configures database tables, Redis dual caching, OpenSearch host, RabbitMQ queues, and initializes the administrator account.",
    purpose: "Translates all 25+ parameters into a coherent, fully initialized Magento store instance.",
    container: "php-cli"
  },
  {
    step: 4,
    title: "Deployment Mode Configuration",
    command: "bin/magento deploy:mode:set developer -s",
    description: "Configures Magento to run in developer mode (for symlinked assets and error tracing) or production mode.",
    purpose: "Sets appropriate code generation rules and cache behaviors.",
    container: "php-cli"
  },
  {
    step: 5,
    title: "Dependency Injection (DI) Compilation",
    command: "php -d memory_limit=4G bin/magento setup:di:compile",
    description: "Compiles all plugin interceptors, proxies, and factories into the generated/code directory.",
    purpose: "Guarantees zero runtime dependency injection resolution failures during customer web requests.",
    container: "php-cli"
  },
  {
    step: 6,
    title: "Static View Content Deployment",
    command: "php -d memory_limit=4G bin/magento setup:static-content:deploy -f",
    description: "Deploys frontend theme files, CSS, JavaScript, and translation dictionaries to pub/static/.",
    purpose: "Ensures the storefront and admin panel load styling without blank white screens.",
    container: "php-cli"
  },
  {
    step: 7,
    title: "Varnish Full Page Cache Activation",
    command: "bin/magento config:set system/full_page_cache/caching_application 2",
    description: "Instructs Magento to output Varnish HTTP purge tags and headers for external accelerator caching.",
    purpose: "Elevates store performance from slow PHP rendering to sub-20ms cached delivery.",
    container: "php-cli"
  },
  {
    step: 8,
    title: "Full Catalog Reindex & Cache Flush",
    command: "bin/magento indexer:reindex && bin/magento cache:flush",
    description: "Populates OpenSearch catalog indices and primes Redis cache tables.",
    purpose: "Store catalog and search bars are immediately functional for first-time visitors.",
    container: "php-cli"
  },
  {
    step: 9,
    title: "Filesystem Permission Normalization",
    command: "docker/scripts/permissions.sh /var/www/html",
    description: "Applies 755 directory modes, 644 file modes, executes chmod u+x on bin/magento, and grants write permissions to var/ and pub/.",
    purpose: "Avoids common 'Unable to write to directory' fatal errors.",
    container: "php-cli"
  },
  {
    step: 10,
    title: "Completion & Flagging",
    command: "date -u > src/.installed",
    description: "Writes a timestamped .installed marker file so subsequent container boots execute fast upgrades rather than reinstallation.",
    purpose: "Guarantees idempotency on container restarts.",
    container: "php-cli"
  }
];
