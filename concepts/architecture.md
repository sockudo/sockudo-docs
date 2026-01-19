# Sockudo Architecture

Sockudo is designed with a modular and extensible architecture to provide a high-performance, scalable, and maintainable WebSocket server. Understanding its core components can help you configure it effectively and potentially extend its functionality.

The main components, as also highlighted in the `README.md` and visible in the `src/main.rs` initialization, include:

## 1. Core Server (`main.rs`)

* **Entry Point**: Initializes all managers, loads configuration, and starts the HTTP and WebSocket listeners.
* **Configuration Loading**: Handles loading settings from `config.json` and environment variables, with environment variables taking precedence.
* **HTTP Handling**: Uses Axum framework for HTTP request routing. This includes:
    * WebSocket upgrade endpoint (e.g., `/app/{appKey}`).
    * Pusher-compatible HTTP API endpoints (e.g., `/apps/{appId}/events`).
    * Metrics endpoint (e.g., `/metrics`).
* **SSL/TLS Termination**: Can handle SSL/TLS directly or operate behind a reverse proxy.
* **Graceful Shutdown**: Manages server shutdown, attempting to close connections and resources cleanly.

## 2. Adapter (`src/adapter/`)

* **Role**: Manages WebSocket connections and, crucially, handles message broadcasting across multiple Sockudo instances in a scaled environment. This is key for horizontal scalability.
* **Implementations**:
    * **Local Adapter**: For single-instance deployments. Messages are broadcast directly within the same process.
    * **Redis Adapter**: Uses a Redis server (or Sentinel setup) as a publish/subscribe message broker. When one Sockudo instance needs to send a message to clients connected to other instances, it publishes the message to Redis, and other instances subscribed to relevant Redis channels pick it up and relay it to their connected clients.
    * **Redis Cluster Adapter**: Similar to the Redis adapter but specifically for Redis Cluster environments.
    * **NATS Adapter**: Uses NATS as the message broker for inter-node communication.
* **Key Functions**:
    * Adding and removing WebSocket connections to/from namespaces and channels.
    * Broadcasting messages to all clients in a channel, specific clients, or across all connected clients of an app.
    * Managing namespaces (typically one per application).
* **Configuration**: `adapter.driver` in `config.json` selects the active adapter. See [Adapter Configuration](../guide/configuration/adapter.md).

## 3. App Manager (`src/app/`)

* **Role**: Manages application configurations, including app ID, key, secret, and app-specific settings like maximum connections, enabled features (e.g., client events), and webhook configurations.
* **Authentication**: Provides application details needed for authenticating incoming WebSocket connections and HTTP API requests.
* **Implementations**:
    * **Memory App Manager**: Stores app configurations in memory. Apps can be defined in `config.json` under `app_manager.array.apps`. Suitable for development or simple setups.
    * **MySQL App Manager**: Stores app configurations in a MySQL database.
    * **DynamoDB App Manager**: Stores app configurations in AWS DynamoDB.
* **Caching**: Can cache app configurations to reduce lookups to the backend datastore.
* **Configuration**: `app_manager.driver` in `config.json`. See [App Manager Configuration](../guide/configuration/app-manager.md).

## 4. Channel Manager (`src/channel/`)

* **Role**: Manages channel subscriptions and state, particularly for presence channels.
* **Functionality**:
    * Tracks which users are subscribed to which channels.
    * For presence channels, it maintains the list of members and their `user_info`.
    * Handles authorization for private and presence channels, often by interacting with the `AuthValidator` and the client's configured authentication endpoint.
* **Interaction**: Works closely with the chosen Adapter to broadcast presence events (member added/removed).

## 5. Cache Manager (`src/cache/`)

* **Role**: Provides caching capabilities for various parts of Sockudo to improve performance.
* **Uses**:
    * Caching presence channel member data.
    * App Manager can use it for caching app configurations.
    * Rate Limiter can use it as a backend.
* **Implementations**:
    * **Memory Cache**: In-memory caching.
    * **Redis Cache**: Uses Redis for distributed caching.
    * **Redis Cluster Cache**: Uses Redis Cluster for distributed caching.
* **Configuration**: `cache.driver` in `config.json`. See [Cache Configuration](../guide/configuration/cache.md).

## 6. Queue Manager (`src/queue/`)

* **Role**: Manages background job processing, primarily used for dispatching webhooks asynchronously.
* **Benefits**: Decouples webhook sending from the main request/response cycle, improving server responsiveness and reliability of webhook delivery.
* **Implementations**:
    * **Memory Queue**: In-memory queue, not persistent or shared.
    * **Redis Queue**: Uses Redis lists as a message queue.
    * **SQS Queue**: Uses Amazon Simple Queue Service.
* **Configuration**: `queue.driver` in `config.json`. See [Queue Configuration](../guide/configuration/queue.md).

## 7. Metrics (`src/metrics/`)

* **Role**: Collects and exposes performance and operational metrics.
* **Implementation**:
    * **Prometheus**: Exposes metrics in a Prometheus-compatible format via an HTTP endpoint (typically `/metrics` on a separate port).
* **Functionality**: Provides insights into active connections, message rates, API usage, error rates, etc.
* **Configuration**: `metrics.enabled` and related settings in `config.json`. See [Metrics Configuration](../guide/configuration/metrics.md) and the [Monitoring Guide](../guide/monitoring.md).

## 8. Webhook Integration (`src/webhook/`)

* **Role**: Handles sending webhook events to configured application endpoints or Lambda functions.
* **Events**: Notifies applications about events like `channel_occupied`, `channel_vacated`, `member_added`, `member_removed`.
* **Mechanism**: Typically uses the Queue Manager for asynchronous dispatch.
* **Configuration**: Webhook endpoints are defined per-application in the App Manager. Global batching settings are under `webhooks.batching`. See [Webhooks Configuration](../guide/configuration/webhooks.md).

## 9. Rate Limiter (`src/rate_limiter/`)

* **Role**: Protects the server from abuse by limiting the number of requests (HTTP API) or connection attempts (WebSocket) from a single IP address over a defined time window.
* **Backend**: Can use a cache driver (Memory, Redis) to store request counts.
* **Configuration**: `rate_limiter.enabled` and specific limits in `config.json`. See [Rate Limiter Configuration](../guide/configuration/rate-limiter.md).

## Data Flow (Simplified Example: Client Subscribes to a Private Channel)

1.  **Client Request**: Client (e.g., PusherJS) attempts to subscribe to `private-mychannel` via its WebSocket connection.
2.  **Sockudo (ws_handler)**: Receives the `pusher:subscribe` message.
3.  **App Manager**: Sockudo identifies the app based on the connection's app key.
4.  **Channel Manager & Auth Validator**:
    * Recognizes it's a private channel.
    * The client is instructed to authenticate. The client makes an HTTP POST request to its own backend's auth endpoint (e.g., `/broadcasting/auth` in a Laravel app).
    * The client's backend validates the user and, if authorized, returns a signed auth token (e.g., `{"auth":"app_key:signature"}`).
    * The client sends this auth token back to Sockudo over the WebSocket.
    * Sockudo's `AuthValidator` (using the app's secret from App Manager) verifies the signature.
5.  **Subscription Confirmation**: If auth is successful, the Channel Manager records the subscription.
6.  **Adapter**: If this is the first subscriber to `private-mychannel` for this app (across all Sockudo nodes if scaled), the Adapter might trigger a `channel_occupied` event (which could lead to a webhook).
7.  **Client Notification**: Sockudo sends a `pusher_internal:subscription_succeeded` message to the client.

This modular design allows for flexibility and makes Sockudo adaptable to different operational requirements and scales.
