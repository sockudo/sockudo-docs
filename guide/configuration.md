# Configuration Overview

Sockudo is designed to be highly configurable to suit various deployment needs, from small single-instance setups to large, horizontally-scaled clusters. You can configure Sockudo using a JSON file or environment variables.

## Configuration Methods

There are two primary ways to configure your Sockudo server:

1.  **JSON Configuration File**:
    * By default, Sockudo attempts to load a configuration file named `config.json` from the `config/` directory (relative to where the binary is run).
    * You can specify a custom path to your configuration file using the `--config` command-line argument:
        ```bash
        ./target/release/sockudo --config=/path/to/your/custom-config.json
        ```
    * The JSON file structure directly mirrors the `ServerOptions` Rust struct found in `src/options.rs`.

2.  **Environment Variables**:
    * Most configuration options can be set using environment variables.
    * Environment variables typically override values set in the JSON configuration file.
    * The naming convention for environment variables usually follows `SCREAMING_SNAKE_CASE` derived from the JSON keys.

## Configuration Precedence

Sockudo applies configuration in the following order of precedence (lower numbers are overridden by higher numbers):

1.  **Default Values**: Hardcoded default values within the `ServerOptions` struct.
2.  **JSON Configuration File**: Values loaded from the specified JSON file.
3.  **Environment Variables**: Values set through environment variables.

This means an environment variable will always take precedence over a value set in the `config.json` file, which in turn takes precedence over the compiled-in defaults.

## Main Configuration Sections

The configuration is broken down into several key areas:

### Server Options

Core server settings such as host, port, debug mode, and SSL configuration.

```json
{
  "debug": false,
  "host": "0.0.0.0",
  "port": 6001,
  "mode": "production",
  "path_prefix": "/",
  "shutdown_grace_period": 10,
  "websocket_max_payload_kb": 64,
  "user_authentication_timeout": 3600
}
```

**Environment Variables:**
- `HOST` - Server host
- `PORT` - Server port
- `DEBUG` - Enable debug mode
- `SSL_ENABLED` - Enable SSL/TLS
- `SSL_CERT_PATH` - Path to SSL certificate
- `SSL_KEY_PATH` - Path to SSL private key

### Adapter Configuration

Configures how Sockudo communicates and scales across multiple instances (e.g., Local, Redis, NATS, Redis Cluster).

```json
{
  "adapter": {
    "driver": "local",
    "redis": {
      "requests_timeout": 5000,
      "prefix": "sockudo_adapter:",
      "cluster_mode": false,
      "redis_pub_options": {},
      "redis_sub_options": {}
    },
    "cluster": {
      "nodes": [],
      "prefix": "sockudo_cluster:",
      "request_timeout_ms": 5000,
      "use_connection_manager": true
    },
    "nats": {
      "servers": ["nats://nats:4222"],
      "prefix": "sockudo_nats:",
      "request_timeout_ms": 5000,
      "connection_timeout_ms": 5000
    }
  }
}
```

**Environment Variables:**
- `ADAPTER_DRIVER` - Adapter type: "local", "redis", "redis-cluster", "nats"
- `REDIS_URL` - Redis connection URL (used by multiple components)

### App Manager Configuration

Manages your applications (credentials, settings) using backends like Memory, MySQL, PostgreSQL, or DynamoDB. Supports per-app security settings including origin validation for WebSocket connections.

```json
{
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "app1",
          "key": "key1",
          "secret": "secret1",
          "max_connections": 1000,
          "enable_client_messages": true,
          "enabled": true,
          "max_client_events_per_second": 10000,
          "max_backend_events_per_second": null,
          "max_read_requests_per_second": null,
          "max_presence_members_per_channel": null,
          "max_presence_member_size_in_kb": null,
          "max_channel_name_length": null,
          "max_event_channels_at_once": null,
          "max_event_name_length": null,
          "max_event_payload_in_kb": null,
          "max_event_batch_size": null,
          "enable_user_authentication": null,
          "webhooks": null,
          "enable_watchlist_events": null,
          "allowed_origins": [
            "https://app.example.com",
            "*.staging.example.com",
            "localhost:3000"
          ]
        }
      ]
    },
    "cache": {
      "enabled": true,
      "ttl": 300
    }
  }
}
```

**Environment Variables:**
- `APP_MANAGER_DRIVER` - App manager type: "memory", "mysql", "postgres", "dynamodb"

### Cache Configuration

Settings for caching mechanisms (e.g., Memory, Redis) to improve performance.

```json
{
  "cache": {
    "driver": "redis",
    "redis": {
      "prefix": "sockudo_cache:",
      "cluster_mode": false
    },
    "memory": {
      "ttl": 300,
      "cleanup_interval": 60,
      "max_capacity": 10000
    }
  }
}
```

**Environment Variables:**
- `CACHE_DRIVER` - Cache driver: "memory", "redis", "redis-cluster", "none"

### Database Configuration

Centralized configuration for various database connections.

```json
{
  "database": {
    "redis": {
      "host": "redis",
      "port": 6379,
      "db": 0,
      "key_prefix": "sockudo:",
      "sentinels": [],
      "cluster_nodes": []
    },
    "mysql": {
      "host": "mysql",
      "port": 3306,
      "username": "sockudo",
      "password": "sockudo123",
      "database": "sockudo",
      "table_name": "applications",
      "connection_pool_size": 10,
      "cache_ttl": 300,
      "cache_cleanup_interval": 60,
      "cache_max_capacity": 100
    },
    "postgres": {
      "host": "postgres",
      "port": 5432,
      "username": "sockudo",
      "password": "sockudo123",
      "database": "sockudo",
      "table_name": "applications",
      "connection_pool_size": 10,
      "cache_ttl": 300,
      "cache_cleanup_interval": 60,
      "cache_max_capacity": 100
    },
    "dynamodb": {
      "region": "us-east-1",
      "table_name": "sockudo-applications"
    }
  }
}
```

