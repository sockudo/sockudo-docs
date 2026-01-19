# Rate Limiter Configuration

Sockudo includes a rate limiting feature to protect your server from abuse and ensure fair usage. It can limit the number of requests from a single IP address to the HTTP API and the number of WebSocket connection attempts.

Rate limiter configuration is managed under the `rate_limiter` object in your `config.json`.

## Main Rate Limiter Settings

* **JSON Key (Parent)**: `rate_limiter`

### `rate_limiter.enabled`
* **JSON Key**: `enabled`
* **Environment Variable**: `RATE_LIMITER_ENABLED` (Set to `true` or `1`)
* **Type**: `boolean`
* **Description**: Enables or disables the rate limiting feature globally.
* **Default Value**: `true`

### `rate_limiter.driver`
* **JSON Key**: `driver`
* **Environment Variable**: `RATE_LIMITER_DRIVER`
* **Type**: `enum` (string, uses `CacheDriver` enum values)
* **Description**: Specifies the backend driver for storing rate limit counters.
* **Default Value**: `"redis"`
* **Possible Values**:
  * `"memory"`: Uses an in-memory store. Suitable for single-instance deployments. Counts are not shared across instances.
  * `"redis"`: Uses a Redis server. Recommended for multi-instance deployments.
  * `"redis-cluster"`: Uses a Redis Cluster.
  * `"none"`: Effectively disables rate limiting by not having a persistent store.

**Example (`config.json`)**:
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
```bash
RATE_LIMITER_ENABLED=true
RATE_LIMITER_DRIVER=redis
```

## Rate Limit Definitions

Sockudo defines separate rate limits for different types of requests. These are configured using the `RateLimit` object structure.

### `RateLimit` Object Structure

* **`max_requests`** (integer, u32): Maximum number of requests allowed within the `window_seconds`.
* **`window_seconds`** (integer, u64): The time window in seconds during which `max_requests` are counted.
* **`identifier`** (string, optional): A unique name for this rate limit rule, mainly for logging or internal use. Default: `"default"`.
* **`trust_hops`** (integer, u32, optional): Number of hops (proxies) to trust when determining the client's IP address from headers like `X-Forwarded-For`. A value of `0` means the direct connecting IP is used. Default: `0`.

### `rate_limiter.api_rate_limit`
* **JSON Key**: `api_rate_limit`
* **Type**: `RateLimit` object
* **Description**: Configuration for rate limiting requests to the HTTP API endpoints.
* **Default Value**:
    ```json
    {
      "max_requests": 100,
      "window_seconds": 60,
      "identifier": "api",
      "trust_hops": 0
    }
    ```

**Environment Variables (for API rate limit)**:
* `RATE_LIMITER_API_MAX_REQUESTS`
* `RATE_LIMITER_API_WINDOW_SECONDS`
* `RATE_LIMITER_API_TRUST_HOPS`

**Example:**
```json
{
  "rate_limiter": {
    "enabled": true,
    "driver": "redis",
    "api_rate_limit": {
      "max_requests": 200,
      "window_seconds": 60,
      "identifier": "api",
      "trust_hops": 1
    }
  }
}
```

### `rate_limiter.websocket_rate_limit`
* **JSON Key**: `websocket_rate_limit`
* **Type**: `RateLimit` object
* **Description**: Configuration for rate limiting new WebSocket connection attempts.
* **Default Value**:
    ```json
    {
      "max_requests": 20,
      "window_seconds": 60,
      "identifier": "websocket_connect",
      "trust_hops": 0
    }
    ```

**Environment Variables (for WebSocket rate limit)**:
* `RATE_LIMITER_WEBSOCKET_MAX_REQUESTS`
* `RATE_LIMITER_WEBSOCKET_WINDOW_SECONDS`
* `RATE_LIMITER_WEBSOCKET_TRUST_HOPS`

