# ==============================================================================
# MageForge: Varnish Cache 7.x Accelerator for Magento 2
# ==============================================================================
FROM varnish:7.4-alpine

LABEL maintainer="MageForge Core Team"
LABEL description="Optimized Varnish Full Page Cache (FPC) for Magento 2.4"

ENV VARNISH_SIZE=256M
ENV VARNISH_HTTP_PORT=80

COPY default.vcl /etc/varnish/default.vcl

EXPOSE 80

CMD ["varnishd", "-F", "-f", "/etc/varnish/default.vcl", "-s", "malloc,256m", "-a", "0.0.0.0:80"]
