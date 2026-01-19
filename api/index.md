# Sockudo API Introduction

Sockudo provides two primary APIs for interaction:

1.  **HTTP API**: A RESTful API used by your backend server to publish events to channels, query channel information, and manage users. This API is compatible with the Pusher Channels HTTP API.
2.  **WebSocket API**: The core real-time communication API based on the Pusher protocol. Clients (e.g., browsers using PusherJS, mobile apps) connect to this endpoint to subscribe to channels and receive messages.

This section provides detailed documentation for both APIs.

## Authentication

* **HTTP API**: All requests to the HTTP API must be authenticated using a signature scheme involving your `app_key` and `app_secret`. This ensures that only authorized backend services can publish messages or query data.
* **WebSocket API**:
    * Connections are established using an `app_key`.
    * Subscriptions to `private-` and `presence-` channels require an additional authentication step where the client gets a signature from your backend (signed with the `app_secret`) to authorize the subscription.

## API Versioning

The Sockudo API aims to be compatible with a specific version of the Pusher protocol. While this documentation reflects the current implementation, always refer to the official Pusher Channels documentation for the most detailed protocol specifications.

## Getting Started with the API

* To **publish events from your backend**, refer to the [HTTP API documentation](./http-api.md).
* To **connect clients and receive real-time messages**, refer to the [WebSocket API documentation](./websocket-api.md) and the [Integrations section](../integrations/index.md) for client library usage.

Before using the API, ensure you have:
* Configured at least one application in Sockudo with an `app_id`, `app_key`, and `app_secret`. See [App Manager Configuration](../guide/configuration/app-manager.md).
* Started your Sockudo server.
