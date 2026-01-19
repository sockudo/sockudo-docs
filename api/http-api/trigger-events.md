# HTTP API: Trigger Events

This endpoint allows your backend server to publish (trigger) a single event to one or more channels.

## Endpoint

```
POST /apps/{app_id}/events
```

### Path Parameters

- `{app_id}` (string, required): The ID of your application.

### Authentication

Required. See [HTTP API Overview](./../http-api.md#authentication).

### Request Body

The request body must be JSON and should contain the following fields:

- `name` (string, required): The name of the event to trigger (e.g., `"new-message"`, `"order-update"`).
  - Client-originated events are typically prefixed with `client-`. Events triggered via this API should not use this prefix unless you intend to mimic a client event (which is unusual).
  - Pusher reserves event names prefixed with `pusher:` and `pusher_internal:`. Avoid using these.
- `data` (string or object, required): The payload for the event. This is typically a JSON string, or an object that will be serialized to JSON. The maximum size is limited by `event_limits.max_payload_in_kb` and app-specific limits.
- `channels` (array of strings, optional): A list of channel names to publish the event to. Maximum number of channels is limited by `event_limits.max_channels_at_once`.
  - If omitted, you must provide the `channel` field.
- `channel` (string, optional): A single channel name to publish the event to.
  - If omitted, you must provide the `channels` field.
- `socket_id` (string, optional): If provided, the event will not be sent to the client with this `socket_id`. This is useful for preventing a client from receiving an echo of an event it just triggered (e.g., via a client event that was processed by your backend and then re-broadcast).

### Example Request Body

**Publishing to a single channel:**

```json
{
  "name": "new-message",
  "channel": "chat-room-1",
  "data": "{\"user\":\"Alice\",\"message\":\"Hello world!\"}",
  "socket_id": "optional_socket_id_to_exclude"
}
```

**Publishing to multiple channels:**

```json
{
  "name": "item-updated",
  "channels": ["product-123", "notifications-global"],
  "data": "{\"item_id\":123,\"status\":\"in_stock\"}"
}
```

### Query Parameters (for Authentication)

- `auth_key`
- `auth_timestamp`
- `auth_version`
- `auth_signature`
- `body_md5` (MD5 hash of the JSON request body)
- (Any other parameters included in the signature calculation by your Pusher server library)

## Responses

### 200 OK
The event was successfully accepted for publishing. The response body is typically an empty JSON object `{}`.

```json
{}
```

### 400 Bad Request
The request was malformed (e.g., missing required fields, invalid JSON, payload too large, too many channels).

```json
{
  "error": "Invalid request: 'name' field is required."
}
```

### 401 Unauthorized
Authentication failed (e.g., invalid auth_key or auth_signature).

```json
{
  "error": "Authentication failed: Invalid signature."
}
```

### 403 Forbidden
Authenticated, but not authorized for this action (e.g., app disabled, trying to publish to a channel type not allowed for API events).

```json
{
  "error": "Forbidden: Application is disabled."
}
```

### 413 Payload Too Large
The data payload exceeds the configured maximum size.

```json
{
  "error": "Payload too large. Maximum size is 100KB."
}
```

## Example curl Request

This example assumes you have manually generated the authentication parameters. In practice, use a Pusher server library.

```bash
# Note: auth_timestamp, body_md5, and auth_signature would need to be correctly calculated.
# This is a conceptual example.
APP_ID="your_app_id"
APP_KEY="your_app_key"
APP_SECRET="your_app_secret" # Used to generate signature, not sent directly
SOCKUDO_HOST="localhost:6001"

TIMESTAMP=$(date +%s)
BODY_JSON='{"name":"new-order","channel":"orders","data":"{\"order_id\":789,\"amount\":99.99}"}'
BODY_MD5=$(echo -n "$BODY_JSON" | md5sum | awk '{print $1}')

# Simplified string to sign (actual Pusher libraries have a more complex method)
STRING_TO_SIGN="POST\n/apps/${APP_ID}/events\nauth_key=${APP_KEY}&auth_timestamp=${TIMESTAMP}&auth_version=1.0&body_md5=${BODY_MD5}"
SIGNATURE=$(echo -n "$STRING_TO_SIGN" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | xxd -p -c 256)

curl -X POST "http://${SOCKUDO_HOST}/apps/${APP_ID}/events?auth_key=${APP_KEY}&auth_timestamp=${TIMESTAMP}&auth_version=1.0&body_md5=${BODY_MD5}&auth_signature=${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d "$BODY_JSON"
```