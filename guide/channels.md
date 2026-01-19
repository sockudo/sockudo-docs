# Channels in Sockudo

Channels are the fundamental way to group and filter messages in Sockudo, following the Pusher protocol. Clients subscribe to channels, and events are published to these channels. Sockudo supports four main types of channels with advanced features for scaling and management.

## Channel Types

### 1. Public Channels

-   **Naming Convention:** Any name that doesn't start with `private-` or `presence-`. For example, `my-channel`, `updates`, `chat-room-123`.
-   **Subscription:** Any client can subscribe to a public channel without any special authorization.
-   **Use Cases:** Broadcasting public information, live scores, general announcements.

**Example (Client-side with `pusher-js`):**
```javascript
// Subscribe to a public channel
const publicChannel = pusher.subscribe('news-updates');

// Bind to an event on this channel
publicChannel.bind('new-article', function(data) {
  console.log('A new article was published:', data);
});
```

### 2. Private Channels

-   **Naming Convention:** Must start with `private-`. For example, `private-user-123`, `private-orders-for-user-abc`.
-   **Subscription:** Clients must be authorized to subscribe to private channels. This involves your application server authenticating the user and signing a subscription request.
-   **Use Cases:** User-specific notifications, private chats between two users, secure data transmission to authenticated users.

#### Authentication Flow for Private Channels

1.  Client attempts to subscribe to a `private-` channel.
2.  The `pusher-js` library makes an HTTP POST request to your authentication endpoint.
3.  Your server receives the request with the `socket_id` and `channel_name`.
4.  Your server verifies if the user is allowed to access this channel.
5.  If authorized, your server generates an authentication signature using your Sockudo app's `secret`:
    ```json
    {
      "auth": "YOUR_APP_KEY:SIGNATURE"
    }
    ```
6.  The client library sends this auth signature to Sockudo.
7.  Sockudo verifies the signature and allows the subscription.

**Example (Client-side):**
```javascript
const pusher = new Pusher('YOUR_APP_KEY', {
  wsHost: 'localhost',
  wsPort: 6001,
  forceTLS: false,
  authEndpoint: '/pusher/auth' // Your application's auth endpoint
});

// Subscribe to a private channel
const privateChannel = pusher.subscribe('private-user-notifications-123');

privateChannel.bind('new_message', function(data) {
  console.log('Received a private message:', data);
});
```

### 3. Private Cache Channels

-   **Naming Convention:** Must start with `private-cache-`. For example, `private-cache-user-profile-123`, `private-cache-settings-abc`.
-   **Subscription:** Similar to regular private channels, clients must be authorized to subscribe.
-   **Features:**
    -   Automatically caches the last published message
    -   New subscribers immediately receive the cached message upon successful subscription
    -   Useful for state synchronization where late-joining clients need the current state
    -   Cache TTL is configurable via server settings
-   **Use Cases:** User settings synchronization, live dashboards with current state, configuration distribution, any scenario where subscribers need the "last known state".
-   **Response Format (v2.7.1+):** When subscribing to a cache channel with existing cached data, the response includes both `channel` and `data` fields for full Pusher compatibility.

**Example (Client-side):**
```javascript
// Subscribe to a private cache channel
const cacheChannel = pusher.subscribe('private-cache-dashboard-state');

// Upon subscription, if there's cached data, you'll immediately receive it
cacheChannel.bind('pusher:subscription_succeeded', function() {
  console.log('Successfully subscribed to cache channel');
  // The cached message (if any) will be delivered automatically
});

// Bind to receive updates
cacheChannel.bind('state-update', function(data) {
  console.log('Dashboard state updated:', data);
  // This could be either the cached message or a new update
});
```

### 4. Presence Channels

-   **Naming Convention:** Must start with `presence-`. For example, `presence-chat-room-xyz`, `presence-collaboration-doc-1`.
-   **Subscription:** Similar to private channels, clients must be authorized. The authentication response includes user information.
-   **Features:**
    -   Tracks which users are subscribed to the channel ("presence").
    -   Notifies other members when users join (`pusher:member_added`) or leave (`pusher:member_removed`).
    -   Allows clients to retrieve the list of current members (`pusher:subscription_succeeded`).
-   **Use Cases:** Chat rooms showing online users, collaborative editing tools displaying active participants, live dashboards of connected users.

#### Authentication Flow for Presence Channels

The flow is similar to private channels, but the JSON response must also include `channel_data`:

```json
{
  "auth": "YOUR_APP_KEY:SIGNATURE",
  "channel_data": "{\"user_id\":\"unique_user_id_123\",\"user_info\":{\"name\":\"Alice\",\"email\":\"alice@example.com\"}}"
}
```