**Example:**
```json
{
  "rate_limiter": {
    "enabled": true,
    "driver": "redis",
    "websocket_rate_limit": {
      "max_requests": 10,
      "window_seconds": 60,
      "identifier": "websocket_connect",
      "trust_hops": 0
    }
  }
}
```

## Redis Backend for Rate Limiter (`rate_limiter.redis`)

These settings are applicable if `rate_limiter.driver` is set to `"redis"` or `"redis-cluster"`.

* **JSON Key (Parent Object)**: `rate_limiter.redis`

### `rate_limiter.redis.prefix`
* **JSON Key**: `prefix`
* **Environment Variable**: `RATE_LIMITER_REDIS_PREFIX`
* **Type**: `string` (optional)
* **Description**: A prefix for all Redis keys used by the rate limiter.
* **Default Value**: `"sockudo_rl:"`

### `rate_limiter.redis.url_override`
* **JSON Key**: `url_override`
* **Type**: `string` (optional)
* **Description**: A specific Redis connection URL for the rate limiter, overriding global `database.redis.url`.
* **Default Value**: `null` (None). Falls back to `database.redis` if not set.

### `rate_limiter.redis.cluster_mode`
* **JSON Key**: `cluster_mode`
* **Type**: `boolean`
* **Description**: Whether the Redis connection for rate limiting should use cluster mode.
* **Default Value**: `false`

**Example (`config.json` with Redis for Rate Limiting)**:
```json
{
  "rate_limiter": {
    "enabled": true,
    "driver": "redis",
    "api_rate_limit": { 
      "max_requests": 500, 
      "window_seconds": 60,
      "trust_hops": 1
    },
    "websocket_rate_limit": { 
      "max_requests": 30, 
      "window_seconds": 60 
    },
    "redis": {
      "prefix": "myapp_rl:",
      "url_override": "redis://dedicated-redis-for-rl:6379/0",
      "cluster_mode": false
    }
  },
  "database": {
    "redis": {
      "host": "redis",
      "port": 6379,
      "db": 0
    }
  }
}
```

**Environment Variables:**
```bash
RATE_LIMITER_ENABLED=true
RATE_LIMITER_DRIVER=redis
RATE_LIMITER_REDIS_PREFIX="myapp_rl:"
REDIS_URL="redis://redis:6379/0"
```

## Per-App Rate Limiting

Individual applications can have their own rate limiting settings that override the global rate limiter:

```json
{
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "premium-app",
          "key": "premium-key",
          "secret": "premium-secret",
          "max_backend_events_per_second": 1000,
          "max_client_events_per_second": "100",
          "max_read_requests_per_second": 500
        },
        {
          "id": "basic-app",
          "key": "basic-key",
          "secret": "basic-secret",
          "max_backend_events_per_second": 100,
          "max_client_events_per_second": "10",
          "max_read_requests_per_second": 50
        }
      ]
    }
  }
}
```

## Rate Limiting Strategies

### IP-Based Rate Limiting
The default strategy limits requests based on client IP address:

```json
{
  "api_rate_limit": {
    "max_requests": 100,
    "window_seconds": 60,
    "trust_hops": 0
  }
}
```

### Proxy-Aware Rate Limiting
When behind a reverse proxy or load balancer:

```json
{
  "api_rate_limit": {
    "max_requests": 100,
    "window_seconds": 60,
    "trust_hops": 1  // Trust one proxy layer
  }
}
```

### Aggressive Rate Limiting
For high-security environments:

```json
{
  "api_rate_limit": {
    "max_requests": 50,
    "window_seconds": 60
  },
  "websocket_rate_limit": {
    "max_requests": 5,
    "window_seconds": 60
  }
}
```

### Lenient Rate Limiting
For trusted environments:

```json
{
  "api_rate_limit": {
    "max_requests": 1000,
    "window_seconds": 60
  },
  "websocket_rate_limit": {
    "max_requests": 100,
    "window_seconds": 60
  }
}
```

