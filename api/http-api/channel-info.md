# HTTP API: Channel Information

Sockudo provides HTTP API endpoints to retrieve information about channels, such as their status (occupied/vacant) and, for presence channels, the list of subscribed users.

## 1. Get Information for Multiple Channels

This endpoint retrieves information about one or more channels within your application.

### Endpoint

```
GET /apps/{app_id}/channels
```

### Path Parameters

- `{app_id}` (string, required): The ID of your application.

### Authentication

Required. See [HTTP API Overview](./../http-api.md#authentication).

### Query Parameters

**Authentication Parameters:**
- `auth_key`
- `auth_timestamp`
- `auth_version`
- `auth_signature`

**Filtering Parameters:**
- `filter_by_prefix` (string, optional): Filters the list of channels to those whose names start with this prefix (e.g., `private-`, `presence-`).
- `info` (string, optional): A comma-separated list of attributes to include for each channel.
  - `occupied`: (boolean) If the channel has at least one subscriber.
  - `user_count`: (integer, for presence channels only) The number of unique users subscribed to the channel.
  - `subscription_count`: (integer) The total number of connections subscribed to the channel.

### Example Request

Get information about all channels prefixed with `presence-`, including their `user_count`:

```
GET /apps/my-app/channels?auth_key=...&auth_timestamp=...&auth_signature=...&filter_by_prefix=presence-&info=user_count,occupied
```

### Responses

**200 OK**: Successfully retrieved channel information. The response body is a JSON object where keys are channel names.

```json
{
  "channels": {
    "presence-room-1": {
      "occupied": true,
      "user_count": 5
    },
    "presence-room-2": {
      "occupied": true,
      "user_count": 2
    },
    "private-user-updates-123": {
      "occupied": true
    }
  }
}
```

If no channels match or no attributes are requested/applicable, the inner objects might be empty or attributes omitted.

**400 Bad Request**: Invalid parameters.
**401 Unauthorized**: Authentication failed.

## 2. Get Information for a Single Channel

This endpoint retrieves information about a specific channel.

### Endpoint

```
GET /apps/{app_id}/channels/{channel_name}
```

### Path Parameters

- `{app_id}` (string, required): The ID of your application.
- `{channel_name}` (string, required): The name of the channel to query (e.g., `presence-chat-room-42`).

### Authentication

Required.

### Query Parameters

**Authentication Parameters:**
- `auth_key`
- `auth_timestamp`
- `auth_version`
- `auth_signature`

**Filtering Parameters:**
- `info` (string, optional): A comma-separated list of attributes to include.
  - `occupied`: (boolean)
  - `user_count`: (integer, for presence channels)
  - `subscription_count`: (integer)

### Example Request

```
GET /apps/my-app/channels/presence-chat-room-42?auth_key=...&auth_timestamp=...&auth_signature=...&info=occupied,user_count,subscription_count
```

### Responses

**200 OK**: Successfully retrieved channel information.

```json
{
  "occupied": true,
  "user_count": 15,
  "subscription_count": 17
}
```

If the channel does not exist or is not active, `occupied` might be `false`, and counts would be 0 or attributes omitted.

**400 Bad Request**: Invalid parameters.
**401 Unauthorized**: Authentication failed.
**404 Not Found**: The specified channel does not exist or has no information (behavior might vary; it could also return `occupied: false`).

## 3. Get Users in a Presence Channel

This endpoint retrieves the list of users currently subscribed to a specific presence channel.

### Endpoint

```
GET /apps/{app_id}/channels/{channel_name}/users
```

### Path Parameters

- `{app_id}` (string, required): The ID of your application.
- `{channel_name}` (string, required): The name of the presence channel (must start with `presence-`).

### Authentication

Required.

### Query Parameters

**Authentication Parameters:**
- `auth_key`
- `auth_timestamp`
- `auth_version`
- `auth_signature`

### Example Request

```
GET /apps/my-app/channels/presence-gameroom-abc/users?auth_key=...&auth_timestamp=...&auth_signature=...
```

### Responses

**200 OK**: Successfully retrieved the list of users. The response body is a JSON object containing a `users` array. Each user object has an `id` (the `user_id`). Some implementations might also include the `user_info` if available and configured.

```json
{
  "users": [
    { "id": "user_1" },
    { "id": "user_5" },
    { "id": "user_alpha" }
  ]
}
```

If the channel is not a presence channel, is empty, or does not exist, the `users` array will be empty or an error might be returned.

**400 Bad Request**: Invalid parameters (e.g., channel name is not a presence channel).
**401 Unauthorized**: Authentication failed.
**404 Not Found**: The specified presence channel does not exist.