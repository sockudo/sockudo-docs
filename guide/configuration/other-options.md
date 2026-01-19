# Other Configuration Options

This section covers various other configuration areas within Sockudo's `ServerOptions` that control aspects like channel and event limits, database connections, presence channel behavior, HTTP API settings, and database pooling.

## Channel Limits (`channel_limits`)

Settings that define limits related to channels.

* **JSON Key (Parent)**: `channel_limits`

### `channel_limits.max_name_length`
* **JSON Key**: `max_name_length`
* **Type**: `integer` (u32)
* **Description**: The maximum allowed length for a channel name.
* **Default Value**: `200`

### `channel_limits.cache_ttl`
* **JSON Key**: `cache_ttl`
* **Type**: `integer` (u64, seconds)
* **Description**: Time-to-live for cached channel-related information (e.g., existence, type).
* **Default Value**: `3600` (1 hour)

**Example (`config.json`)**:
```json
{
  "channel_limits": {
    "max_name_length": 150,
    "cache_ttl": 1800
  }
}
```

## Event Limits (`event_limits`)

Defines various limits related to events published on channels.

* **JSON Key (Parent)**: `event_limits`

### `event_limits.max_channels_at_once`
* **JSON Key**: `max_channels_at_once`
* **Type**: `integer` (u32)
* **Description**: Maximum number of channels an event can be published to in a single API call.
* **Default Value**: `100`

### `event_limits.max_name_length`
* **JSON Key**: `max_name_length`
* **Type**: `integer` (u32)
* **Description**: Maximum length for an event name.
* **Default Value**: `200`

### `event_limits.max_payload_in_kb`
* **JSON Key**: `max_payload_in_kb`
* **Type**: `integer` (u32)
* **Description**: Maximum payload size for a single event in kilobytes.
* **Default Value**: `100`

### `event_limits.max_batch_size`
* **JSON Key**: `max_batch_size`
* **Type**: `integer` (u32)
* **Description**: Maximum number of events in a batch API call.
* **Default Value**: `10`

**Example (`config.json`)**:
```json
{
  "event_limits": {
    "max_channels_at_once": 50,
    "max_name_length": 150,
    "max_payload_in_kb": 50,
    "max_batch_size": 5
  }
}
```

## Presence Channel Configuration (`presence`)

Settings specific to presence channels.

* **JSON Key (Parent)**: `presence`

### `presence.max_members_per_channel`
* **JSON Key**: `max_members_per_channel`
* **Type**: `integer` (u32)
* **Description**: Maximum number of members allowed in a single presence channel.
* **Default Value**: `100`

### `presence.max_member_size_in_kb`
* **JSON Key**: `max_member_size_in_kb`
* **Type**: `integer` (u32)
* **Description**: Maximum size in kilobytes for the `user_info` data associated with a presence channel member.
* **Default Value**: `2`

**Example (`config.json`)**:
```json
{
  "presence": {
    "max_members_per_channel": 50,
    "max_member_size_in_kb": 1
  }
}
```

## HTTP API Configuration (`http_api`)

Settings specific to the behavior of the HTTP API.

* **JSON Key (Parent)**: `http_api`

### `http_api.request_limit_in_mb`
* **JSON Key**: `request_limit_in_mb`
* **Type**: `integer` (u32)
* **Description**: Maximum request body size in megabytes for HTTP API endpoints.
* **Default Value**: `10`

### Traffic Acceptance (`http_api.accept_traffic`)
* **JSON Key (Parent Object)**: `http_api.accept_traffic`

#### `http_api.accept_traffic.memory_threshold`
* **JSON Key**: `memory_threshold`
* **Type**: `float` (f64, 0.0 to 1.0)
* **Description**: A memory usage threshold. If system memory usage exceeds this, the server might start rejecting traffic.
* **Default Value**: `0.90` (90%)

**Example (`config.json`)**:
```json
{
  "http_api": {
    "request_limit_in_mb": 5,
    "accept_traffic": {
      "memory_threshold": 0.85
    }
  }
}
```

