vcl 4.1;

import std;

backend default {
    .host = "nginx";
    .port = "8080";
    .first_byte_timeout = 600s;
    .between_bytes_timeout = 600s;
    .probe = {
        .url = "/ping";
        .timeout = 2s;
        .interval = 5s;
        .window = 10;
        .threshold = 5;
    }
}

acl purge {
    "localhost";
    "127.0.0.1";
    "::1";
    "php-fpm";
    "php-cli";
    "nginx";
}

sub vcl_recv {
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Method not allowed"));
        }
        if (!req.http.X-Magento-Tags-Pattern) {
            return (synth(400, "X-Magento-Tags-Pattern header required"));
        }
        ban("obj.http.X-Magento-Tags ~ " + req.http.X-Magento-Tags-Pattern);
        return (synth(200, "Purged"));
    }

    if (req.method != "GET" &&
        req.method != "HEAD" &&
        req.method != "PUT" &&
        req.method != "POST" &&
        req.method != "TRACE" &&
        req.method != "OPTIONS" &&
        req.method != "DELETE") {
        return (pipe);
    }

    # Don't cache non-cacheable requests
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    # Bypass Varnish cache for Admin, GraphQL mutators, APIs, and setup
    if (req.url ~ "^/(pub/)?(admin_secure|admin|api|graphql)") {
        return (pass);
    }

    # Static assets directly handled
    if (req.url ~ "^/(pub/)?(media|static)/") {
        return (hash);
    }

    return (hash);
}

sub vcl_hash {
    hash_data(req.url);
    if (req.http.host) {
        hash_data(req.http.host);
    } else {
        hash_data(server.ip);
    }
    if (req.http.X-Magento-Vary) {
        hash_data(req.http.X-Magento-Vary);
    }
    return (lookup);
}

sub vcl_backend_response {
    if (beresp.http.X-Magento-Debug) {
        set beresp.http.X-Magento-Cache-Control = beresp.http.Cache-Control;
    }

    if (beresp.status >= 400) {
        set beresp.ttl = 0s;
        set beresp.uncacheable = true;
        return (deliver);
    }

    if (beresp.http.Cache-Control ~ "private") {
        set beresp.uncacheable = true;
        set beresp.ttl = 86400s;
        return (deliver);
    }

    if (beresp.http.X-Magento-Lifetime) {
        set beresp.ttl = std.duration(beresp.http.X-Magento-Lifetime + "s", 86400s);
    } else {
        set beresp.ttl = 86400s;
    }

    return (deliver);
}

sub vcl_deliver {
    if (resp.http.X-Magento-Debug) {
        if (obj.hits > 0) {
            set resp.http.X-Magento-Cache-Debug = "HIT";
        } else {
            set resp.http.X-Magento-Cache-Debug = "MISS";
        }
    } else {
        unset resp.http.X-Magento-Debug;
        unset resp.http.X-Magento-Tags;
        unset resp.http.X-Powered-By;
        unset resp.http.Server;
    }
    return (deliver);
}