## Rate Limit Algorithm

Sockudo uses a sliding window algorithm for rate limiting:

1. **Window-based counting**: Requests are counted within time windows
2. **Sliding windows**: Windows slide continuously, not in fixed chunks
3. **IP-based identification**: Rate limits apply per client IP address
4. **Proxy awareness**: Can extract real IP from headers when configured

## Rate Limit Headers

When rate limits are applied, Sockudo includes headers in HTTP responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Monitoring Rate Limiting

### Metrics
Sockudo exposes rate limiting metrics via Prometheus:

```
# Rate limit triggers
sockudo_rate_limit_triggered_total{type="api"}
sockudo_rate_limit_triggered_total{type="websocket"}

# Rate limit checks
sockudo_rate_limit_checks_total{type="api",result="allowed"}
sockudo_rate_limit_checks_total{type="api",result="denied"}
```

### Redis Monitoring
Monitor rate limiting data in Redis:

```bash
# Check rate limit keys
redis-cli keys "sockudo_rl:*"

# Monitor rate limit operations
redis-cli monitor | grep sockudo_rl

# Check specific IP rate limit
redis-cli get "sockudo_rl:api:192.168.1.100"
```

## Performance Considerations

### Memory Driver
- **Pros**: Very fast, no network overhead
- **Cons**: Not shared between instances
- **Best for**: Single-instance deployments

### Redis Driver
- **Pros**: Shared between instances, persistent
- **Cons**: Network latency, Redis dependency
- **Best for**: Multi-instance deployments

### Redis Cluster Driver
- **Pros**: High availability, horizontal scaling
- **Cons**: More complex setup
- **Best for**: Large-scale deployments

## Security Considerations

### Trust Hops Configuration
Be careful with `trust_hops` setting:

```json
{
  "api_rate_limit": {
    "trust_hops": 1  // Only if you have exactly one proxy
  }
}
```

**Risk**: Setting `trust_hops` too high allows clients to spoof IP addresses.

### Rate Limit Bypass Prevention
1. **Validate proxy headers** before trusting them
2. **Use appropriate trust_hops** values
3. **Monitor for unusual patterns**
4. **Implement additional security layers**

## Troubleshooting

### Common Issues

#### Rate Limits Not Working
1. Check if rate limiter is enabled
2. Verify Redis connectivity (if using Redis driver)
3. Check rate limit configuration values
4. Monitor rate limit metrics

#### False Positives
1. Check `trust_hops` configuration
2. Verify proxy header forwarding
3. Monitor IP address patterns
4. Adjust rate limit thresholds

#### Performance Issues
1. Monitor Redis performance (if using Redis)
2. Check rate limit key patterns
3. Consider using Redis Cluster for scale
4. Optimize rate limit window sizes

### Debug Commands

```bash
# Check current rate limits
curl -v http://localhost:6001/usage

# Monitor rate limit metrics
curl http://localhost:9601/metrics | grep rate_limit

# Check Redis rate limit data
redis-cli keys "sockudo_rl:*" | head -10
redis-cli get "sockudo_rl:api:YOUR_IP"

# Test rate limiting
for i in {1..10}; do curl http://localhost:6001/usage; done
```

## Best Practices

### Configuration
1. **Start with conservative limits** and adjust based on usage
2. **Monitor rate limit triggers** to tune thresholds
3. **Use Redis for production** multi-instance deployments
4. **Configure trust_hops carefully** based on your proxy setup

### Monitoring
1. **Set up alerts** for high rate limit trigger rates
2. **Monitor per-app usage** patterns
3. **Track rate limit effectiveness**
4. **Review rate limit logs** regularly

### Scaling
1. **Use Redis Cluster** for very large deployments
2. **Monitor Redis performance** under load
3. **Consider geographic distribution** for global rate limiting
4. **Plan for rate limit storage scaling**