## Database Configuration (`database`)

Centralized configuration for various database connections that Sockudo might use (e.g., for App Manager, Cache, Queue backends if not using specific overrides).

* **JSON Key (Parent)**: `database`

### MySQL Connection (`database.mysql`)
* **JSON Key (Parent Object)**: `database.mysql`

**Configuration Fields:**
- **`host`** (string): Default: `"mysql"`
- **`port`** (integer, u16): Default: `3306`
- **`username`** (string): Default: `"sockudo"`
- **`password`** (string): Default: `"sockudo123"`
- **`database`** (string): Default: `"sockudo"`
- **`table_name`** (string): Default table name for app manager if MySQL driver is used. Default: `"applications"`
- **`connection_pool_size`** (integer, u32): Max connections in the pool. Default: `10`
- **`cache_ttl`** (integer, u64, seconds): TTL for items cached by this DB connection. Default: `300`
- **`cache_cleanup_interval`** (integer, u64, seconds): Default: `60`
- **`cache_max_capacity`** (integer, u64): Default: `100`

### PostgreSQL Connection (`database.postgres`)
* **JSON Key (Parent Object)**: `database.postgres`

**Configuration Fields:**
- **`host`** (string): Default: `"postgres"`
- **`port`** (integer, u16): Default: `5432`
- **`username`** (string): Default: `"sockudo"`
- **`password`** (string): Default: `"sockudo123"`
- **`database`** (string): Default: `"sockudo"`
- **`table_name`** (string): Default: `"applications"`
- **`connection_pool_size`** (integer, u32): Default: `10`
- **`cache_ttl`** (integer, u64, seconds): Default: `300`
- **`cache_cleanup_interval`** (integer, u64, seconds): Default: `60`
- **`cache_max_capacity`** (integer, u64): Default: `100`

### Redis Connection (`database.redis`)
This is the global Redis configuration, used by Cache, Queue, Rate Limiter, or Adapters if they don't have specific overrides.

* **JSON Key (Parent Object)**: `database.redis`

**Configuration Fields:**
- **`host`** (string): Default: `"redis"`
- **`port`** (integer, u16): Default: `6379`
- **`db`** (integer, u32): Redis database number. Default: `0`
- **`username`** (string, optional): Default: `null`
- **`password`** (string, optional): Default: `null`
- **`key_prefix`** (string): Global prefix for keys if this connection is used. Default: `"sockudo:"`
- **`sentinels`** (array of `RedisSentinel` objects, optional): For Redis Sentinel setup. Default: `[]`
  - `RedisSentinel` object: `{ "host": "localhost", "port": 26379 }`
- **`sentinel_password`** (string, optional): Password for connecting to Sentinels. Default: `null`
- **`name`** (string): Master name for Sentinel. Default: `"mymaster"`
- **`cluster_nodes`** (array of `ClusterNode` objects, optional): For Redis Cluster setup. Default: `[]`
  - `ClusterNode` object: `{ "host": "127.0.0.1", "port": 7000 }`
  - The `host` field supports protocol specification for TLS/SSL connections:
    - Plain: `"127.0.0.1"` (uses `redis://` by default)
    - With protocol: `"redis://127.0.0.1"` or `"rediss://secure.example.com"` (for TLS)
    - With port in URL: `"rediss://secure.example.com:7000"` (URL port takes precedence)

### DynamoDB Settings (`database.dynamodb`)
Used if `app_manager.driver` is `"dynamodb"`.

* **JSON Key (Parent Object)**: `database.dynamodb`

**Configuration Fields:**
- **`region`** (string): AWS Region. Default: `"us-east-1"`
- **`table_name`** (string): DynamoDB table name. Default: `"sockudo-applications"`
- **`endpoint_url`** (string, optional): For local testing (e.g., LocalStack). Default: `null`
- **`aws_access_key_id`** (string, optional): Explicit AWS credentials. Default: `null` (uses SDK default chain)
- **`aws_secret_access_key`** (string, optional): Default: `null`
- **`aws_profile_name`** (string, optional): AWS profile name from shared credentials file. Default: `null`

