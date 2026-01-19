# Adapter Configuration

The Adapter in Sockudo is a crucial component responsible for managing WebSocket connections and broadcasting messages between different server instances in a scaled environment. It allows Sockudo to scale horizontally.

Configuration for the adapter is managed under the `adapter` object in your `config.json` file.

## Main Adapter Settings

* **JSON Key (Parent)**: `adapter`

### `adapter.driver`
* **JSON Key**: `driver`
* **Environment Variable**: `ADAPTER_DRIVER`
* **Type**: `enum` (string)
* **Description**: Specifies which adapter driver to use. This determines how Sockudo handles message passing in a multi-node setup.
* **Default Value**: `"local"`
* **Possible Values**:
  * `"local"`: For single-instance deployments. No external message broker is used.
  * `"redis"`: Uses a Redis server as a message broker.
  * `"redis-cluster"`: Uses a Redis Cluster as a message broker.
  * `"nats"`: Uses a NATS server as a message broker.

**Example (`config.json`)**:
```json
{
  "adapter": {
    "driver": "redis",
    "redis": {
      "requests_timeout": 5000,
      "prefix": "sockudo_adapter:",
      "cluster_mode": false,
      "redis_pub_options": {
        "url": "redis://redis:6379/0"
      },
      "redis_sub_options": {
        "url": "redis://redis:6379/0"
      }
    }
  }
}
```

**Example (Environment Variable)**:
```bash
export ADAPTER_DRIVER=redis
export REDIS_URL=redis://redis:6379/0
```

## Redis Adapter (`adapter.redis`)

These settings are applicable if `adapter.driver` is set to `"redis"`.

* **JSON Key (Parent Object)**: `adapter.redis`

### `adapter.redis.requests_timeout`
* **JSON Key**: `requests_timeout`
* **Type**: `integer` (u64, milliseconds)
* **Description**: Timeout for requests made by the adapter, such as fetching data or acknowledgments.
* **Default Value**: `5000` (5 seconds)

### `adapter.redis.prefix`
* **JSON Key**: `prefix`
* **Type**: `string`
* **Description**: A prefix for all Redis keys used by this adapter. Helps avoid key collisions if the Redis instance is shared.
* **Default Value**: `"sockudo_adapter:"`

### `adapter.redis.cluster_mode`
* **JSON Key**: `cluster_mode`
* **Type**: `boolean`
* **Description**: Indicates if the Redis connection should operate in cluster mode. For dedicated Redis Cluster support, prefer using the `"redis-cluster"` driver.
* **Default Value**: `false`

### `adapter.redis.redis_pub_options` and `adapter.redis.redis_sub_options`
* **JSON Key**: `redis_pub_options`, `redis_sub_options`
* **Type**: `object` (map of string to JSON value)
* **Description**: Connection options for the Redis publisher and subscriber clients. Typically, you'd provide a `url` here.
* **Default Value**: Empty map `{}`

**Example (`config.json`)**:
```json
{
  "adapter": {
    "driver": "redis",
    "redis": {
      "requests_timeout": 5000,
      "prefix": "myapp_adapter:",
      "cluster_mode": false,
      "redis_pub_options": {
        "url": "redis://127.0.0.1:6379/0"
      },
      "redis_sub_options": {
        "url": "redis://127.0.0.1:6379/0"
      }
    }
  }
}
```

For Redis Sentinel:
```json
{
  "adapter": {
    "driver": "redis",
    "redis": {
      "redis_pub_options": {
        "sentinel": {
          "master_name": "mymaster",
          "hosts": [
            {"host": "127.0.0.1", "port": 26379},
            {"host": "127.0.0.1", "port": 26380}
          ],
          "password": "yourSentinelPassword"
        },
        "password": "yourRedisPassword"
      },
      "redis_sub_options": {
        "sentinel": {
          "master_name": "mymaster",
          "hosts": [
            {"host": "127.0.0.1", "port": 26379},
            {"host": "127.0.0.1", "port": 26380}
          ],
          "password": "yourSentinelPassword"
        },
        "password": "yourRedisPassword"
      }
    }
  }
}
```

## Redis Cluster Adapter (`adapter.cluster`)

These settings are applicable if `adapter.driver` is set to `"redis-cluster"`.

* **JSON Key (Parent Object)**: `adapter.cluster`

### `adapter.cluster.nodes`
* **JSON Key**: `nodes`
* **Type**: `array` of `string`
* **Description**: A list of seed node URLs for the Redis Cluster. Supports both `redis://` and `rediss://` protocols for TLS/SSL connections (e.g., `"redis://127.0.0.1:7000"` or `"rediss://secure.example.com:7000"`).
* **Default Value**: `[]` (empty array)

### `adapter.cluster.prefix`
* **JSON Key**: `prefix`
* **Type**: `string`
* **Description**: A prefix for all Redis keys used by this adapter.
* **Default Value**: `"sockudo_cluster:"`

### `adapter.cluster.request_timeout_ms`
* **JSON Key**: `request_timeout_ms`
* **Type**: `integer` (u64, milliseconds)
* **Description**: Timeout for requests made to the Redis Cluster.
* **Default Value**: `5000` (5 seconds)

### `adapter.cluster.use_connection_manager`
* **JSON Key**: `use_connection_manager`
* **Type**: `boolean`
* **Description**: Whether to use a connection manager for Redis Cluster connections.
* **Default Value**: `true`

