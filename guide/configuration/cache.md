# Cache Configuration

Sockudo utilizes caching for various purposes, such as storing presence channel member data, app configurations (by the App Manager), and other internal data to improve performance and reduce load on backend systems.

Global cache settings are configured under the `cache` object in your `config.json`.

## Main Cache Settings

* **JSON Key (Parent)**: `cache`

### `cache.driver`
* **JSON Key**: `driver`
* **Environment Variable**: `CACHE_DRIVER`
* **Type**: `enum` (string)
* **Description**: Specifies the backend driver for the primary caching system.
* **Default Value**: `"redis"`
* **Possible Values**:
  * `"memory"`: In-memory cache. Fast but data is lost on restart and not shared between instances.
  * `"redis"`: Uses a Redis server for caching.
  * `"redis-cluster"`: Uses a Redis Cluster for caching.
  * `"none"`: Disables caching.

**Example (`config.json`)**:
```json
{
  "cache": {
    "driver": "redis",
    "redis": {
      "prefix": "sockudo_cache:",
      "cluster_mode": false
    }
  }
}
```

**Example (Environment Variable)**:
```bash
export CACHE_DRIVER=redis
export REDIS_URL=redis://redis:6379/0
```

## Memory Cache Options (`cache.memory`)

These settings are applicable if `cache.driver` is set to `"memory"`.

* **JSON Key (Parent Object)**: `cache.memory`

### `cache.memory.ttl`
* **JSON Key**: `ttl`
* **Type**: `integer` (u64, seconds)
* **Description**: Default time-to-live for items in the memory cache.
* **Default Value**: `300` (5 minutes)

### `cache.memory.cleanup_interval`
* **JSON Key**: `cleanup_interval`
* **Type**: `integer` (u64, seconds)
* **Description**: How often the memory cache should run its cleanup process to evict expired items.
* **Default Value**: `60` (1 minute)

### `cache.memory.max_capacity`
* **JSON Key**: `max_capacity`
* **Type**: `integer` (u64)
* **Description**: The maximum number of items the memory cache can hold.
* **Default Value**: `10000`

**Example (`config.json`)**:
```json
{
  "cache": {
    "driver": "memory",
    "memory": {
      "ttl": 600,
      "cleanup_interval": 120,
      "max_capacity": 20000
    }
  }
}
```

**Environment Variables for Memory Cache:**
```bash
CACHE_DRIVER=memory
CACHE_TTL_SECONDS=600
CACHE_CLEANUP_INTERVAL=120
CACHE_MAX_CAPACITY=20000
```

## Redis Cache Options (`cache.redis`)

These settings are applicable if `cache.driver` is set to `"redis"` or `"redis-cluster"`.

* **JSON Key (Parent Object)**: `cache.redis`

### `cache.redis.prefix`
* **JSON Key**: `prefix`
* **Environment Variable**: `CACHE_REDIS_PREFIX`
* **Type**: `string` (optional)
* **Description**: A prefix for all Redis keys used by this cache instance. Helps avoid key collisions.
* **Default Value**: `"sockudo_cache:"`

### `cache.redis.url_override`
* **JSON Key**: `url_override`
* **Environment Variable**: `CACHE_REDIS_URL`
* **Type**: `string` (optional)
* **Description**: A specific Redis connection URL to use for this cache instance, overriding the global `database.redis.url` if provided.
  Format: `redis://[username:password@]host:port[/db]`
* **Default Value**: `null` (None). If not set, it will use the global Redis configuration from `database.redis`.

### `cache.redis.cluster_mode`
* **JSON Key**: `cluster_mode`
* **Type**: `boolean`
* **Description**: Indicates if the Redis connection for caching should operate in cluster mode. This is relevant if `cache.driver` is `"redis"` but you are connecting to a Redis Cluster. If `cache.driver` is `"redis-cluster"`, this is implicitly true.
* **Default Value**: `false`

**Example (`config.json` for Redis Cache)**:
```json
{
  "cache": {
    "driver": "redis",
    "redis": {
      "prefix": "myapp_cache:",
      "url_override": "redis://my-cache-redis:6379/1",
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

**Example (`config.json` for Redis Cluster Cache)**:
```json
{
  "cache": {
    "driver": "redis-cluster",
    "redis": {
      "prefix": "myapp_cluster_cache:",
      "cluster_mode": true
    }
  },
  "database": {
    "redis": {
      "cluster_nodes": [
        {"host": "node1.mycluster.com", "port": 7000},
        {"host": "node2.mycluster.com", "port": 7001},
        {"host": "node3.mycluster.com", "port": 7002}
      ]
    }
  }
}
```

**Example with TLS/SSL for Redis Cluster Cache**:
```json
{
  "cache": {
    "driver": "redis-cluster",
    "redis": {
      "prefix": "myapp_cluster_cache:",
      "cluster_mode": true
    }
  },
  "database": {
    "redis": {
      "cluster_nodes": [
        {"host": "rediss://node1.secure-cluster.com", "port": 7000},
        {"host": "rediss://node2.secure-cluster.com", "port": 7001},
        {"host": "rediss://node3.secure-cluster.com", "port": 7002}
      ]
    }
  }
}
```

**Example for AWS Elasticache Cluster with TLS**:
```json
{
  "cache": {
    "driver": "redis-cluster",
    "redis": {
      "prefix": "myapp_cache:",
      "cluster_mode": true
    }
  },
  "database": {
    "redis": {
      "cluster_nodes": [
        {"host": "rediss://my-cluster.use1.cache.amazonaws.com", "port": 6379}
      ]
    }
  }
}
```

::: tip TLS/SSL Support for Redis Cluster
To enable encrypted connections, specify the `rediss://` protocol in the `host` field of your cluster nodes. The protocol (redis:// or rediss://) takes precedence over the port configuration, allowing you to connect securely to managed Redis Cluster services like AWS Elasticache.
:::