**Example (`config.json` for databases)**:
```json
{
  "database": {
    "mysql": {
      "host": "mysql-server.example.com",
      "port": 3306,
      "username": "sockudo_user",
      "password": "secure_password",
      "database": "sockudo_prod",
      "table_name": "applications",
      "connection_pool_size": 15
    },
    "postgres": {
      "host": "postgres-server.example.com",
      "port": 5432,
      "username": "sockudo_user",
      "password": "secure_password",
      "database": "sockudo_prod"
    },
    "redis": {
      "host": "redis.example.com",
      "port": 6379,
      "db": 0,
      "key_prefix": "prod_sockudo:",
      "password": "redis_password"
    },
    "dynamodb": {
      "region": "eu-central-1",
      "table_name": "prod-sockudo-apps"
    }
  }
}
```

**Environment Variables for Database Configuration:**
```bash
# MySQL
DATABASE_MYSQL_HOST=mysql-server.example.com
DATABASE_MYSQL_USER=sockudo_user
DATABASE_MYSQL_PASSWORD=secure_password
DATABASE_MYSQL_DATABASE=sockudo_prod

# PostgreSQL
DATABASE_POSTGRES_HOST=postgres-server.example.com
DATABASE_POSTGRES_USER=sockudo_user
DATABASE_POSTGRES_PASSWORD=secure_password
DATABASE_POSTGRES_DATABASE=sockudo_prod

# Redis
REDIS_URL=redis://redis.example.com:6379/0
DATABASE_REDIS_PASSWORD=redis_password

# DynamoDB
AWS_REGION=eu-central-1
```

## Logging Configuration (`logging`)

Settings that control the logging output format and behavior.

* **JSON Key (Parent)**: `logging`

### Log Output Format

* **Environment Variable Only**: `LOG_OUTPUT_FORMAT`
* **Type**: `enum` (string)
* **Description**: Controls the output format of logs. Must be set as an environment variable at startup.
* **Default Value**: `"human"`
* **Possible Values**:
  * `"human"`: Human-readable format with optional colors
  * `"json"`: Structured JSON format for log aggregation systems

**Important**: This setting can ONLY be configured via environment variable at startup and cannot be set in the config file due to technical limitations in the tracing library.

### `logging.colors_enabled`
* **JSON Key**: `colors_enabled`
* **Environment Variable**: `LOG_COLORS_ENABLED`
* **Type**: `boolean`
* **Description**: Enable or disable colors in human-readable log output. Only applies when `LOG_OUTPUT_FORMAT` is `"human"`. Useful for production environments where logs are processed by external systems.
* **Default Value**: `true`

### `logging.include_target`
* **JSON Key**: `include_target`
* **Environment Variable**: `LOG_INCLUDE_TARGET`
* **Type**: `boolean`
* **Description**: Include the module target/source in log messages. Helpful for debugging to identify which module generated a log entry.
* **Default Value**: `true`

**Example (`config.json`)**:
```json
{
  "logging": {
    "colors_enabled": false,
    "include_target": true
  }
}
```

**Environment Variables:**
```bash
# Set output format (must be set at startup)
LOG_OUTPUT_FORMAT=json     # JSON format for log aggregation
LOG_OUTPUT_FORMAT=human    # Human-readable format (default)

# These can be set via config file or environment
LOG_COLORS_ENABLED=false  # Disable colors for clean log output
LOG_INCLUDE_TARGET=true    # Include module information in logs
```

### Production Logging Examples

**For log aggregation systems (Fluentd, Logstash, etc.)**:
```bash
LOG_OUTPUT_FORMAT=json ./target/release/sockudo
```

**For human-readable logs without colors**:
```bash
LOG_OUTPUT_FORMAT=human LOG_COLORS_ENABLED=false ./target/release/sockudo
```

**JSON format benefits**:
- Single-line JSON objects per log entry
- No color codes that interfere with parsing
- Structured data for better filtering and analysis
- Compatible with log aggregation tools

