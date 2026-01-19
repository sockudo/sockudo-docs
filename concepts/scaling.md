# Scaling Sockudo

Sockudo is designed with performance in mind, leveraging Rust's efficiency. However, as your application's user base and real-time traffic grow, you'll need strategies to scale your Sockudo deployment. Sockudo supports both vertical and horizontal scaling.

## 1. Vertical Scaling

Vertical scaling (or "scaling up") involves increasing the resources of the single server instance where Sockudo is running.

* **CPU**: More CPU cores or faster cores can help Sockudo handle more concurrent connections and process messages more quickly. Rust's concurrency model can effectively utilize multiple cores.
* **RAM**: More RAM is needed to accommodate a larger number of active WebSocket connections, channel data, presence information, and in-memory caches or queues (if used).
* **Network I/O**: A higher-capacity network interface and sufficient bandwidth are crucial for handling a large volume of WebSocket traffic.
* **OS Limits**: Ensure operating system limits (e.g., maximum open file descriptors, network buffer sizes) are tuned appropriately for a high-connection server.

**When to Use Vertical Scaling:**
* Simpler to manage initially than horizontal scaling.
* Can be effective up to a certain point.
* Eventually, there are physical or cost limits to how much a single server can be scaled.

## 2. Horizontal Scaling

Horizontal scaling (or "scaling out") involves running multiple instances of Sockudo, typically behind a load balancer. This is the preferred method for achieving high availability and handling very large numbers of concurrent connections.

Key components for successful horizontal scaling with Sockudo:

### a. Load Balancer

* **Role**: Distributes incoming client connections across your multiple Sockudo instances.
* **Requirements**:
    * **WebSocket Support**: Must be able to proxy WebSocket connections correctly (handling `Upgrade` and `Connection` headers).
    * **Protocols**: Support for TCP load balancing (for WebSockets) and HTTP/HTTPS load balancing (for the HTTP API and client auth requests if they go through the same entry point).
    * **Health Checks**: Configure health checks to ensure traffic is only routed to healthy Sockudo instances. Sockudo's HTTP API might have an `/up` or `/health` endpoint, or you can check the main application port.
    * **Session Affinity (Sticky Sessions)**:
        * For WebSocket connections, if the chosen adapter doesn't handle all state perfectly across nodes for an *ongoing* connection (though Pusher protocol is generally designed to be fairly stateless once connected), sticky sessions might be considered. This ensures a client remains connected to the same Sockudo instance.
        * However, with robust adapters like Redis or NATS managing the broadcast and shared state, strict session affinity for WebSockets is often less critical, as any node can receive a message from the adapter and forward it to its local clients.
        * For HTTP API requests (which are stateless), standard load balancing algorithms (round-robin, least connections) are usually sufficient.
* **Examples**: Nginx, HAProxy, AWS Application Load Balancer (ALB) or Network Load Balancer (NLB), Google Cloud Load Balancing, Azure Load Balancer.

### b. Shared Adapter

* **This is CRUCIAL for horizontal scaling.**
* **Role**: The adapter (e.g., Redis, NATS) acts as a message bus or publish/subscribe system. When one Sockudo instance needs to send a message to clients that might be connected to *other* instances, it publishes the message via the adapter. All other Sockudo instances are subscribed and will receive the message, then relay it to their locally connected clients on the relevant channels.
* **Configuration**: Set `adapter.driver` to `"redis"`, `"redis-cluster"`, or `"nats"` and configure the connection details. The `local` adapter is **not** suitable for multi-instance deployments.
* See [Adapter Configuration](../guide/configuration/adapter.md).

### c. Shared Backend Services

If your Sockudo configuration relies on other stateful components, these also need to be shared and accessible by all Sockudo instances:

* **App Manager Backend**:
    * If using `app_manager.driver` as `"mysql"` or `"dynamodb"`, all Sockudo instances must connect to the same database instance or DynamoDB table. This database itself should be scalable and highly available.
    * If using `"memory"` with `app_manager.array.apps`, each instance will have its own copy from the config file. This is generally not suitable for dynamic app management in a scaled environment unless apps rarely change and a restart/redeploy of all nodes is acceptable for updates.
* **Cache Backend**:
    * If `cache.driver` is `"redis"` or `"redis-cluster"`, all instances should connect to the same Redis setup for a unified cache. This is important for features like presence channel data consistency.
    * Using `"memory"` cache in a scaled environment means each instance has its own independent cache, which can lead to inconsistencies.
* **Queue Backend**:
    * If `queue.driver` is `"redis"` or `"sqs"`, all instances should publish to and consume from the same queue system. This ensures webhooks or other background tasks are processed correctly regardless of which instance initiated them or which worker picks them up.
* **Rate Limiter Backend**:
    * If `rate_limiter.driver` is `"redis"` or `"redis-cluster"`, this ensures rate limit counters are shared across all instances, providing consistent enforcement. Using `"memory"` rate limiting in a scaled setup means each instance enforces limits independently, which is less effective.

### d. Statelessness (Sockudo Instances)

Sockudo instances themselves should ideally be as stateless as possible, with shared state managed by external services (Adapters, Databases, Caches). This makes it easier to add or remove instances without losing critical information.

## Considerations for Choosing a Scaling Strategy

* **Current Load and Projected Growth**: Start with vertical scaling if your load is moderate. Plan for horizontal scaling as you anticipate growth.
* **Complexity**: Horizontal scaling introduces more components (load balancers, shared backends) and thus more operational complexity.
* **High Availability Requirements**: Horizontal scaling is essential for high availability, as the failure of one instance does not bring down the entire service.
* **Cost**: Compare the costs of larger single servers versus multiple smaller instances and the associated backend services.
* **Geographical Distribution**: For users in different geographical regions, you might consider deploying Sockudo clusters in multiple regions, potentially with geo-DNS routing and a strategy for inter-cluster communication if needed (though this is an advanced topic beyond basic horizontal scaling).

## Monitoring in a Scaled Environment

When running multiple Sockudo instances:
* Aggregate logs from all instances into a centralized logging system.
* Scrape metrics from all instances into Prometheus (or your chosen monitoring system). Use labels in Prometheus (like `instance` or `node`) to differentiate metrics from different Sockudo servers.
* Monitor the health and performance of your load balancer and shared backend services (Redis, NATS, databases, etc.).

By carefully planning your adapter and backend service configurations, Sockudo can effectively scale horizontally to meet the demands of large-scale real-time applications.
