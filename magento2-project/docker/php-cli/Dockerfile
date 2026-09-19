# ==============================================================================
# MageForge: Dedicated PHP-CLI for Composer & bin/magento Execution
# ==============================================================================
FROM php:8.2-cli-bookworm

LABEL maintainer="MageForge Core Team"
LABEL description="Optimized PHP-CLI container with Composer and dev toolchain for Magento 2"

ENV DEBIAN_FRONTEND=noninteractive \
    MAGENTO_ROOT=/var/www/html \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1

# Install runtime and build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libicu-dev \
    libxml2-dev \
    libxslt1-dev \
    libzip-dev \
    libsodium-dev \
    libonig-dev \
    procps \
    default-mysql-client \
    netcat-traditional \
    jq \
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

# Install Redis extension
RUN pecl install redis-6.0.2 \
    && docker-php-ext-enable redis

# Install Composer v2 (Latest official binary)
COPY --from=composer:2.7 /usr/bin/composer /usr/local/bin/composer

# Create non-root magento user
ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g ${HOST_GID} magento \
    && useradd -u ${HOST_UID} -g magento -m -s /bin/bash magento \
    && mkdir -p /var/www/html /var/www/.composer \
    && chown -R magento:magento /var/www

COPY php.ini /usr/local/etc/php/conf.d/99-magento-cli.ini

WORKDIR /var/www/html

USER magento

ENTRYPOINT ["/bin/bash"]
CMD ["-c", "tail -f /dev/null"]