### Queue Configuration

Configuration for background job processing and message queuing (e.g., Memory, Redis, SQS), often used by webhooks.

```json
{
  "queue": {
    "driver": "redis",
    "redis": {
      "concurrency": 5,
      "prefix": "sockudo_queue:",
      "cluster_mode": false
    },
    "redis_cluster": {
      "concurrency": 5,
      "prefix": "sockudo_queue:",
      "nodes": [],
      "request_timeout_ms": 5000
    },
    "sqs": {
      "region": "us-east-1",
      "visibility_timeout": 30,
      "max_messages": 10,
      "wait_time_seconds": 5,
      "concurrency": 5,
      "fifo": false
    }
  }
}
```

**Environment Variables:**
- `QUEUE_DRIVER` - Queue driver: "memory", "redis", "redis-cluster", "sqs", "none"

### Rate Limiter Configuration

Protects your server from abuse by limiting request rates.

```json
{
  "rate_limiter": {
    "enabled": true,
    "driver": "redis",
    "api_rate_limit": {
      "max_requests": 100,
      "window_seconds": 60,
      "identifier": "api",
      "trust_hops": 0
    },
    "websocket_rate_limit": {
      "max_requests": 20,
      "window_seconds": 60,
      "identifier": "websocket_connect",
      "trust_hops": 0
    },
    "redis": {
      "prefix": "sockudo_rl:",
      "cluster_mode": false
    }
  }
}
```

**Environment Variables:**
- `RATE_LIMITER_ENABLED` - Enable rate limiting
- `RATE_LIMITER_DRIVER` - Rate limiter driver: "memory", "redis", "redis-cluster"

### Metrics Configuration

Enables and configures performance metrics exposure (e.g., Prometheus).

```json
{
  "metrics": {
    "enabled": true,
    "driver": "prometheus",
    "host": "0.0.0.0",
    "port": 9601,
    "prometheus": {
      "prefix": "sockudo_"
    }
  }
}
```

**Environment Variables:**
- `METRICS_ENABLED` - Enable metrics
- `METRICS_HOST` - Metrics server host
- `METRICS_PORT` - Metrics server port
- `METRICS_DRIVER` - Metrics driver
- `METRICS_PROMETHEUS_PREFIX` - Metrics Prometheus prefix

### SSL Configuration

```json
{
  "ssl": {
    "enabled": false,
    "cert_path": "/app/ssl/cert.pem",
    "key_path": "/app/ssl/key.pem",
    "redirect_http": false,
    "http_port": 80
  }
}
```

### CORS Configuration

```json
{
  "cors": {
    "credentials": true,
    "origin": ["*"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allowed_headers": [
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "Accept"
    ]
  }
}
```

**Environment Variables:**
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `CORS_METHODS` - Allowed methods
- `CORS_HEADERS` - Allowed headers
- `CORS_CREDENTIALS` - Allow credentials

### Webhooks Configuration

Configuration for sending event notifications to your application.

```json
{
  "webhooks": {
    "batching": {
      "enabled": true,
      "duration": 50
    }
  }
}
```

### Other Configuration Options

#### Channel Limits
```json
{
  "channel_limits": {
    "max_name_length": 200,
    "cache_ttl": 3600
  }
}
```

#### Event Limits
```json
{
  "event_limits": {
    "max_channels_at_once": 100,
    "max_name_length": 200,
    "max_payload_in_kb": 100,
    "max_batch_size": 10
  }
}
```

#### Presence Channel Configuration
```json
{
  "presence": {
    "max_members_per_channel": 100,
    "max_member_size_in_kb": 2
  }
}
```

#### HTTP API Configuration
```json
{
  "http_api": {
    "request_limit_in_mb": 10,
    "accept_traffic": {
      "memory_threshold": 0.90
    }
  }
}
```

#### Instance Configuration
```json
{
  "instance": {
    "process_id": "sockudo-docker-1"
  }
}
```

#### Database Pooling
```json
{
  "database_pooling": {
    "enabled": true,
    "min": 2,
    "max": 10
  }
}
```

## Environment Variable Reference

Common environment variables for quick configuration:

### Basic Settings
```bash
HOST=0.0.0.0
PORT=6001
DEBUG=false
```

### Drivers
```bash
ADAPTER_DRIVER=redis
APP_MANAGER_DRIVER=memory
CACHE_DRIVER=redis
QUEUE_DRIVER=redis
RATE_LIMITER_DRIVER=redis
```

### Database
```bash
REDIS_URL=redis://redis:6379/0
DATABASE_MYSQL_HOST=mysql
DATABASE_MYSQL_USER=sockudo
DATABASE_MYSQL_PASSWORD=your_password
DATABASE_MYSQL_DATABASE=sockudo
```

### Application Defaults
```bash
SOCKUDO_DEFAULT_APP_ID=demo-app
SOCKUDO_DEFAULT_APP_KEY=demo-key
SOCKUDO_DEFAULT_APP_SECRET=demo-secret
SOCKUDO_ENABLE_CLIENT_MESSAGES=true
SOCKUDO_DEFAULT_APP_ALLOWED_ORIGINS=https://app.example.com,*.example.com,localhost:3000
```

### AWS Configuration
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

For a complete list of all configuration options and their defaults, refer to the `src/options.rs` file in the source code.
