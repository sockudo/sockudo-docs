# Security in Sockudo

Security is a critical aspect of any real-time communication system. Sockudo incorporates several mechanisms and relies on best practices to help you build secure applications. This page outlines key security concepts relevant to Sockudo.

## 1. Application Credentials (`app_id`, `key`, `secret`)

Each application configured in Sockudo has a unique set of credentials:

* **App ID (`id`)**: A unique identifier for your application.
* **App Key (`key`)**: A public identifier used by clients to connect to your application's WebSocket endpoint and by your server when triggering events via the HTTP API.
* **App Secret (`secret`)**: A private, confidential credential. **It must never be exposed to client-side code.** The app secret is used for:
    * Signing authentication responses for private and presence channels.
    * Authenticating requests to the Sockudo HTTP API.

**Best Practices for Credentials:**
* Generate strong, random secrets.
* Store secrets securely (e.g., using environment variables, secrets management tools). Do not commit them to version control.
* Use different credentials for different environments (development, staging, production).
* Rotate secrets periodically or if a compromise is suspected.

## 2. Channel Security & Authentication

Sockudo supports different types of channels, each with its own security model:

* **Public Channels**:
    * No authentication is required to subscribe. Any client connected with a valid app key can subscribe.
    * Suitable for broadcasting non-sensitive, public information.

* **Private Channels (`private-` prefix)**:
    * Require authentication to subscribe.
    * When a client attempts to subscribe, Sockudo challenges it. The client must then request an authentication token from your application's backend (auth endpoint).
    * Your backend validates the user's identity (e.g., via session cookie, API token) and, if authorized for that channel, generates a signature using the **app secret**.
    * Sockudo verifies this signature. Only clients with a valid signature can subscribe.
    * This ensures that only authenticated and authorized users can listen to messages on these channels.

* **Presence Channels (`presence-` prefix)**:
    * Build upon private channels, requiring the same authentication mechanism.
    * Additionally, they allow subscribed clients to be aware of other members in the channel.
    * The authentication response from your backend for presence channels includes `user_id` and `user_info` (a JSON string of user details), which are then shared with other members.
    * **Security Note for `user_info`**: Only include information in `user_info` that is safe to be seen by all other members of that presence channel.

* **Encrypted Channels (`private-encrypted-` prefix)**:
    * From Sockudo's perspective, these are treated like private channels and require the same authentication.
    * The "encrypted" part refers to end-to-end encryption, which must be implemented at the client-side. Clients subscribing to an encrypted channel need a shared secret (not known to Sockudo) to encrypt/decrypt messages. Sockudo relays the encrypted payloads without attempting to decrypt them.

## 3. HTTP API Authentication

All requests to Sockudo's HTTP API (e.g., for triggering events) must be authenticated. This uses a signature-based scheme similar to AWS request signing:

* The request includes parameters like `auth_key` (your app key), `auth_timestamp`, `auth_version`, and an `auth_signature`.
* The `auth_signature` is an HMAC-SHA256 hash of a standardized string constructed from the request method, path, query parameters, and (if applicable) request body, signed with your **app secret**.
* Sockudo reconstructs this string and signature on its end and compares it to the provided signature. A mismatch results in an authentication failure (typically a 401 or 403 error).
* This prevents unauthorized parties from triggering events or accessing API endpoints.

## 4. SSL/TLS Encryption

For production environments, it is crucial to encrypt data in transit between clients and Sockudo, and between Sockudo and your backend (e.g., for auth requests, webhooks).

* **Client to Sockudo**: Configure Sockudo (or a reverse proxy in front of it) to use SSL/TLS. Clients should connect using `wss://` instead of `ws://`. See [SSL/TLS Configuration](../guide/configuration/ssl.md).
* **Sockudo to Your Backend**:
    * **Auth Endpoints**: Ensure your application's authentication endpoint (e.g., `https://your-app.com/broadcasting/auth`) uses HTTPS.
    * **Webhook Endpoints**: Ensure your webhook receiver endpoints use HTTPS.

## 5. Rate Limiting

Sockudo provides rate limiting capabilities to protect against abuse and denial-of-service attacks:

* **API Rate Limiting**: Limits the number of HTTP API requests an IP address can make in a given time window.
* **WebSocket Connection Rate Limiting**: Limits the number of new WebSocket connection attempts from an IP address.
* This helps prevent a single malicious or misbehaving client from overwhelming the server.
* See [Rate Limiter Configuration](../guide/configuration/rate-limiter.md).

## 6. Webhook Security

* **HTTPS**: Always use HTTPS for your webhook receiver URLs.
* **Signature Verification (Recommended)**: While Sockudo sends webhooks, the Pusher protocol also defines a way for webhook receivers to verify that the webhook genuinely came from the Pusher server (or, in this case, Sockudo). This involves Sockudo including an `X-Pusher-Key` header (your app key) and an `X-Pusher-Signature` header (HMAC-SHA256 of the webhook body, signed with your app secret). Your webhook endpoint should verify this signature.
    * *Check if Sockudo's webhook implementation includes these headers and signature generation. If so, document how users can verify them.*
* **Idempotency**: Design your webhook handlers to be idempotent, as network issues might cause webhooks to be delivered more than once in some systems.

## 7. Origin Validation

Sockudo provides app-level origin validation as an additional security layer for WebSocket connections. This feature complements CORS configuration by allowing you to restrict which domains can establish WebSocket connections to specific applications.

* **How It Works**: When configured, Sockudo validates the `Origin` header of incoming WebSocket connections against a list of allowed patterns before fully establishing the connection.
* **CORS-Like Behavior**: Supports protocol-agnostic patterns (`example.com` matches both HTTP and HTTPS), protocol-specific patterns (`https://example.com` only matches HTTPS), and wildcard patterns (`*.example.com` for subdomains).
* **Per-App Configuration**: Each application can have its own set of allowed origins, providing fine-grained control over which domains can connect.
* **Error Handling**: Rejected connections receive a Pusher protocol error (`code: 4009, message: "Origin not allowed"`) before disconnection.

**Security Considerations**:
* Origin validation is browser-only protection. Non-browser clients can spoof the Origin header.
* This feature provides defense-in-depth but should not be the only security measure.
* If not configured or empty, all origins are allowed (backward compatible).
* Missing Origin headers are rejected when origin validation is configured.

For detailed configuration instructions, see [Origin Validation Configuration](../guide/configuration/origin-validation.md).

## 8. Client-Sent Events

* The `enable_client_messages` option (per app) controls whether clients can directly publish events to channels they are subscribed to.
* **Security Considerations**:
    * Client events are typically prefixed with `client-`.
    * They are broadcast to other subscribed clients on that channel but **do not** go through your application backend for validation by default (unless you have a specific setup to intercept them via webhooks and re-broadcast).
    * Only enable this feature if you understand the implications. It's suitable for use cases like typing indicators or cursor movements where server-side validation of each event is not critical.
    * Client events can only be triggered on private and presence channels after successful authentication for that channel. They cannot be triggered on public channels.
    * There's also a `max_client_events_per_second` limit per app.

## 9. General Server Security

Refer to the [Deployment Guide](../guide/deployment.md#security-best-practices) for broader server security practices, including:
* Running as a non-root user.
* Firewall configuration.
* Regular updates.
* Securing backend services (Redis, NATS, databases).

By understanding and correctly implementing these security features and practices, you can significantly enhance the security posture of your Sockudo-powered real-time applications.
