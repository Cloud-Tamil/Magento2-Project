# ==============================================================================
# MageForge: Dedicated Magento Cron Runner Container
# ==============================================================================
FROM php:8.2-cli-bookworm

LABEL maintainer="MageForge Core Team"
LABEL description="Isolated Magento 2.4 Cron Execution Container"

ENV DEBIAN_FRONTEND=noninteractive \
    MAGENTO_ROOT=/var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    cron \
    procps \
    default-mysql-client \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libicu-dev \
    libxml2-dev \
    libxslt1-dev \
    libzip-dev \
    libsodium-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        pdo_mysql \
        soap \
        sockets \
        xsl \
        zip \
        sodium

RUN pecl install redis-6.0.2 && docker-php-ext-enable redis

ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g ${HOST_GID} magento \
    && useradd -u ${HOST_UID} -g magento -m -s /bin/bash magento

COPY crontab /etc/cron.d/magento-cron
RUN chmod 0644 /etc/cron.d/magento-cron \
    && crontab -u magento /etc/cron.d/magento-cron

WORKDIR /var/www/html

CMD ["cron", "-f", "-l", "2"]
