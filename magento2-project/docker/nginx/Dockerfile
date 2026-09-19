# ==============================================================================
# MageForge: Production-Ready Nginx Web Server for Magento 2
# ==============================================================================
FROM nginx:1.25-alpine

LABEL maintainer="MageForge Core Team"
LABEL description="High-performance Nginx reverse proxy / FastCGI server for Magento 2"

# Add non-root magento user matching PHP containers
ARG HOST_UID=1000
ARG HOST_GID=1000
RUN addgroup -g ${HOST_GID} magento \
    && adduser -u ${HOST_UID} -G magento -D -s /bin/sh magento

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY conf.d/magento.conf /etc/nginx/conf.d/magento.conf

WORKDIR /var/www/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
