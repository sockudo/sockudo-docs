# HTTP API: User Management

Sockudo provides an HTTP API endpoint for managing user connections, specifically for terminating all WebSocket connections associated with a given user ID. This is useful if you need to forcibly disconnect a user from your application (e.g., due to a security concern, account suspension, or logout from all devices).

## Terminate User Connections

This endpoint allows your backend server to close all active WebSocket connections for a specific user ID across all Sockudo instances (if using a shared adapter).

### Endpoint

```
POST /apps/{app_id}/users/{user_id}/terminate_connections
```

### Path Parameters

- `{app_id}` (string, required): The ID of your application.
- `{user_id}` (string, required): The ID of the user whose connections you want to terminate. This `user_id` should correspond to the ID your application uses to identify users, especially the one provided during presence channel authentication.

### Authentication

Required. See [HTTP API Overview](./../http-api.md#authentication).

### Request Body

The request body for this endpoint is typically empty.

### Query Parameters (for Authentication)

- `auth_key`
- `auth_timestamp`
- `auth_version`
- `auth_signature`
- `body_md5` (If your Pusher library calculates MD5 for empty bodies, it would be the MD5 of an empty string: `d41d8cd98f00b204e9800998ecf8427e`. Otherwise, it might be omitted if the library handles it).

## Responses

### 200 OK
The request to terminate user connections was successfully accepted. The response body is typically an empty JSON object `{}`.

```json
{}
```

**Note**: A `200 OK` response indicates that Sockudo has received the instruction. The actual disconnection of clients happens asynchronously.

### 400 Bad Request
The request was malformed (e.g., invalid `app_id` or `user_id` format).

```json
{
  "error": "Invalid request: 'user_id' cannot be empty."
}
```

### 401 Unauthorized
Authentication failed.

```json
{
  "error": "Authentication failed: Invalid signature."
}
```

### 404 Not Found
The specified application ID does not exist.

```json
{
  "error": "Application not found."
}
```

## How it Works

When Sockudo receives this request:

1. It authenticates the request.
2. It identifies all active WebSocket connections associated with the given `app_id` and `user_id`. A user is typically associated with a connection if they have successfully authenticated to at least one presence channel with that `user_id`.
3. Sockudo then proceeds to close these WebSocket connections.
4. If you are running multiple Sockudo instances with a shared adapter (like Redis or NATS), the instruction to terminate connections for the user should be propagated across all instances to ensure all their sessions are closed. The exact mechanism for this propagation depends on the adapter's implementation.

## Use Cases

- Forcing a user logout from all active sessions.
- Disconnecting a user after their account has been suspended or deleted.
- Responding to security incidents by terminating potentially compromised user sessions.