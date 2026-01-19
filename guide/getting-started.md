# Getting Started with Sockudo

Welcome to Sockudo! This guide will walk you through the initial steps to get Sockudo up and running on your system. We'll cover prerequisites, installation, and how to start the server.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* **Rust**: Version 1.75 or newer. You can install Rust via [rustup](https://rustup.rs/).
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```
  If you already have Rust, ensure it's up to date:
    ```bash
    rustup update
    ```
* **Git**: For cloning the repository.
* **(Optional) Docker**: For the easiest setup using the provided Docker configuration.
* **(Optional) Redis**: Required if you plan to use the Redis adapter for scaling or caching. Sockudo can run without it using the `local` adapter or `memory` cache/app manager.
* **(Optional) NATS Server**: Required if you plan to use the NATS adapter.
* **(Optional) MySQL/PostgreSQL/DynamoDB**: Required if you plan to use the respective App Manager drivers.

## Quick Start with Docker (Recommended)

The fastest way to get Sockudo running is with Docker:

```bash
# Clone the repository
git clone https://github.com/sockudo/sockudo.git
cd sockudo

# Copy environment variables template
cp .env.example .env
# Edit .env file if needed (optional for basic setup)

# Quick setup and start
make quick-start
# Or, using docker-compose directly:
# docker-compose up -d
```

Alternatively, you can pull the pre-built image:

```bash
docker pull sockudo/sockudo:latest
```

Sockudo should now be running on `http://localhost:6001`.

## Installation from Source

Follow these steps to download and build Sockudo from source:

1.  **Clone the Repository**

    Open your terminal and clone the Sockudo repository from GitHub:
    ```bash
    git clone https://github.com/sockudo/sockudo.git
    cd sockudo
    ```

