# MageForge: Automated Magento 2 Docker Platform & Testing Suite

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

```text
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
```

### Core Features
- **Zero-Touch Automated Provisioning:** The entrypoint script polls MySQL, OpenSearch, and RabbitMQ readiness, automatically executes `bin/magento setup:install`, compiles Dependency Injection (DI), deploys static assets, configures Varnish, and enables crontabs.
- **Dual Redis Separation:** `redis-cache` runs with `volatile-lru` eviction for ephemeral cache tags, while `redis-session` runs with `noeviction` and Append-Only File (AOF) persistence so shopping carts and customer sessions are never lost.
- **Microservice Isolation:** Background cron tasks (`php-cron`) and interactive developer CLI tasks (`php-cli`) run in separate containers, preventing cron jobs or builds from stealing CPU/memory from customer-facing web workers (`php-fpm`).
- **Developer Experience:** Integrated with Mailpit (`:8025`) for local email capture, Xdebug 3 configuration hooks, and automatic host UID/GID synchronization to eliminate filesystem permission issues.

---

## 2. How to Deploy Locally

### Step 1: System Requirements
Ensure your host machine meets the following prerequisites:
- **Docker Engine:** 24.0.0+ and **Docker Compose:** v2.20.0+
- **Host Resources:** Minimum 8 GB RAM allocated to Docker (12 GB+ recommended), 4 CPU cores, and 25 GB free disk space.
- *Linux Hosts Only:* OpenSearch requires increased virtual memory map areas:
  ```bash
  sudo sysctl -w vm.max_map_count=262144
  ```

### Step 2: Clone or Extract the Project
```bash
cd magento2-project
```