## Database Pooling (`database_pooling`)

General settings for database connection pooling, applied to database connections that support pooling.

* **JSON Key (Parent)**: `database_pooling`

### `database_pooling.enabled`
* **JSON Key**: `enabled`
* **Type**: `boolean`
* **Description**: Whether to enable connection pooling for database connections.
* **Default Value**: `true`

### `database_pooling.min`
* **JSON Key**: `min`
* **Type**: `integer` (u32)
* **Description**: Minimum number of connections to maintain in the pool.
* **Default Value**: `2`

### `database_pooling.max`
* **JSON Key**: `max`
* **Type**: `integer` (u32)
* **Description**: Maximum number of connections allowed in the pool.
* **Default Value**: `10`

**Example (`config.json`)**:
```json
{
  "database_pooling": {
    "enabled": true,
    "min": 5,
    "max": 20
  }
}
```

**Environment Variables:**
```bash
DATABASE_CONNECTION_POOL_SIZE=20  # Sets max pool size
```

## Complete Configuration Example

Here's a comprehensive example showing all the "other options" configured together:

```json
{
  "channel_limits": {
    "max_name_length": 200,
    "cache_ttl": 3600
  },
  "event_limits": {
    "max_channels_at_once": 100,
    "max_name_length": 200,
    "max_payload_in_kb": 100,
    "max_batch_size": 10
  },
  "presence": {
    "max_members_per_channel": 100,
    "max_member_size_in_kb": 2
  },
  "http_api": {
    "request_limit_in_mb": 10,
    "accept_traffic": {
      "memory_threshold": 0.90
    }
  },
  "logging": {
    "colors_enabled": false,
    "include_target": true
  },
  "database": {
    "mysql": {
      "host": "mysql",
      "port": 3306,
      "username": "sockudo",
      "password": "sockudo123",
      "database": "sockudo",
      "table_name": "applications",
      "connection_pool_size": 10
    },
    "postgres": {
      "host": "postgres",
      "port": 5432,
      "username": "sockudo",
      "password": "sockudo123",
      "database": "sockudo",
      "table_name": "applications",
      "connection_pool_size": 10
    },
    "redis": {
      "host": "redis",
      "port": 6379,
      "db": 0,
      "key_prefix": "sockudo:",
      "cluster_nodes": []
    },
    "dynamodb": {
      "region": "us-east-1",
      "table_name": "sockudo-applications"
    }
  },
  "database_pooling": {
    "enabled": true,
    "min": 2,
    "max": 10
  }
}
```

## Performance Tuning

### Channel and Event Limits
- **High-volume applications**: Increase payload limits and batch sizes
- **Memory-constrained environments**: Reduce cache TTL and limits
- **Large presence channels**: Adjust member limits based on expected usage

### Database Performance
- **Connection pooling**: Tune min/max connections based on workload
- **Cache settings**: Adjust TTL based on data change frequency
- **Connection limits**: Balance between resource usage and performance

### HTTP API Tuning
- **Request limits**: Increase for applications with large payloads
- **Memory threshold**: Adjust based on server capacity and monitoring

## Security Considerations

### Database Security
1. **Use strong passwords** for database connections
2. **Limit database user permissions** to only what Sockudo needs
3. **Use SSL/TLS** for database connections where possible
4. **Regular security updates** for database servers

### API Security
1. **Set appropriate request limits** to prevent abuse
2. **Monitor memory usage** and adjust thresholds
3. **Use rate limiting** in conjunction with these limits
4. **Regular security audits** of API endpoints

## Monitoring and Alerting

### Key Metrics to Monitor
- Database connection pool usage
- Channel and event processing rates
- Memory usage relative to thresholds
- API request sizes and rates

### Alerting Recommendations
- Database connection pool exhaustion
- Memory usage approaching thresholds
- Unusual channel or event activity patterns
- API request size violations

These configuration options provide fine-grained control over Sockudo's behavior and resource usage, allowing you to optimize the server for your specific use case and infrastructure constraints.