**Example (`config.json`)**:
```json
{
  "adapter": {
    "driver": "redis-cluster",
    "cluster": {
      "nodes": [
        "redis://10.0.1.1:7000",
        "redis://10.0.1.2:7001",
        "redis://10.0.1.3:7002"
      ],
      "prefix": "myapp_cluster_adapter:",
      "request_timeout_ms": 10000,
      "use_connection_manager": true
    }
  }
}
```

**Example with TLS/SSL (`config.json`)**:
```json
{
  "adapter": {
    "driver": "redis-cluster",
    "cluster": {
      "nodes": [
        "rediss://node1.secure-cluster.example.com:7000",
        "rediss://node2.secure-cluster.example.com:7001",
        "rediss://node3.secure-cluster.example.com:7002"
      ],
      "prefix": "myapp_cluster_adapter:",
      "request_timeout_ms": 10000,
      "use_connection_manager": true
    }
  }
}
```

**Example for AWS Elasticache with TLS**:
```json
{
  "adapter": {
    "driver": "redis-cluster",
    "cluster": {
      "nodes": [
        "rediss://my-cluster.cache.amazonaws.com:6379"
      ],
      "prefix": "myapp_cluster_adapter:",
      "request_timeout_ms": 10000,
      "use_connection_manager": true
    }
  }
}
```

::: tip TLS/SSL Support
To use encrypted connections with Redis Cluster, specify the `rediss://` protocol in your node URLs instead of `redis://`. This is particularly useful for AWS Elasticache or other managed Redis Cluster services that require encryption in transit.
:::

## NATS Adapter (`adapter.nats`)

These settings are applicable if `adapter.driver` is set to `"nats"`.

* **JSON Key (Parent Object)**: `adapter.nats`

### `adapter.nats.servers`
* **JSON Key**: `servers`
* **Environment Variable**: `NATS_URL` (typically sets the first server if only one)
* **Type**: `array` of `string`
* **Description**: A list of NATS server URLs (e.g., `"nats://127.0.0.1:4222"`).
* **Default Value**: `["nats://nats:4222"]`

### `adapter.nats.prefix`
* **JSON Key**: `prefix`
* **Type**: `string`
* **Description**: A prefix for NATS subjects used by the adapter.
* **Default Value**: `"sockudo_nats:"`

### `adapter.nats.request_timeout_ms`
* **JSON Key**: `request_timeout_ms`
* **Type**: `integer` (u64, milliseconds)
* **Description**: Timeout for NATS requests.
* **Default Value**: `5000` (5 seconds)

### `adapter.nats.connection_timeout_ms`
* **JSON Key**: `connection_timeout_ms`
* **Type**: `integer` (u64, milliseconds)
* **Description**: Timeout for establishing a connection to the NATS server(s).
* **Default Value**: `5000` (5 seconds)

### `adapter.nats.username`
* **JSON Key**: `username`
* **Environment Variable**: `NATS_USERNAME`
* **Type**: `string` (optional)
* **Description**: Username for NATS authentication.
* **Default Value**: `null` (None)

### `adapter.nats.password`
* **JSON Key**: `password`
* **Environment Variable**: `NATS_PASSWORD`
* **Type**: `string` (optional)
* **Description**: Password for NATS authentication.
* **Default Value**: `null` (None)

### `adapter.nats.token`
* **JSON Key**: `token`
* **Environment Variable**: `NATS_TOKEN`
* **Type**: `string` (optional)
* **Description**: Token for NATS authentication.
* **Default Value**: `null` (None)

### `adapter.nats.nodes_number`
* **JSON Key**: `nodes_number`
* **Type**: `integer` (u32, optional)
* **Description**: An optional hint for the number of NATS nodes, which might be used for optimizations by the client.
* **Default Value**: `null` (None)

**Example (`config.json`)**:
```json
{
  "adapter": {
    "driver": "nats",
    "nats": {
      "servers": [
        "nats://nats1.example.com:4222",
        "nats://nats2.example.com:4222"
      ],
      "prefix": "sockudo_prod_adapter:",
      "request_timeout_ms": 5000,
      "connection_timeout_ms": 5000,
      "username": "sockudo_user",
      "password": "secure_password",
      "nodes_number": 3
    }
  }
}
```

**Example (Environment Variables)**:
```bash
export ADAPTER_DRIVER=nats
export NATS_URL="nats://nats.example.com:4222"
export NATS_USERNAME="sockudo_user"
export NATS_PASSWORD="secure_password"
```

## Choosing the Right Adapter

### Local Adapter
- **Best for**: Development, testing, single-server production
- **Pros**: Simple, no external dependencies
- **Cons**: No horizontal scaling support

### Redis Adapter
- **Best for**: Most production deployments
- **Pros**: Reliable, well-tested, good performance
- **Cons**: Single point of failure without Redis HA

### Redis Cluster Adapter
- **Best for**: High-availability, large-scale deployments
- **Pros**: High availability, horizontal scaling
- **Cons**: More complex setup and management

### NATS Adapter
- **Best for**: High-performance, cloud-native deployments
- **Pros**: Lightweight, fast, built-in clustering
- **Cons**: Additional infrastructure to manage

## Performance Considerations

### Redis Performance Tips
- Use a dedicated Redis instance for the adapter if possible
- Monitor Redis memory usage and configure appropriate eviction policies
- Consider Redis persistence settings based on your availability requirements
- Use Redis Sentinel or Cluster for high availability

### NATS Performance Tips
- Configure appropriate connection pooling
- Monitor NATS server performance and scaling
- Use NATS clustering for high availability
- Consider message limits and flow control

### General Tips
- Monitor adapter latency and throughput
- Use appropriate prefixes to avoid key/subject collisions
- Configure timeouts based on your network and performance requirements
- Test failover scenarios in your staging environment