### Step 3: Configure Adobe Marketplace Credentials
Adobe requires a free authentication key pair to download Magento 2 Composer packages from `repo.magento.com`.
1. Log in or create a free account at [marketplace.magento.com](https://marketplace.magento.com/).
2. Under **My Profile** -> **Access Keys**, create a new key pair:
   - **Public Key** = `COMPOSER_MAGENTO_USERNAME`
   - **Private Key** = `COMPOSER_MAGENTO_PASSWORD`
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` and fill in your keys:
   ```env
   COMPOSER_MAGENTO_USERNAME=your_public_key_here
   COMPOSER_MAGENTO_PASSWORD=your_private_key_here
   ```

### Step 4: Launch the Automated Stack
Start the containers in detached mode:
```bash
docker compose up -d --build
```
*Or using the Makefile:*
```bash
make up
```

### Step 5: Follow the Automated Installation Logs
The `php-cli` container orchestrates the setup. Watch the real-time installation progress:
```bash
docker compose logs -f php-cli
```

Once the 10-phase automation finishes, you will see:
```text
🎉 SUCCESS: Magento 2 Installation Successfully Completed! 🎉
Frontend URL:     http://localhost/
Admin Panel:      http://localhost/admin_secure
Admin Username:   admin
Admin Password:   Admin12345Password!
```

---

## 3. How to Access Locally

Once the stack is running, all services are exposed on your host's `localhost`:

| Service | Local URL / Port | Default Credentials | Description |
| :--- | :--- | :--- | :--- |
| **Storefront (Varnish FPC)** | [http://localhost/](http://localhost/) | Public | Sub-15ms cached customer storefront |
| **Storefront (Direct Nginx)** | [http://localhost:8080/](http://localhost:8080/) | Public | Direct Nginx port (bypassing Varnish) |
| **Magento Admin Panel** | [http://localhost/admin_secure](http://localhost/admin_secure) | `admin` / `Admin12345Password!` | Store backoffice & catalog administration |
| **OpenSearch Cluster** | [http://localhost:9200](http://localhost:9200) | No Auth (Internal Network) | Search index REST API & cluster status |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | `magento` / `rabbit_secret_pw` | Message broker queues & live throughput |
| **Mailpit Web UI** | [http://localhost:8025](http://localhost:8025) | No Auth | Local inbox capturing all transactional emails |
| **MySQL Database** | `localhost:3306` | `magento` / `magento_secret_pw` | Database name: `magento` (root: `root_secret_pw`) |
| **Redis Cache** | `localhost:6379` | No Auth | DB 0: Default Cache, DB 1: Page Cache |

---

## 4. Useful Commands

### Makefile Shortcuts
```bash
make up           # Boot containers with dev overrides (Mailpit, Xdebug)
make down         # Stop all active containers gracefully
make cli          # Enter the php-cli container as user 'magento'
make cache        # Clean and flush all Magento caches
make reindex      # Reindex all OpenSearch & catalog indexers
make compile      # Run setup:di:compile & static asset deployment
make permissions  # Reset filesystem permissions to 755/644
make reset        # Fully purge volumes and rebuild from scratch
```

### Docker Compose Commands
```bash
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
```

### Magento 2 CLI Commands (Executed via Docker)
```bash
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
```

---

## 5. Temporary Workload & Performance Testing

To thoroughly test the application under load, verify Varnish caching, stress MySQL and OpenSearch, and generate synthetic customer shopping behavior, use the workload methods below.

### Method A: Automated Workload Script (`test-workload.sh`)

MageForge includes an automated workload generator script located at:
`docker/scripts/test-workload.sh`

Run it directly from your host:
```bash
chmod +x docker/scripts/test-workload.sh
./docker/scripts/test-workload.sh
```

Or execute it inside the container:
```bash
docker compose exec php-cli bash /var/www/scripts/test-workload.sh
```

#### What the workload script simulates:
1. **Warmup Phase:** Requests the homepage to prime Varnish and OPcache.
2. **Varnish Cache Hit Verification:** Measures latency on repeated requests (`X-Magento-Tags`, `X-Cache: HIT` vs `MISS`, sub-15ms check).
3. **Catalog & Search Spike:** Sends concurrent search queries (`?q=jacket`, `?q=shirt`, `?q=pants`, `?q=watch`) directly to OpenSearch.
4. **Session & Cart Concurrency:** Simulates multi-user shopping sessions with unique session cookies hitting Redis session storage.
5. **Backend Database Stress:** Generates read requests against category routes and customer login endpoints.
6. **Live Diagnostics Report:** Outputs latency percentiles, Varnish hit ratio, Redis memory usage, and MySQL connection counts.

---

### Method B: Generating Official Magento Performance Fixtures

Magento 2 includes a native performance toolkit capable of generating thousands of sample products, categories, customers, and orders to test realistic data loads.

Generate a **Small** performance fixture (800 products, 30 categories, 20 customers):
```bash
docker compose exec -u magento php-cli bin/magento setup:perf:generate-fixtures \
  /var/www/html/setup/performance-toolkit/profiles/ce/small.xml
```

After generating fixtures, reindex and flush cache:
```bash
docker compose exec -u magento php-cli bin/magento indexer:reindex
docker compose exec -u magento php-cli bin/magento cache:flush
```

---

### Method C: Synthetic HTTP Load Testing (Apache Benchmark / `curl` / `wrk`)

#### 1. Test Varnish High-Concurrency Cache (Port 80)
Simulate 1,000 requests with 50 concurrent connections against Varnish:
```bash
# Using Apache Benchmark (ab)
ab -n 1000 -c 50 -k http://localhost/

# Or using wrk (if installed)
wrk -t4 -c50 -d30s http://localhost/
```
*Expected Result:* **1,500+ requests/sec**, sub-10ms response time, 0% CPU strain on PHP-FPM.

#### 2. Test Uncached PHP-FPM / Direct Nginx (Port 8080)
Compare by running the same test directly against Nginx/PHP-FPM, bypassing Varnish:
```bash
ab -n 100 -c 10 http://localhost:8080/
```
*Expected Result:* Requests will route through PHP-FPM and MySQL. Compare the latency difference to demonstrate Varnish acceleration.

#### 3. Test OpenSearch Catalog Search Spike
Send 200 concurrent search queries to simulate a flash sale search spike:
```bash
ab -n 200 -c 20 "http://localhost/catalogsearch/result/?q=shoes"
```

---

### Method D: Real-Time Workload Monitoring

While running any workload, open a separate terminal window to inspect the microservices live:

```bash
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
```

---

## 6. Verification Checklist

- [ ] Varnish responds on `http://localhost/` with `X-Magento-Cache-Debug: HIT` (or `MISS` on first load).
- [ ] Admin panel is accessible at `http://localhost/admin_secure`.
- [ ] Redis session keys increment as users browse.
- [ ] OpenSearch reports `status: green` or `yellow` at `http://localhost:9200/_cluster/health`.
- [ ] Background cron runs cleanly every 60s in `docker compose logs -f php-cron`.
- [ ] Transactional emails appear in Mailpit at `http://localhost:8025/`.
