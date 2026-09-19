# MageForge: Automated Magento 2 Docker Platform

[![Magento 2.4.7 Compatible](https://img.shields.io/badge/Magento-2.4.7-orange.svg)](https://business.adobe.com/products/magento/magento-commerce.html)
[![PHP 8.2 FPM](https://img.shields.io/badge/PHP-8.2--FPM-blue.svg)](https://www.php.net/)
[![OpenSearch 2.12](https://img.shields.io/badge/OpenSearch-2.12-teal.svg)](https://opensearch.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7.2-red.svg)](https://redis.io/)
[![RabbitMQ 3.12](https://img.shields.io/badge/RabbitMQ-3.12-orange.svg)](https://www.rabbitmq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**MageForge** is a turnkey, containerized orchestration platform engineered to bootstrap, install, and run Adobe Magento 2 (Open Source & Adobe Commerce) end-to-end with **zero manual intervention**.

Running a single command:
```bash
docker compose up -d --build
```
automatically brings up the complete microservice architecture, verifies dependency readiness, authenticates with Adobe Marketplace, installs Magento 2 with all required production parameters, sets up Redis caching, attaches OpenSearch catalog indexing, configures RabbitMQ queues, installs cron workers, compiles DI, deploys static assets, and launches the live storefront and admin panel.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Topology](#architecture-topology)
3. [Prerequisites & Software Requirements](#prerequisites--software-requirements)
4. [Technology Stack & Versions](#technology-stack--versions)
5. [Complete Project Folder Structure](#complete-project-folder-structure)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Adobe Magento Authentication Setup](#adobe-magento-authentication-setup)
8. [Docker Architecture & Dockerfiles](#docker-architecture--dockerfiles)
9. [Docker Compose Orchestration & Dependencies](#docker-compose-orchestration--dependencies)
10. [Automated Zero-Touch Installation Workflow](#automated-zero-touch-installation-workflow)
11. [Service Deep Dives](#service-deep-dives)
    - [Nginx Web Server](#nginx-web-server)
    - [Varnish Full Page Cache](#varnish-full-page-cache)
    - [PHP-FPM Application Server](#php-fpm-application-server)
    - [Dedicated PHP-CLI Worker](#dedicated-php-cli-worker)
    - [Isolated PHP-Cron Runner](#isolated-php-cron-runner)
    - [MySQL / MariaDB Optimization](#mysql--mariadb-optimization)
    - [Redis Dual Cache & Session Split](#redis-dual-cache--session-split)
    - [OpenSearch Search Engine](#opensearch-search-engine)
    - [RabbitMQ Message Broker](#rabbitmq-message-broker)
12. [Filesystem Permissions & Security](#filesystem-permissions--security)
13. [Deployment Modes (Developer vs Production)](#deployment-modes-developer-vs-production)
14. [Quickstart Guide (Clone to Running)](#quickstart-guide-clone-to-running)
15. [Useful Developer Commands](#useful-developer-commands)
    - [Makefile Shortcuts](#makefile-shortcuts)
    - [Docker Compose Commands](#docker-compose-commands)
    - [Magento CLI Commands](#magento-cli-commands)
16. [Verification & Health Checks](#verification--health-checks)
17. [Troubleshooting & FAQs](#troubleshooting--faqs)
18. [Resetting the Environment](#resetting-the-environment)

---

## 1. Project Overview

Setting up Magento 2 locally or in staging environments is traditionally notoriously complex, requiring manual PHP extension installation, complex Nginx rewrite rules, strict OpenSearch version pairing, dual-instance Redis configurations, and multi-step CLI compilation commands.

**MageForge resolves this friction** by delivering:
- **Zero-Touch Automation:** No interactive prompts; runs Composer project creation, `bin/magento setup:install`, `setup:di:compile`, and `setup:static-content:deploy` automatically via dedicated entrypoint hooks.
- **Microservice Isolation:** PHP-FPM, PHP-CLI, Cron, Nginx, Varnish, Redis (Cache vs Session), OpenSearch, RabbitMQ, and MySQL are decoupled into dedicated purpose-built containers.
- **Enterprise-Grade Configurations:** Production-tuned OPcache, Redis memory eviction protections (`noeviction` for sessions, `volatile-lru` for caches), Varnish ESI purging rules, and MySQL InnoDB memory pool scaling.
- **Developer Experience:** Native Xdebug 3 bridge, Mailpit local SMTP catcher, Makefile task runners, and volume permission synchronization via host UID/GID passthrough.

---

## 2. Architecture Topology

```text
[ Browser / Client Traffic ]
             |
             v
   [ Varnish 7.4 FPC (Port 80) ]  <--- Instant Cache Hit
             | (Cache Miss / Pass)
             v
   [ Nginx 1.25 Reverse Proxy (Port 8080) ]
        |                              |
        | Static Assets                | FastCGI Proxy (:9000)
        v                              v
  [ /pub/static & /pub/media ]     [ PHP-FPM 8.2 Application Engine ]
                                       |
       +-------------------------------+-------------------------------+
       |                               |                               |
       v                               v                               v
[ MySQL 8.0 / MariaDB ]      [ Redis Dual Instance ]         [ OpenSearch 2.12 ]
  - Relational Catalog         - redis-cache (DB 0: Cache)     - Catalog Search
  - Orders & EAV               - redis-cache (DB 1: FPC)       - Fast Faceting
  - Customers                  - redis-session (DB 2: Sess)    - Autocomplete
       |                               |
       +---------------+---------------+
                       |
                       v
            [ RabbitMQ 3.12 AMQP ]
              - Async Bulk Operations
              - Inventory & Email Queues
```

Complementary Background Daemons:
- **`php-cron`**: Independent container isolated from web traffic, running `bin/magento cron:run` every 60 seconds.
- **`php-cli` (Installer)**: Orchestrates dependency wait states and performs the one-shot zero-touch installation.

---

## 3. Prerequisites & Software Requirements

Before launching MageForge, ensure the following host software is installed:

| Tool | Minimum Version | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Docker Engine** | 24.0.0+ | 26.0+ | Container runtime |
| **Docker Compose** | v2.20.0+ | v2.26+ | Multi-container orchestration |
| **Git** | 2.30+ | Latest | Version control |
| **Make** | 3.81+ | 4.3+ | CLI shortcut runner (Optional) |

### Minimum Hardware Allocation
- **CPU:** 4 physical cores recommended (2 minimum)
- **RAM:** 8 GB RAM dedicated to Docker (12 GB+ recommended for static content deployment)
- **Disk:** 25 GB free SSD storage

---

## 4. Technology Stack & Versions

- **Magento:** 2.4.7 (Supports 2.4.6-pX & 2.4.7)
- **PHP:** 8.2 (Official Debian Bookworm FPM & CLI builds)
- **Web Server:** Nginx 1.25 Alpine
- **HTTP Accelerator:** Varnish 7.4 Alpine
- **Database:** MySQL 8.0 Community Server (or MariaDB 10.6 LTS)
- **Search Engine:** OpenSearch 2.12.0
- **Cache / Session Broker:** Redis 7.2 Alpine (Dual dedicated nodes)
- **Message Broker:** RabbitMQ 3.12 with Management Alpine
- **Mail Capture:** Mailpit (v1.18+)

---

## 5. Complete Project Folder Structure

```text
magento2-project/
│
├── .env.example                     # Reference environment variables
├── .gitignore                        # Git exclusion rules
├── .dockerignore                     # Docker build context exclusions
├── README.md                         # Comprehensive documentation
├── docker-compose.yml                # Base production-like orchestration
├── docker-compose.dev.yml            # Local development overrides (Xdebug, Mailpit)
├── Makefile                          # Developer command shortcuts
│
├── docker/
│   ├── env/                          # Decoupled environment configurations
│   │   ├── common.env                # Shared constants across containers
│   │   ├── dev.env                   # Xdebug & developer error display settings
│   │   └── prod.env                  # High-performance OPcache & silent errors
│   │
│   ├── php-fpm/                      # Dedicated web-serving PHP engine
│   │   ├── Dockerfile                # PHP 8.2 FPM with all required extensions
│   │   ├── php.ini                   # Magento memory & execution limits
│   │   ├── opcache.ini               # Production-grade OPcache tuning
│   │   └── www.conf                  # FPM worker pool configuration
│   │
│   ├── php-cli/                      # Dedicated CLI container for Composer & bin/magento
│   │   ├── Dockerfile                # PHP 8.2 CLI + Composer 2.7 + Dev tools
│   │   └── php.ini                   # Unlimited CLI execution timeout & 4G memory
│   │
│   ├── php-cron/                     # Dedicated container to isolate Cron runtime
│   │   ├── Dockerfile                # PHP 8.2 CLI with system cron daemon
│   │   └── crontab                   # Scheduled 1-minute execution definition
│   │
│   ├── nginx/                        # High-performance reverse proxy / web server
│   │   ├── Dockerfile                # Nginx Alpine with non-root user matching
│   │   ├── nginx.conf                # Upstream pools, gzip, worker limits
│   │   └── conf.d/
│   │       ├── default.conf          # Port 8080 virtual host binding
│   │       └── magento.conf          # Official Magento 2 static & FastCGI rewrite rules
│   │
│   ├── varnish/                      # Full Page Cache (FPC) accelerator
│   │   ├── Dockerfile                # Varnish 7.4 container definition
│   │   └── default.vcl               # Magento 2 cache tags, purge ACL, and pass rules
│   │
│   ├── mysql/                        # Database configuration
│   │   ├── my.cnf                    # InnoDB buffer pool & query tuning
│   │   └── docker-entrypoint-initdb.d/
│   │       └── 01-init.sql           # User grants & privileges initialization
│   │
│   ├── redis/                        # Caching and Session management split
│   │   ├── redis-cache.conf          # Volatile-lru ephemeral cache settings
│   │   └── redis-session.conf        # Noeviction persistent session settings
│   │
│   ├── opensearch/                   # Catalog search infrastructure
│   │   └── opensearch.yml            # Single-node cluster definition
│   │
│   ├── rabbitmq/                     # Message queueing for async operations
│   │   ├── rabbitmq.conf             # Ports, memory limits, and management setup
│   │   └── definitions.json          # Pre-provisioned user and virtual host
│   │
│   └── scripts/                      # Automated environment lifecycle hooks
│       ├── entrypoint.sh             # Container lifecycle dispatch script
│       ├── install-magento.sh        # Zero-touch unattended Magento 2 installer
│       ├── wait-for-services.sh      # Health probe polling MySQL, Redis, OpenSearch
│       ├── healthcheck.sh            # Container health check probes
│       ├── permissions.sh            # Magento 2 chmod/chown normalization
│       └── db-import.sh              # Fast DB dump import & URL sanitization
│
├── src/                              # Magento 2 application codebase
│   └── public/                       # Directory mapped to Magento pub/ root
│
└── volumes/                          # Persistent local storage (Ignored in Git)
    ├── db/                           # MySQL database files
    ├── opensearch/                   # OpenSearch indexed catalog indices
    ├── redis/                        # Redis RDB/AOF dumps
    └── rabbitmq/                     # RabbitMQ message queues
```

---

## 6. Environment Variables Reference

Copy `.env.example` to `.env` before starting:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `COMPOSE_PROJECT_NAME` | `mageforge` | Docker network & container name prefix |
| `APP_ENV` | `development` | Target environment (`development` / `production`) |
| `MAGENTO_MODE` | `developer` | Magento mode (`developer` or `production`) |
| `BASE_URL` | `http://localhost/` | Store unsecure base URL |
| `SECURE_BASE_URL` | `https://localhost/` | Store secure base URL |
| `COMPOSER_MAGENTO_USERNAME` | *(Required)* | Adobe Marketplace Public Key |
| `COMPOSER_MAGENTO_PASSWORD` | *(Required)* | Adobe Marketplace Private Key |
| `MAGENTO_VERSION` | `2.4.7` | Target Magento release version |
| `ADMIN_FIRSTNAME` | `Store` | Admin user first name |
| `ADMIN_LASTNAME` | `Admin` | Admin user last name |
| `ADMIN_EMAIL` | `admin@example.com` | Store administrator contact email |
| `ADMIN_USERNAME` | `admin` | Admin panel login username |
| `ADMIN_PASSWORD` | `Admin12345Password!`| Admin panel secure password |
| `ADMIN_FRONTNAME` | `admin_secure` | Custom admin URI segment |
| `MYSQL_HOST` | `mysql` | MySQL container hostname |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_DATABASE` | `magento` | Magento database schema name |
| `MYSQL_USER` | `magento` | Database username |
| `MYSQL_PASSWORD` | `magento_secret_pw`| Database user password |
| `MYSQL_ROOT_PASSWORD` | `root_secret_pw` | MySQL root administrative password |
| `SEARCH_ENGINE` | `opensearch` | Catalog search provider (`opensearch`) |
| `OPENSEARCH_HOST` | `opensearch` | OpenSearch container hostname |
| `OPENSEARCH_PORT` | `9200` | OpenSearch HTTP REST API port |
| `REDIS_CACHE_HOST` | `redis-cache` | Redis cache service name |
| `REDIS_SESSION_HOST` | `redis-session` | Redis session service name |
| `RABBITMQ_HOST` | `rabbitmq` | RabbitMQ broker service name |
| `HOST_UID` / `HOST_GID` | `1000` / `1000` | Host UID/GID to avoid file ownership issues |

---

## 7. Adobe Magento Authentication Setup

To download Magento 2 via Composer, Adobe requires free authorization keys:

1. Create a free account at [marketplace.magento.com](https://marketplace.magento.com/).
2. Log in and navigate to **My Profile** -> **Access Keys** (under the "Marketplace" tab).
3. Click **Create A New Access Key** and give it a label (e.g., `MageForge-Local`).
4. Copy the two generated keys:
   - **Public Key** -> paste into `.env` as `COMPOSER_MAGENTO_USERNAME`
   - **Private Key** -> paste into `.env` as `COMPOSER_MAGENTO_PASSWORD`

*Why is this required?* Magento 2 Open Source packages and modules are published on Adobe's private repository `repo.magento.com`. Without these credentials, Composer cannot legally download the enterprise package dependencies.

---

## 8. Docker Architecture & Dockerfiles

### `docker/php-fpm/Dockerfile`
Built on `php:8.2-fpm-bookworm`. It configures and builds the mandatory Magento extensions using `docker-php-ext-install` and PECL:
- `bcmath`, `gd` (with WebP, FreeType, JPEG support), `intl`, `pdo_mysql`, `soap`, `sockets`, `xsl`, `zip`, `sodium`, `opcache`, `pcntl`, and PECL `redis-6.0.2`.
- Configured with a non-root `magento` user with matching `HOST_UID` and `HOST_GID`.

### `docker/php-cli/Dockerfile`
Built on `php:8.2-cli-bookworm`. It bundles:
- Official Composer v2.7 binary extracted from `composer:2.7`.
- Tools: `git`, `unzip`, `default-mysql-client`, `netcat`, and `jq`.
- Set with `COMPOSER_MEMORY_LIMIT=-1` to prevent Out-Of-Memory exceptions during large Magento dependency tree resolutions.

### `docker/php-cron/Dockerfile`
Runs a background system cron daemon configured specifically for Magento's single-command runner:
```cron
* * * * * /usr/local/bin/php /var/www/html/bin/magento cron:run >> /var/www/html/var/log/magento.cron.log
```
Isolating cron prevents background batch operations (like catalog price indexing or email dispatching) from stealing CPU cycles from live customer web traffic in `php-fpm`.

### `docker/nginx/Dockerfile`
Built on `nginx:1.25-alpine`. Pre-configured with:
- Non-root `magento` user.
- Magento 2 official pub/ directory routing rules.
- Upstream connection pool to `php-fpm:9000`.

### `docker/varnish/Dockerfile`
Built on `varnish:7.4-alpine`. Pre-loaded with custom VCL syntax configured to:
- Reverse-proxy to Nginx on port 8080.
- Respect `X-Magento-Tags` for instant cache invalidation.
- Pass administrative, GraphQL, and checkout paths directly to the backend.

---

## 9. Docker Compose Orchestration & Dependencies

MageForge enforces strict service dependency sequences through Docker healthchecks:

```yaml
services:
  php-fpm:
    depends_on:
      mysql:
        condition: service_healthy
      opensearch:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
```

When you execute `docker compose up -d`, the following automated sequence occurs:
1. **Infrastructure Initialized:** `mysql`, `redis-cache`, `redis-session`, `opensearch`, and `rabbitmq` containers are started.
2. **Healthchecks Polled:** MySQL tests `mysqladmin ping`; OpenSearch tests `/_cluster/health`; RabbitMQ tests `rabbitmq-diagnostics`.
3. **Application Servers Booted:** As soon as dependencies report healthy, `php-fpm`, `php-cron`, and `nginx` become active.
4. **Zero-Touch Installer Triggered:** The `php-cli` container executes `/var/www/scripts/install-magento.sh`.

---

## 10. Automated Zero-Touch Installation Workflow

The automated installation script (`docker/scripts/install-magento.sh`) runs inside `php-cli` and performs the following 10 steps sequentially:

1. **Service Readiness Check:** Executes `wait-for-services.sh` to ensure sockets are open and queries succeed.
2. **Installation Verification:** Checks if `app/etc/env.php` and `.installed` flag file exist. If so, it executes a maintenance `setup:upgrade` and exits cleanly.
3. **Composer Bootstrap:** If `composer.json` is missing, it configures `auth.json` with your Adobe Marketplace credentials and downloads Magento 2 via `composer create-project`.
4. **Database & Core Installation:** Executes `bin/magento setup:install` with 25+ parameters configuring DB credentials, base URL, admin account, Redis, OpenSearch, and RabbitMQ.
5. **Deployment Mode Set:** Switches to `developer` or `production` based on `.env`.
6. **Dependency Injection Compilation:** Runs `bin/magento setup:di:compile` to generate interceptors and factory classes.
7. **Static Asset Deployment:** Executes `bin/magento setup:static-content:deploy -f` for themes and locales.
8. **Varnish FPC Activation:** Sets Varnish as the caching application in Magento's core configuration.
9. **Indexer & Cache Priming:** Performs full catalog reindex (`bin/magento indexer:reindex`) and flushes caches.
10. **Filesystem Permissions & Flagging:** Applies permissions via `permissions.sh` and creates `.installed`.

---

## 11. Service Deep Dives

### Redis Dual Cache & Session Split
MageForge separates Redis into two independent containers:
- **`redis-cache` (Port 6379):**
  - Database 0: Core Magento metadata and system cache.
  - Database 1: Full page cache.
  - Configured with `maxmemory-policy volatile-lru`. If memory fills, safe ephemeral keys are evicted.
- **`redis-session` (Port 6379, internal):**
  - Database 2: Customer shopping carts and login sessions.
  - Configured with `maxmemory-policy noeviction` and AOF persistence (`appendonly yes`).
  - **CRITICAL:** Under high traffic, sessions are NEVER dropped or lost.

### OpenSearch Configuration
- Cluster discovery is set to `single-node`.
- JVM memory options set to `-Xms1024m -Xmx1024m`.
- The internal security plugin is disabled (`plugins.security.disabled: true`) because the container communicates exclusively over the isolated internal Docker bridge network (`mage-network`).

---

## 12. Filesystem Permissions & Security

Magento requires strict permissions across directories:
- **Files:** `644` (`rw-r--r--`)
- **Directories:** `755` (`rwxr-xr-x`)
- **CLI Binary:** `bin/magento` set to executable (`u+x`)
- **Writable Directories:** `var/`, `generated/`, `pub/static/`, `pub/media/`, and `app/etc/` must be writable by the `magento` user and group.

To re-apply permissions at any time, run:
```bash
make permissions
```

---

## 13. Deployment Modes (Developer vs Production)

MageForge supports both Magento deployment modes:

### Developer Mode (`MAGENTO_MODE=developer`)
- Symlinks are used for pub/static files.
- Uncaught exceptions and stack traces are displayed on screen.
- Code generation occurs on demand.
- Xdebug is active and binds to port `9003`.

### Production Mode (`MAGENTO_MODE=production`)
- Static files are compiled and deployed to `pub/static/`.
- Errors are logged to `var/log/` rather than shown to customers.
- OPcache timestamps are frozen (`opcache.validate_timestamps=0`) for maximum throughput.

To toggle modes:
```bash
make mode-dev
# or
make mode-prod
```

---

## 14. Quickstart Guide (Clone to Running)

### Step 1: Clone the repository
```bash
git clone https://github.com/your-org/magento2-project.git
cd magento2-project
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
Open `.env` and add your Adobe Marketplace keys:
```env
COMPOSER_MAGENTO_USERNAME=your_public_access_key
COMPOSER_MAGENTO_PASSWORD=your_private_access_key
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d --build
```
*or using Makefile:*
```bash
make up
```

### Step 4: Follow Installation Progress
```bash
docker compose logs -f php-cli
```
The automated script will initialize the database, install Magento, compile DI, and generate assets. Once you see:
```text
🎉 SUCCESS: Magento 2 Installation Successfully Completed! 🎉
```
Your environment is ready to use!

---

## 15. Useful Developer Commands

### Makefile Shortcuts

| Command | Description |
| :--- | :--- |
| `make up` | Start all containers in the background |
| `make down` | Stop and remove active containers |
| `make restart` | Restart the entire stack |
| `make build` | Rebuild Docker images without cache |
| `make install` | Manually run the automated installer |
| `make cli` | Open interactive bash terminal in `php-cli` |
| `make bash` | Open interactive bash terminal in `php-fpm` |
| `make cache` | Flush Magento cache (`bin/magento cache:flush`) |
| `make reindex` | Reindex all indexers (`bin/magento indexer:reindex`) |
| `make compile` | Run DI compilation & static content deploy |
| `make permissions` | Fix Magento filesystem permissions |
| `make cron-run` | Manually trigger a cron cycle |
| `make cron-logs` | Stream Magento cron output logs |
| `make status` | View container status and healthchecks |
| `make reset` | **DANGER:** Destroy all containers and database volumes |

### Magento CLI Commands (via Docker)

Execute `bin/magento` commands directly through `docker compose`:

```bash
# Check installation status and modules
docker compose exec -u magento php-fpm bin/magento status
docker compose exec -u magento php-fpm bin/magento module:status

# Flush cache
docker compose exec -u magento php-fpm bin/magento cache:flush

# Enable maintenance mode
docker compose exec -u magento php-fpm bin/magento maintenance:enable
docker compose exec -u magento php-fpm bin/magento maintenance:disable

# Create new admin user
docker compose exec -u magento php-fpm bin/magento admin:user:create \
  --admin-user=developer \
  --admin-password=SecurePassword123! \
  --admin-email=dev@example.com \
  --admin-firstname=Dev \
  --admin-lastname=User

# View active store configuration
docker compose exec -u magento php-fpm bin/magento config:show
```

---

## 16. Verification & Health Checks

### URLs and Access Endpoints

| Service | Access URL | Default Credentials |
| :--- | :--- | :--- |
| **Storefront (Varnish FPC)** | [http://localhost/](http://localhost/) | *Public* |
| **Storefront (Direct Nginx)** | [http://localhost:8080/](http://localhost:8080/) | *Public* |
| **Magento Admin Panel** | [http://localhost/admin_secure](http://localhost/admin_secure) | `admin` / `Admin12345Password!` |
| **OpenSearch REST API** | [http://localhost:9200](http://localhost:9200) | *No Auth* |
| **RabbitMQ Management UI** | [http://localhost:15672](http://localhost:15672) | `magento` / `rabbit_secret_pw` |
| **Mailpit Web UI (Emails)** | [http://localhost:8025](http://localhost:8025) | *No Auth* |

### Service Health Verification Commands

```bash
# Verify MySQL connectivity
docker compose exec mysql mysqladmin ping -u magento -pmagento_secret_pw

# Verify OpenSearch cluster health
curl -s http://localhost:9200/_cluster/health | jq .

# Verify Redis Cache
docker compose exec redis-cache redis-cli ping

# Verify Redis Session
docker compose exec redis-session redis-cli ping

# Verify RabbitMQ broker status
docker compose exec rabbitmq rabbitmq-diagnostics check_running
```

---

## 17. Troubleshooting & FAQs

### Q1: Composer fails with `Authentication required (repo.magento.com)`
**Resolution:** Ensure valid Adobe Marketplace keys are specified in `.env`:
`COMPOSER_MAGENTO_USERNAME` (Public Key) and `COMPOSER_MAGENTO_PASSWORD` (Private Key).

### Q2: OpenSearch reports `max virtual memory areas vm.max_map_count [65530] is too low`
**Resolution (Linux hosts):** Run on your host machine:
```bash
sudo sysctl -w vm.max_map_count=262144
```
To persist across reboots, add `vm.max_map_count=262144` to `/etc/sysctl.conf`.

### Q3: File permission errors when saving files or running commands
**Resolution:** Match your host UID/GID in `.env`:
```bash
id -u # Returns your UID (e.g., 1000)
id -g # Returns your GID (e.g., 1000)
```
Set `HOST_UID` and `HOST_GID` in `.env` to match, then run:
```bash
make permissions
```

### Q4: Admin panel redirects in an infinite loop
**Resolution:** Verify that `web/cookie/cookie_domain` and `web/unsecure/base_url` match `http://localhost/`. Clear browser cookies or test in an Incognito window.

---

## 18. Resetting the Environment

To erase all data, delete Docker volumes, and restart completely from scratch:

```bash
make reset
```
*or manually:*
```bash
docker compose down -v --remove-orphans
rm -rf src/.installed src/var/* src/generated/*
docker compose up -d --build
```
