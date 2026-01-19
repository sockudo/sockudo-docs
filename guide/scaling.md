# Scaling Sockudo

Sockudo is designed to handle a significant number of concurrent connections on a single instance due to its Rust-based architecture. However, to achieve higher availability and scale beyond the capacity of a single server, you'll need to run multiple Sockudo instances in a cluster. This is where **Adapters** come into play.

## The Role of Adapters

When you run multiple Sockudo instances, they need a way to communicate with each other. Specifically, if a client connected to `Sockudo Instance A` sends a message to a channel, and another client subscribed to the same channel is connected to `Sockudo Instance B`, Instance B needs to receive that message to deliver it to its client.

Adapters solve this problem by providing a publish/subscribe (Pub/Sub) mechanism that all Sockudo instances connect to. When an event is published on one instance, it's sent to the adapter, which then broadcasts it to all other subscribed instances.

## Supported Adapters

### 1. `local` Adapter

- **Driver:** `local`
- **Description:** No external messaging system. Suitable only for single-instance deployments.
- **Use Case:** Development, testing, or single-server production deployments.
- **Scaling:** **Does not support horizontal scaling.**

```json
{
  "adapter": {
    "driver": "local"
  }
}
```

### 2. `redis` Adapter

- **Driver:** `redis`
- **Description:** Uses Redis Pub/Sub to broadcast messages between Sockudo instances.
- **Requirements:** Redis server (version 2.6.0 or higher for Pub/Sub).
- **Use Case:** Most common choice for scaling. Reliable and well-tested.

```json
{
  "adapter": {
    "driver": "redis",
    "redis": {
      "requests_timeout": 5000,
      "prefix": "sockudo_adapter:",
      "cluster_mode": false,
      "redis_pub_options": {
        "url": "redis://your-redis-host:6379/0"
      },
      "redis_sub_options": {
        "url": "redis://your-redis-host:6379/0"
      }
    }
  }
}
```

**Environment Variables:**
```bash
ADAPTER_DRIVER=redis
REDIS_URL=redis://your-redis-host:6379/0
```

### 3. `redis-cluster` Adapter

- **Driver:** `redis-cluster`
- **Description:** Uses Redis Cluster for high availability and sharding of the Pub/Sub workload.
- **Requirements:** A running Redis Cluster.
- **Use Case:** Large-scale deployments requiring highly available Redis backend.

```json
{
  "adapter": {
    "driver": "redis-cluster",
    "cluster": {
      "nodes": [
        "redis://node1.example.com:7000",
        "redis://node2.example.com:7001",
        "redis://node3.example.com:7002"
      ],
      "prefix": "sockudo_cluster:",
      "request_timeout_ms": 5000,
      "use_connection_manager": true
    }
  }
}
```

### 4. `nats` Adapter

- **Driver:** `nats`
- **Description:** Uses NATS.io for inter-instance communication.
- **Requirements:** A running NATS server or cluster.
- **Use Case:** Environments already using NATS or those needing lightweight, fast messaging.

```json
{
  "adapter": {
    "driver": "nats",
    "nats": {
      "servers": ["nats://nats-server1:4222", "nats://nats-server2:4222"],
      "prefix": "sockudo_nats:",
      "request_timeout_ms": 5000,
      "connection_timeout_ms": 5000,
      "username": null,
      "password": null,
      "token": null
    }
  }
}
```

**Environment Variables:**
```bash
ADAPTER_DRIVER=nats
NATS_URL=nats://nats-server:4222
NATS_USERNAME=your_username
NATS_PASSWORD=your_password
```

## Load Balancing

When running multiple Sockudo instances, you need a load balancer to distribute client connections and HTTP API requests.

### Load Balancer Configuration

#### Nginx Example

```nginx
upstream sockudo_backend {
    least_conn;
    server sockudo-1:6001 max_fails=3 fail_timeout=30s;
    server sockudo-2:6001 max_fails=3 fail_timeout=30s;
    server sockudo-3:6001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# WebSocket upgrade configuration
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://sockudo_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 86400s;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }
}
```

#### Docker Compose Example

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - sockudo-1
      - sockudo-2

  sockudo-1:
    image: sockudo/sockudo:latest
    environment:
      - INSTANCE_PROCESS_ID=sockudo-1
      - ADAPTER_DRIVER=redis
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  sockudo-2:
    image: sockudo/sockudo:latest
    environment:
      - INSTANCE_PROCESS_ID=sockudo-2
      - ADAPTER_DRIVER=redis
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
```

### Session Affinity Considerations

- **WebSocket Connections:** With a robust adapter handling message broadcasting, strict session affinity is often not required for the data phase of WebSockets.
- **HTTP API Requests:** These are stateless and can use standard load balancing algorithms (round-robin, least connections).
- **Connection Establishment:** The initial WebSocket handshake benefits from even distribution across instances.

## Horizontal Scaling Architecture

### Single Instance (No Scaling)
```
┌─────────────────┐
│   Client Apps   │
└─────────────────┘
         │
┌─────────────────┐
│   Sockudo       │
│   (Local)       │
└─────────────────┘
```

### Multi-Instance with Redis
```
┌─────────────────┐
│   Client Apps   │
└─────────────────┘
         │
┌─────────────────┐
│  Load Balancer  │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│Sockudo│ │Sockudo│
│   1   │ │   2   │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │  Redis  │
    │ Adapter │
    └─────────┘