**Example (Client-side):**
```javascript
const presenceChannel = pusher.subscribe('presence-game-lobby');

presenceChannel.bind('pusher:subscription_succeeded', function(members) {
  console.log('Successfully subscribed to presence channel!');
  members.each(function(member) {
    console.log('Member present:', member.id, member.info);
  });
});

presenceChannel.bind('pusher:member_added', function(member) {
  console.log('Member joined:', member.id, member.info);
});

presenceChannel.bind('pusher:member_removed', function(member) {
  console.log('Member left:', member.id, member.info);
});

presenceChannel.bind('new-game-start', function(data) {
  console.log('Game starting:', data);
});
```

## Client Events

If `enable_client_messages` is `true` in the app configuration, clients can trigger events directly on channels they are subscribed to.

-   **Naming Convention:** Must be prefixed with `client-`. For example, `client-typing`, `client-mouse-move`.
-   **Security:** Client events are broadcast to other subscribed clients on that channel (excluding the sender by default). They do not go through your application server for validation.
-   **Rate Limiting:** Controlled by the `max_client_events_per_second` setting in the app configuration.
-   **Channel Restrictions:** Client events can only be sent on private or presence channels by authenticated clients.
-   **Use Cases:** Indicating typing status in a chat, real-time cursor movements, collaborative editing signals.

**Example (Client-side):**
```javascript
// Assuming 'channel' is a subscribed private or presence channel
if (channel.subscribed) {
  channel.trigger('client-user-typing', { 
    userId: 'user123', 
    isTyping: true 
  });
}
```

## Channel Management Features

Sockudo provides advanced channel management capabilities:

### Channel Limits and Configuration

Channels are subject to various configurable limits:

```json
{
  "channel_limits": {
    "max_name_length": 200,
    "cache_ttl": 3600
  },
  "presence": {
    "max_members_per_channel": 100,
    "max_member_size_in_kb": 2
  }
}
```

### Per-App Channel Settings

Individual apps can override global channel settings:

```json
{
  "apps": [
    {
      "id": "my-app",
      "max_presence_members_per_channel": 50,
      "max_presence_member_size_in_kb": 1,
      "max_channel_name_length": 150
    }
  ]
}
```

## HTTP API for Channel Management

Sockudo provides a comprehensive HTTP API for channel management:

### Get Channel Information

```bash
# Get info about a specific channel
GET /apps/{app_id}/channels/{channel_name}

# Get all channels for an app
GET /apps/{app_id}/channels?filter_by_prefix=presence-&info=user_count
```

### Get Users in Presence Channels

```bash
# Get users in a presence channel
GET /apps/{app_id}/channels/{channel_name}/users
```

### Terminate User Connections

```bash
# Disconnect all connections for a user
POST /apps/{app_id}/users/{user_id}/terminate_connections
```

## Channel Events and Webhooks

Sockudo can send webhooks for various channel events:

- **`channel_occupied`**: When a channel gets its first subscriber
- **`channel_vacated`**: When a channel becomes empty
- **`member_added`**: When a user joins a presence channel
- **`member_removed`**: When a user leaves a presence channel
- **`client_event`**: When a client sends a client event

Example webhook configuration:

```json
{
  "webhooks": [
    {
      "url": "https://your-app.com/webhooks/sockudo",
      "event_types": ["channel_occupied", "channel_vacated"],
      "filter": {
        "channel_prefix": "presence-"
      }
    }
  ]
}
```

## Scaling Considerations

### Horizontal Scaling

When running multiple Sockudo instances, channels work seamlessly across instances:

- **Redis Adapter**: Channels are synchronized across instances via Redis pub/sub
- **NATS Adapter**: Uses NATS subjects for channel message distribution
- **Redis Cluster**: Scales Redis for high-availability channel management

### Channel Caching

Sockudo caches channel information to improve performance:

```json
{
  "cache": {
    "driver": "redis",
    "redis": {
      "prefix": "sockudo_cache:"
    }
  }
}
```

### Watchlist Events

Advanced channel monitoring with watchlist events:

```json
{
  "apps": [
    {
      "id": "my-app",
      "enable_watchlist_events": true
    }
  ]
}
```

## Best Practices

### Channel Naming

1. **Use descriptive names**: `user-notifications-123` rather than `un123`
2. **Include context**: `chat-room-lobby` vs just `lobby`
3. **Consider prefixes**: Group related channels with prefixes like `game-`, `chat-`, etc.

### Security

1. **Always use private/presence channels** for sensitive data
2. **Implement proper authentication** in your auth endpoint
3. **Validate user permissions** before returning auth signatures
4. **Use HTTPS** for all authentication endpoints

### Performance

1. **Monitor channel counts** and member counts in presence channels
2. **Use appropriate cache TTL** settings for your use case
3. **Consider batching** for high-frequency events
4. **Implement proper error handling** in client applications

### Client Events

1. **Rate limit carefully**: Balance responsiveness with server load
2. **Keep payloads small**: Client events should contain minimal data
3. **Use for ephemeral data**: Don't rely on client events for critical data
4. **Handle failures gracefully**: Client events may not be delivered

Understanding these channel types and features is key to designing effective real-time communication in your application using Sockudo.