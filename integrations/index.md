# Integrating Sockudo with Clients and Servers

Sockudo's compatibility with the Pusher protocol allows it to integrate seamlessly with a wide array of existing client-side and server-side libraries designed for Pusher. This section provides guides and examples for connecting your applications to Sockudo.

## Why Integration Matters

By leveraging existing libraries, you can:
* **Save Development Time**: No need to write custom WebSocket handling or protocol parsing.
* **Use Familiar Tools**: If you're already using Pusher libraries or frameworks with Pusher support, the transition to Sockudo can be very smooth.
* **Benefit from Community Support**: These libraries are often well-tested, documented, and supported by active communities.

## Client-Side Integrations

Client-side libraries are used in your frontend applications (web browsers, mobile apps) to establish a WebSocket connection to Sockudo, subscribe to channels, and receive real-time messages.

* **[Laravel Echo & PusherJS](./laravel-echo.md)**: The most common integration for Laravel applications, using Laravel Echo with the PusherJS driver.
* **[PusherJS (Standalone)](./pusher-js.md)**: For any JavaScript frontend (React, Vue, Angular, vanilla JS) that needs to connect to Sockudo.
* **[Other Client Libraries](./other-clients.md)**: Guidance for using Pusher-compatible client libraries for other platforms like Android (Java/Kotlin) and iOS (Swift).

## Server-Side Integrations

Server-side libraries are used in your backend application to interact with Sockudo's HTTP API. This primarily involves triggering events on channels to broadcast messages to connected clients.

* **[Guidance for Various Backends](./other-clients.md#server-side-libraries-for-triggering-events)**: Examples and configuration principles for using Pusher server libraries in languages like PHP, Node.js, Python, and others.

## Key Configuration Aspects

When integrating any Pusher-compatible library with Sockudo, you'll generally need to configure:
* **Host and Port**: Pointing the library to your Sockudo server's address.
* **App Credentials**: Using your Sockudo `app_key` for client connections and `app_id`, `app_key`, and `app_secret` for server-side API calls.
* **Encryption**: Ensuring the scheme (`ws://` or `wss://`) matches your Sockudo server's SSL/TLS setup.

Explore the specific guides in this section for detailed instructions tailored to different libraries and frameworks.