2.  **Build the Project**

    Navigate into the cloned directory and use Cargo (Rust's package manager and build tool) to compile the project. For a production-ready build, use the `--release` flag:
    ```bash
    cargo build --release
    ```
    This command will compile Sockudo and place the executable in the `target/release/` directory. If you omit `--release`, a debug build will be created in `target/debug/`.

3.  **Prebuilt Binaries**

    Alternatively, prebuilt binaries are available for download on the [Releases page](https://github.com/sockudo/sockudo/releases).

## Running Sockudo

Once the build is complete, you can start the Sockudo server.

1.  **Start the Server (Default Configuration)**

    To run Sockudo with its default settings (which use in-memory stores and listen on port 6001), execute the compiled binary:
    ```bash
    ./target/release/sockudo
    ```
    If you built in debug mode, the path would be `./target/debug/sockudo`.

    You should see log output in your terminal indicating that the server has started, similar to this:
    ```
    INFO sockudo::main: Starting Sockudo server initialization process...
    INFO sockudo::main: Final configuration loaded. Initializing server components.
    INFO sockudo::main: Initializing Sockudo server with new configuration...
    INFO sockudo::main: AppManager initialized with driver: Memory
    INFO sockudo::main: Adapter initialized with driver: Local
    INFO sockudo::main: CacheManager initialized with driver: Memory
    INFO sockudo::main: Metrics are enabled on port 9601
    INFO sockudo::main: HTTP API RateLimiter initialized (enabled: true) with driver: Memory
    INFO sockudo::main: Queue driver set to Redis
    INFO sockudo::main: Webhook integration initialized successfully
    INFO sockudo::main: Server init sequence started.
    INFO sockudo::main: No apps found in configuration, registering demo app
    INFO sockudo::main: Successfully registered demo app
    INFO sockudo::main: Server has 1 registered apps:
    INFO sockudo::main: - App: id=demo-app, key=demo-key, enabled=true
    INFO sockudo::main: Server init sequence completed.
    INFO sockudo::main: Starting Sockudo server services...
    INFO sockudo::main: SSL is not enabled, starting HTTP server
    INFO sockudo::main: HTTP server listening on 0.0.0.0:6001
    ```

    By default, Sockudo will:
    * Listen on `0.0.0.0:6001`.
    * Use the `local` adapter (no external message broker needed for single-instance operation).
    * Use the `memory` app manager (apps are configured in-memory or via a default demo app).
    * Use the `memory` cache.
    * Enable metrics on port `9601`.

2.  **Verifying the Server**

    You can quickly check if the server is running by navigating to the health check endpoint:
    * Health check: `http://localhost:6001/up/demo-app` (using the default demo app)
    * Server usage: `http://localhost:6001/usage`
    * Metrics: `http://localhost:9601/metrics` (Prometheus format)

## Basic Configuration

Sockudo can be configured in two primary ways:

1.  **Using a `config.json` file**: Create a `config/config.json` file in the project directory (or specify a path using the `--config` flag).
2.  **Using Environment Variables**: Many configuration options can be set via environment variables.

For a minimal setup, the default configuration is often sufficient for initial testing.

### Example Configuration File

Create a `config/config.json` file:

```json
{
  "debug": true,
  "host": "0.0.0.0",
  "port": 6001,
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "my-first-app",
          "key": "app-key-123",
          "secret": "app-secret-xyz",
          "max_connections": 100,
          "enable_client_messages": true,
          "enabled": true,
          "max_client_events_per_second": 10
        }
      ]
    }
  },
  "adapter": {
    "driver": "local"
  },
  "cache": {
    "driver": "memory"
  },
  "metrics": {
    "enabled": true,
    "port": 9601
  }
}
```

### Environment Variables

Alternatively, you can use environment variables. Create a `.env` file:

```bash
# Basic Settings
HOST=0.0.0.0
PORT=6001
DEBUG=true

# Drivers
ADAPTER_DRIVER=local
APP_MANAGER_DRIVER=memory
CACHE_DRIVER=memory
QUEUE_DRIVER=memory

# Default App (if not using persistent app manager)
SOCKUDO_DEFAULT_APP_ID=my-app
SOCKUDO_DEFAULT_APP_KEY=my-key
SOCKUDO_DEFAULT_APP_SECRET=my-secret
SOCKUDO_ENABLE_CLIENT_MESSAGES=true

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9601
```

## Testing Your Setup

### Using WebSocket Client

You can test your Sockudo server using a simple WebSocket client:

```javascript
// Connect to Sockudo
const ws = new WebSocket('ws://localhost:6001/app/demo-key');

ws.onopen = function() {
    console.log('Connected to Sockudo');
    
    // Subscribe to a public channel
    ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: {
            channel: 'test-channel'
        }
    }));
};

ws.onmessage = function(event) {
    console.log('Message received:', JSON.parse(event.data));
};
```

### Using Pusher JavaScript Client

Sockudo is compatible with the Pusher protocol, so you can use the Pusher JavaScript client:

```javascript
import Pusher from 'pusher-js';

const pusher = new Pusher('demo-key', {
    wsHost: 'localhost',
    wsPort: 6001,
    forceTLS: false,
    enabledTransports: ['ws']
});

const channel = pusher.subscribe('test-channel');
channel.bind('test-event', function(data) {
    console.log('Event received:', data);
});
```

### Testing API Endpoints

Test the HTTP API:

```bash
# Get server usage
curl http://localhost:6001/usage

# Get app info (health check)
curl http://localhost:6001/up/demo-app

# Send an event to a channel (requires proper authentication for production)
curl -X POST "http://localhost:6001/apps/demo-app/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-event",
    "channels": ["test-channel"],
    "data": {"message": "Hello World"}
  }'
```

## Next Steps

Congratulations! You've successfully installed and run Sockudo. Here's what you might want to do next:

1. **Configure Sockudo**: Dive deep into all the available configuration options to tailor Sockudo to your needs.
2. **Integrate with Laravel Echo**: Learn how to connect your Laravel application to Sockudo.
3. **Use with Pusher JS**: See examples of how to use the standard Pusher JavaScript client.
4. **Explore API Endpoints**: Understand the HTTP and WebSocket APIs Sockudo provides.
5. **Set up for Production**: Learn about scaling, SSL configuration, and deployment strategies.
6. **Configure Webhooks**: Set up event notifications to your application.

For detailed information on configuration options, refer to the [Configuration Guide](./configuration.md).

## Common Issues

### Port Already in Use
If you get an error that port 6001 is already in use, either:
- Stop the service using that port
- Change the port in your configuration: `"port": 6002` or `PORT=6002`

### Permission Denied
On some systems, you might need to make the binary executable:
```bash
chmod +x ./target/release/sockudo
```

### Redis Connection Issues
If using Redis drivers and getting connection errors:
- Ensure Redis is running: `redis-cli ping`
- Check your Redis URL configuration
- Verify network connectivity to Redis server

For more troubleshooting help, see the [Troubleshooting Guide](./troubleshooting.md).
