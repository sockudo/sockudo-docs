# HTTP API: Batch Events

This endpoint allows your backend server to publish multiple events to different channels in a single HTTP request. This can be more efficient than sending many individual requests if you need to trigger several events simultaneously.

## Endpoint

```
POST /apps/{app_id}/batch_events
```

### Path Parameters

- `{app_id}` (string, required): The ID of your application.

### Authentication

Required. See [HTTP API Overview](./../http-api.md#authentication).

### Request Body

The request body must be JSON and should contain a single field:

- `batch` (array of event objects, required): An array where each object represents an event to be published. The maximum number of events in a batch is limited by `event_limits.max_batch_size`.

Each **event object** within the `batch` array has the following structure (similar to the single event publish endpoint):

- `name` (string, required): The name of the event.
- `channel` (string, required): The channel name to publish this specific event to. (Note: Unlike single event publishing, `channels` array is not typically used here; each event in the batch specifies its own single channel).
- `data` (string or object, required): The payload for the event.
- `socket_id` (string, optional): If provided, this event will not be sent to the client with this `socket_id` on the specified channel.

### Example Request Body

```json
{
  "batch": [
    {
      "channel": "user-123-notifications",
      "name": "new_message_alert",
      "data": "{\"sender\":\"Alice\",\"preview\":\"Hey there!\"}",
      "socket_id": "optional_socket_id_to_exclude_for_this_event"
    },
    {
      "channel": "live-updates",
      "name": "score_changed",
      "data": "{\"teamA\": 1, \"teamB\": 0}"
    },
    {
      "channel": "private-admin",
      "name": "system_alert",
      "data": "{\"message\":\"Maintenance window approaching.\"}"
    }
  ]
}
```

### Query Parameters (for Authentication)

- `auth_key`
- `auth_timestamp`
- `auth_version`
- `auth_signature`
- `body_md5` (MD5 hash of the entire JSON request body, i.e., `{"batch": [...]}`)
- (Any other parameters included in the signature calculation by your Pusher server library)

## Responses

### 200 OK
The batch of events was successfully accepted for publishing. The response body is typically an empty JSON object `{}`.

```json
{}
```

### 400 Bad Request
The request was malformed (e.g., invalid JSON, batch array missing or malformed, individual events missing required fields, payload too large, too many events in batch).

```json
{
  "error": "Invalid request: 'batch' array must contain valid event objects."
}
```

### 401 Unauthorized
Authentication failed.

```json
{
  "error": "Authentication failed: Invalid signature."
}
```

### 403 Forbidden
Authenticated, but not authorized.

```json
{
  "error": "Forbidden: Application is disabled."
}
```

### 413 Payload Too Large
The overall request body or individual event data payloads exceed configured limits.

## Important Notes

**Atomicity**: The batch operation is generally not atomic in the sense that if one event in the batch is invalid, others might still be processed.