```

### Multi-Instance with NATS Cluster
```
┌─────────────────┐
│   Client Apps   │
└─────────────────┘
         │
┌─────────────────┐
│  Load Balancer  │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│Sockudo│ │Sockudo│
│   1   │ │   2   │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
  ┌──────▼──────┐
  │ NATS Cluster│
  │  Node 1-3   │
  └─────────────┘
```

## Shared Backend Services

When scaling Sockudo, ensure these backend services are properly configured for multi-instance access:

### App Manager
```json
{
  "app_manager": {
    "driver": "mysql",  // Shared database
    "cache": {
      "enabled": true,
      "ttl": 300
    }
  },
  "database": {
    "mysql": {
      "host": "mysql-cluster.example.com",
      "connection_pool_size": 10
    }
  }
}
```

### Cache
```json
{
  "cache": {
    "driver": "redis",  // Shared cache
    "redis": {
      "prefix": "sockudo_cache:",
      "url_override": "redis://cache-redis.example.com:6379"
    }
  }
}
```

### Queue System
```json
{
  "queue": {
    "driver": "redis",  // Shared queue for webhooks
    "redis": {
      "concurrency": 5,
      "prefix": "sockudo_queue:",
      "url_override": "redis://queue-redis.example.com:6379"
    }
  }
}
```

### Rate Limiter
```json
{
  "rate_limiter": {
    "enabled": true,
    "driver": "redis",  // Global rate limiting
    "redis": {
      "prefix": "sockudo_rl:",
      "url_override": "redis://ratelimit-redis.example.com:6379"
    }
  }
}
```

## Deployment Strategies

### Docker Swarm
```yaml
version: '3.8'
services:
  sockudo:
    image: sockudo/sockudo:latest
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.role == worker
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    environment:
      - ADAPTER_DRIVER=redis
      - REDIS_URL=redis://redis:6379
    networks:
      - sockudo_network

  redis:
    image: redis:alpine
    deploy:
      placement:
        constraints:
          - node.role == manager
    networks:
      - sockudo_network
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sockudo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sockudo
  template:
    metadata:
      labels:
        app: sockudo
    spec:
      containers:
      - name: sockudo
        image: sockudo/sockudo:latest
        env:
        - name: ADAPTER_DRIVER
          value: "redis"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: INSTANCE_PROCESS_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: sockudo-service
spec:
  selector:
    app: sockudo
  ports:
  - port: 6001
    targetPort: 6001
  type: LoadBalancer
```

## Monitoring Scaled Deployments

### Metrics Collection
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

### Instance Identification
```json
{
  "instance": {
    "process_id": "sockudo-node-1"  // Unique per instance
  }
}
```

### Key Metrics to Monitor

1. **Per-Instance Metrics:**
    - Active connections per instance
    - Message throughput per instance
    - Resource usage (CPU, memory)

2. **Cluster-Wide Metrics:**
    - Total active connections
    - Message distribution across instances
    - Adapter performance (Redis/NATS)

3. **Backend Service Metrics:**
    - Redis/NATS latency and throughput
    - Database connection pool usage
    - Queue processing rates

## Performance Considerations

### Connection Distribution
- Monitor connection distribution across instances
- Use connection-based load balancing if needed
- Consider geographic distribution for global deployments

### Message Broadcasting Efficiency
- **Redis Adapter**: Monitor Redis pub/sub performance
- **NATS Adapter**: Monitor NATS message throughput
- **Network Latency**: Ensure low latency between instances and adapter

### Resource Planning
```bash
# Example resource allocation per instance
CPU: 1-2 cores
Memory: 512MB - 2GB
Network: 1Gbps
Connections: 5,000-50,000 per instance
```

## Troubleshooting Scaling Issues

### Common Problems

1. **Split-Brain Scenarios:**
    - Ensure adapter connectivity
    - Monitor adapter health
    - Implement proper failover

2. **Uneven Load Distribution:**
    - Check load balancer configuration
    - Monitor connection counts per instance
    - Verify health check endpoints

3. **Adapter Performance:**
    - Monitor Redis/NATS performance
    - Check network latency
    - Scale adapter infrastructure

### Debugging Tools

```bash
# Check instance connectivity
curl http://sockudo-1:6001/usage
curl http://sockudo-2:6001/usage

# Monitor Redis pub/sub
redis-cli monitor

# Check NATS connectivity
nats-top

# View metrics across instances
curl http://sockudo-1:9601/metrics
curl http://sockudo-2:9601/metrics
```

## Best Practices for Scaling

### Configuration Management
1. **Use environment variables** for instance-specific settings
2. **Centralize configuration** using config management tools
3. **Version control** your configuration files

### Health Checks
```json
{
  "health_check": {
    "enabled": true,
    "interval": 30,
    "timeout": 10
  }
}
```

### Graceful Shutdowns
```json
{
  "shutdown_grace_period": 30  // Allow connections to close gracefully
}
```

### Security
1. **Secure adapter connections** (Redis AUTH, NATS tokens)
2. **Use TLS** for adapter communication
3. **Network segmentation** for backend services
4. **Regular security updates** for all components

### Capacity Planning
1. **Monitor baseline performance** on single instance
2. **Test scaling scenarios** before production
3. **Plan for peak loads** and growth
4. **Implement auto-scaling** where possible

By following these guidelines and choosing the appropriate adapter for your infrastructure, you can effectively scale Sockudo to handle large numbers of concurrent users while maintaining high availability and performance.