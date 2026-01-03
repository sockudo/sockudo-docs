# Pusher Protocol Compatibility

Sockudo is designed to be a Pusher-compatible WebSocket server. This means it aims to implement the Pusher Channels protocol, allowing you to use existing Pusher client libraries (like PusherJS, and server libraries for triggering events) with Sockudo as the backend. This is particularly beneficial for projects already using Pusher or those within ecosystems like Laravel that have strong support for Pusher via Laravel Echo.

## Key Aspects of Compatibility

### 1. Client Connection

* **Endpoint**: Clients connect to Sockudo via a WebSocket endpoint, typically `/app/{appKey}` (where `{appKey}` is your application's key). This matches the Pusher connection pattern.
* **Protocol Messages**: Sockudo understands and responds to standard Pusher client protocol messages:
    * `pusher:subscribe`: To subscribe to a channel.
    * `pusher:unsubscribe`: To unsubscribe from a channel.
    * `pusher:ping`: Client sends a ping.
    * `pusher:pong`: Sockudo responds with a pong (and can also send pings to clients).
    * Client Events (e.g., `client-my-event`): If enabled for the application and channel type, Sockudo can relay client-originated events.

### 2. Server-Sent Events

* Sockudo sends messages to clients in the Pusher event format:
    ```json
    {
      "event": "event-name",
      "channel": "channel-name",
      "data": { /* your JSON payload */ }
    }
    ```
* **Internal Events**: Sockudo sends Pusher internal events like:
    * `pusher:connection_established`: Sent to the client upon successful connection, including the `socket_id`.
    * `pusher_internal:subscription_succeeded`: Confirms a successful channel subscription.
    * `pusher_internal:member_added` (for presence channels): Notifies clients of a new member.
    * `pusher_internal:member_removed` (for presence channels): Notifies clients of a member leaving.
    * `pusher:error`: Sent to clients when errors occur (e.g., authentication failure, invalid message).

### 3. Channel Types

Sockudo supports standard Pusher channel types:

* **Public Channels**: Names do not have a prefix (e.g., `orders`). Anyone can subscribe.
* **Private Channels**: Names prefixed with `private-` (e.g., `private-user-123`). Require authentication via your application's auth endpoint.
* **Presence Channels**: Names prefixed with `presence-` (e.g., `presence-chat-room-42`). Require authentication and allow clients to be aware of other subscribed members and their `user_info`.
* **Encrypted Channels (`private-encrypted-`)**: Sockudo aims for compatibility. The end-to-end encryption itself is a client-side concern (using a shared secret between clients, not decrypted by the server). Sockudo facilitates message relay for these channels like other private channels, requiring authentication.

### 4. Authentication

* **Private and Presence Channels**: Sockudo implements the Pusher authentication mechanism. When a client attempts to subscribe to a private or presence channel:
    1.  Sockudo challenges the client.
    2.  The client makes an HTTP request to an authentication endpoint on your application server (e.g., `/broadcasting/auth` in Laravel).
    3.  Your application server validates the user's session/token and, if authorized, returns a JSON response containing a signature. The signature is typically `HMAC-SHA256` of `socket_id:channel_name(:user_id:user_info for presence)`.
    4.  The client sends this auth response back to Sockudo.
    5.  Sockudo verifies the signature using the `app_secret` associated with the `app_key`.
* **HTTP API Authentication**: The Pusher HTTP API for triggering events is also authenticated using a signature scheme involving the `app_key`, `app_secret`, request path, query parameters, and body. Sockudo implements this to validate incoming API requests.

### 5. HTTP API

Sockudo provides an HTTP API that is compatible with the Pusher Channels HTTP API. This allows you to use Pusher server libraries (PHP, Node.js, Python, Ruby, etc.) or simple `curl` commands to:

* Trigger events on channels (`POST /apps/{app_id}/events`).
* Trigger events in batch (`POST /apps/{app_id}/batch_events`).
* Query channel information (`GET /apps/{app_id}/channels`, `GET /apps/{app_id}/channels/{channel_name}`).
* Query users in a presence channel (`GET /apps/{app_id}/channels/{channel_name}/users`).
* Terminate user connections (`POST /apps/{app_id}/users/{user_id}/terminate_connections`).

Refer to the [API Documentation](../api/) for more details.

### 6. Webhooks

Sockudo can send webhooks to your application for events like `channel_occupied`, `channel_vacated`, `member_added`, and `member_removed`, similar to Pusher. The payload format is designed to be compatible.

## Benefits of Pusher Compatibility

* **Ease of Migration**: If you have an existing application using Pusher, you can often switch to Sockudo by changing the host, port, and credentials in your client and server configurations with minimal code changes.
* **Leverage Existing Libraries**: You can use well-tested and feature-rich official Pusher client libraries (PusherJS, pusher-java, pusher-swift, etc.) and server libraries.
* **Ecosystem Support**: Frameworks like Laravel (with Laravel Echo) have built-in support for the Pusher driver, making integration with Sockudo straightforward.
* **Familiar Protocol**: Developers already familiar with Pusher will find Sockudo's behavior and API intuitive.

## Potential Differences or Limitations

While Sockudo strives for full compatibility, there might be minor differences or features of the commercial Pusher service that are not implemented or behave slightly differently, especially concerning:

* **Advanced/Proprietary Features**: Some very specific or newer proprietary features of the commercial Pusher product might not be available in an open-source server like Sockudo.
* **Scale and Infrastructure**: The commercial Pusher service manages a global infrastructure. With Sockudo, you are responsible for deploying, scaling, and managing your own server instances.
* **Specific Error Codes/Messages**: While generally compatible, some error codes or descriptive messages might vary.

Always test your specific application use cases thoroughly when migrating to or adopting Sockudo. If you find any significant compatibility issues, please report them on the [Sockudo GitHub repository](https://github.com/sockudo/sockudo/issues).
