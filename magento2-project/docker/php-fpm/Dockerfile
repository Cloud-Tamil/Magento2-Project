# ==============================================================================
# MageForge: Production-Ready PHP-FPM for Magento 2.4.x
# Base: PHP 8.2 FPM Alpine / Debian
# ==============================================================================
FROM php:8.2-fpm-bookworm

LABEL maintainer="MageForge Core Team"
LABEL description="Optimized PHP-FPM container for Magento 2.4 Enterprise/Community"

# Environment configuration
ENV DEBIAN_FRONTEND=noninteractive \
    MAGENTO_ROOT=/var/www/html \
    COMPOSER_ALLOW_SUPERUSER=1

# Install system dependencies required for Magento 2 extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libxpm-dev \
    libicu-dev \
    libxml2-dev \
    libxslt1-dev \
    libzip-dev \
    libsodium-dev \
    libonig-dev \
    procps \
    default-mysql-client \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Configure & Install PHP Extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        pdo_mysql \
        soap \
        sockets \
        xsl \
        zip \
        sodium \
        opcache \
        pcntl

# Install Redis extension via PECL
RUN pecl install redis-6.0.2 \
    && docker-php-ext-enable redis

# Create non-root magento user with customizable UID/GID
ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g ${HOST_GID} magento \
    && useradd -u ${HOST_UID} -g magento -m -s /bin/bash magento \
    && mkdir -p /var/www/html /var/www/.composer /var/log \
    && touch /var/log/php-fpm.slow.log \
    && chown -R magento:magento /var/www /var/log/php-fpm.slow.log

# Copy PHP and FPM configuration files
COPY php.ini /usr/local/etc/php/conf.d/99-magento.ini
COPY opcache.ini /usr/local/etc/php/conf.d/10-opcache.ini
COPY www.conf /usr/local/etc/php-fpm.d/www.conf

WORKDIR /var/www/html

EXPOSE 9000

USER magento

CMD ["php-fpm", "-F"]