**Environment Variables for Redis Cache:**
```bash
CACHE_DRIVER=redis
CACHE_REDIS_PREFIX="myapp_cache:"
CACHE_REDIS_URL="redis://my-cache-redis:6379/1"
REDIS_URL="redis://redis:6379/0"  # Fallback if url_override not set
```

## Cache Usage Patterns

### Application Configuration Caching
The App Manager uses caching to reduce database lookups:

```json
{
  "app_manager": {
    "driver": "mysql",
    "cache": {
      "enabled": true,
      "ttl": 300
    }
  }
}
```

### Channel Information Caching
Channel metadata is cached to improve performance:

```json
{
  "channel_limits": {
    "cache_ttl": 3600
  }
}
```

### Presence Channel Member Caching
Presence channel member lists are cached for quick retrieval.

## Cache Strategies

### Cache-Aside Pattern
Sockudo primarily uses a cache-aside pattern where:
1. Check cache first
2. If miss, fetch from primary source
3. Store result in cache
4. Return result

### TTL Management
Different data types have different TTL requirements:
- **App configurations**: Long TTL (5-60 minutes)
- **Channel info**: Medium TTL (5-60 minutes)
- **Presence data**: Short TTL (1-5 minutes)
- **Rate limiting data**: Very short TTL (seconds to minutes)

## Performance Considerations

### Memory Cache
- **Pros**: Very fast, no network overhead
- **Cons**: Not shared between instances, lost on restart
- **Best for**: Single-instance deployments, development

### Redis Cache
- **Pros**: Shared between instances, persistent, feature-rich
- **Cons**: Network latency, additional infrastructure
- **Best for**: Multi-instance deployments, production

### Redis Cluster Cache
- **Pros**: High availability, horizontal scaling
- **Cons**: More complex setup, potential hotspot issues
- **Best for**: Large-scale, high-availability deployments

## Cache Key Patterns

Sockudo uses structured cache keys:

```
{prefix}app:{app_id}
{prefix}channel:{app_id}:{channel_name}
{prefix}presence:{app_id}:{channel_name}
{prefix}user:{app_id}:{user_id}
```

Examples with default prefix:
```
sockudo_cache:app:demo-app
sockudo_cache:channel:demo-app:presence-chat
sockudo_cache:presence:demo-app:presence-chat
sockudo_cache:user:demo-app:user123
```

## Monitoring Cache Performance

### Key Metrics to Monitor

1. **Hit Rate**: Percentage of cache hits vs misses
2. **Latency**: Cache operation response times
3. **Memory Usage**: Cache size and memory consumption
4. **Eviction Rate**: How often items are evicted

### Redis Monitoring Commands

```bash
# Get cache statistics
redis-cli info memory
redis-cli info stats

# Monitor cache operations in real-time
redis-cli monitor

# Check specific cache keys
redis-cli keys "sockudo_cache:*" | head -10
```

### Memory Cache Monitoring

Memory cache metrics are exposed via Sockudo's Prometheus metrics endpoint:

```
# Cache hit/miss rates
sockudo_cache_hits_total
sockudo_cache_misses_total

# Cache operations
sockudo_cache_operations_total

# Memory usage
sockudo_cache_memory_usage_bytes
```

## Best Practices

### Configuration
1. **Choose appropriate TTL values** based on data characteristics
2. **Use descriptive prefixes** to avoid key collisions
3. **Size memory cache appropriately** for your workload
4. **Monitor cache performance** regularly

### Redis Specific
1. **Use dedicated Redis instance** for caching when possible
2. **Configure appropriate eviction policies** (e.g., allkeys-lru)
3. **Monitor Redis memory usage** and set maxmemory limits
4. **Use Redis persistence** settings appropriate for your availability requirements

### Scaling Considerations
1. **Use Redis for multi-instance deployments**
2. **Consider Redis Cluster** for very large deployments
3. **Monitor cache distribution** across cluster nodes
4. **Plan for cache warming** strategies

### Security
1. **Secure Redis connections** with AUTH and TLS
2. **Use network isolation** for cache infrastructure
3. **Regular security updates** for Redis servers
4. **Monitor access patterns** for unusual activity

## Troubleshooting

### Common Issues

1. **High Cache Miss Rate**
  - Check TTL settings
  - Monitor cache eviction policies
  - Verify cache key patterns

2. **Redis Connection Issues**
  - Verify Redis server availability
  - Check network connectivity
  - Validate Redis authentication

3. **Memory Cache Overflow**
  - Increase max_capacity
  - Reduce TTL values
  - Monitor cleanup intervals

### Debug Commands

```bash
# Check cache configuration
curl http://localhost:6001/usage

# Monitor Redis operations
redis-cli monitor | grep sockudo_cache

# Check memory cache statistics (via metrics)
curl http://localhost:9601/metrics | grep cache
```