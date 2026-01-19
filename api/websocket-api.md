# WebSocket API (Pusher Protocol)

The WebSocket API is the core of Sockudo's real-time functionality. Clients connect to this API to subscribe to channels and send/receive messages in real-time. Sockudo implements the Pusher Channels client protocol.

## Connection Endpoint

Clients establish a WebSocket connection to Sockudo using a URL similar to this:

`ws://<sockudo_host>:<sockudo_port>/app/<app_key>`

Or, if SSL/TLS is enabled in Sockudo (or on a reverse proxy):

`wss://<sockudo_host>:<sockudo_port>/app/<app_key>`

* `<sockudo_host>`: The hostname or IP address of your Sockudo server.
* `<sockudo_port>`: The port Sockudo is listening on (default: `6001`).
* `<app_key>`: Your application's public key.

If a `path_prefix` is configured in Sockudo, it will be part of the URL:
`ws://<host>:<port>/<path_prefix>/app/<app_key>`

## Client Libraries

It is **highly recommended** to use official Pusher client libraries (like PusherJS for web, or native libraries for iOS/Android) to interact with Sockudo. These libraries handle:
* Connection management (including reconnections).
* Protocol message formatting and parsing.
* Channel subscriptions and unsubscriptions.
* Authentication flow for private and presence channels.
* Binding to events.

Refer to the [Integrations section](../integrations/laravel-echo.md) for examples using specific client libraries.

## Core Protocol Messages

Clients and Sockudo communicate using JSON-formatted messages.

### Client to Server Messages

* **`pusher:subscribe`**: Sent by the client to subscribe to a channel.
    ```json
    {
      "event": "pusher:subscribe",
      "data": {
        "channel": "channel-name",
        "auth": "optional-auth-string-for-private-or-presence-channels",
        "channel_data": "optional-user-info-json-string-for-presence-channels"
      }
    }
    ```
    * `auth`: For private/presence channels, this contains the signature obtained from your application's auth endpoint.
    * `channel_data`: For presence channels, this contains the `user_info` (as a JSON string) if the auth response included it.

* **`pusher:unsubscribe`**: Sent by the client to unsubscribe from a channel.
    ```json
    {
      "event": "pusher:unsubscribe",
      "data": {
        "channel": "channel-name"
      }
    }
    ```

* **`pusher:ping`**: Sent by the client to check if the connection is alive. Sockudo will respond with `pusher:pong`.
    ```json
    {
      "event": "pusher:ping",
      "data": {} // Or may contain arbitrary data
    }
    ```

* **Client Events (e.g., `client-some-event`)**: If client events are enabled for the app and the client is subscribed to an authenticated channel (private or presence), it can send events directly to other clients on that channel.
    ```json
    {
      "event": "client-my-custom-event",
      "channel": "private-chat-room",
      "data": {
        "message": "Typing..."
      }
    }
    ```
    Sockudo will relay these to other subscribers on the channel. These events are **not** typically processed by your backend server unless you explicitly set up webhooks for them.

### Server to Client Messages

* **`pusher:connection_established`**: Sent by Sockudo immediately after a successful WebSocket connection.
    ```json
    {
      "event": "pusher:connection_established",
      "data": {
        "socket_id": "unique-socket-id-for-this-connection",
        "activity_timeout": 30 // Example: seconds
      }
    }
    ```
    The `socket_id` is crucial for private/presence channel authentication and for excluding a client from receiving its own messages when events are triggered via the HTTP API.

* **`pusher:pong`**: Sent by Sockudo in response to a client's `pusher:ping`.
    ```json
    {
      "event": "pusher:pong",
      "data": {} // Or may echo data from ping
    }
    ```
    Sockudo may also proactively send `pusher:ping` messages to clients to check liveness, expecting a `pusher:pong` in return from the client library.

* **`pusher_internal:subscription_succeeded`**: Confirms a successful subscription to a channel.
    ```json
    {
      "event": "pusher_internal:subscription_succeeded",
      "channel": "channel-name",
      "data": {} // For presence channels, this will contain the 'hash' of current members
    }
    ```
    For presence channels, the `data` object will look like:
    ```json
    {
      "event": "pusher_internal:subscription_succeeded",
      "channel": "presence-room-1",
      "data": {
        "presence": {
          "count": 2,
          "ids": ["user-1", "user-2"],
          "hash": {
            "user-1": { "name": "Alice" }, // user_info
            "user-2": { "name": "Bob" }   // user_info
          }
        }
      }
    }
    ```

* **`pusher_internal:member_added`** (Presence Channels): Sent when a new member joins a presence channel the client is subscribed to.
    ```json
    {
      "event": "pusher_internal:member_added",
      "channel": "presence-room-1",
      "data": {
        "user_id": "user-3",
        "user_info": { "name": "Charlie" }
      }
    }
    ```

* **`pusher_internal:member_removed`** (Presence Channels): Sent when a member leaves a presence channel the client is subscribed to.
    ```json
    {
      "event": "pusher_internal:member_removed",
      "channel": "presence-room-1",
      "data": {
        "user_id": "user-1"
      }
    }
    ```

* **Custom Events (e.g., `new-message`)**: Events triggered by your backend via the HTTP API.
    ```json
    {
      "event": "new-message",
      "channel": "chat-room-1",
      "data": {
        "user": "Alice",
        "text": "Hello from the server!"
      }
    }
    ```

* **`pusher:error`**: Sent by Sockudo if an error occurs.
    ```json
    {
      "event": "pusher:error",
      "data": {
        "code": 4001, // Example error code
        "message": "Application key <app_key> does not exist."
      }
    }
    ```
    Common error codes relate to app state (disabled, over connection limit), authentication failures, or protocol violations.

## Channel Types and Authentication

* **Public Channels**: No special `auth` needed in `pusher:subscribe`.
* **Private Channels (`private-`)**: Require an `auth` token.
* **Presence Channels (`presence-`)**: Require an `auth` token and `channel_data` (user info) in the `pusher:subscribe` message.

The authentication flow for private/presence channels is detailed in the [Pusher Compatibility concept page](../concepts/pusher-compatibility.md#authentication) and the [Security concept page](../concepts/security.md#2-channel-security--authentication).

## Rate Limiting

New WebSocket connection attempts are subject to rate limiting if configured in Sockudo. See [Rate Limiter Configuration](../guide/configuration/rate-limiter.md).
