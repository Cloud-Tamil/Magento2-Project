# ==============================================================================
# MageForge: Advanced Developer Automation Makefile
# ==============================================================================
.DEFAULT_GOAL := help
SHELL := /bin/bash

# Configuration
COMPOSE_FILE := docker-compose.yml
COMPOSE_DEV_FILE := docker-compose.dev.yml
ENV_FILE := .env

include $(ENV_FILE)
export $(shell sed 's/=.*//' $(ENV_FILE) 2>/dev/null)

.PHONY: help setup up down restart build install logs cli bash cron-logs cache reindex compile permissions reset

help: ## Show this help message
	@echo "=========================================================================="
	@echo " MageForge Magento 2 Developer Control Center"
	@echo "=========================================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## Initial copy of .env.example to .env
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env from .env.example. Please review your credentials."; else echo ".env already exists."; fi

up: ## Start all containers in background with dev overrides
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) up -d

down: ## Stop all active containers
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) down

restart: down up ## Restart the stack

build: ## Rebuild Docker images without cache
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) build --no-cache

install: ## Run the automated end-to-end Magento installer
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) run --rm php-cli /var/www/scripts/install-magento.sh

cli: ## Open an interactive bash shell in the PHP-CLI container
	docker compose -f $(COMPOSE_FILE) exec -u magento php-cli bash

bash: ## Open an interactive shell inside PHP-FPM
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

mode-dev: ## Switch to developer mode
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bin/magento deploy:mode:set developer

mode-prod: ## Switch to production mode
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm bin/magento deploy:mode:set production

permissions: ## Fix file and folder permissions across the codebase
	docker compose -f $(COMPOSE_FILE) exec -u root php-fpm /var/www/scripts/permissions.sh

cron-run: ## Manually trigger Magento cron cycle
	docker compose -f $(COMPOSE_FILE) exec -u magento php-cron php bin/magento cron:run

cron-logs: ## Follow isolated cron logs
	docker compose -f $(COMPOSE_FILE) exec -u magento php-fpm tail -f var/log/magento.cron.log

status: ## Inspect container status and healthchecks
	docker compose -f $(COMPOSE_FILE) ps

reset: ## DANGER: Destroy all containers, networks, and persistent database volumes
	@read -p "Are you sure you want to completely erase all data? [y/N] " ans && [ $${ans:-N} = y ]
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	rm -f src/.installed
	@echo "Environment completely reset."
