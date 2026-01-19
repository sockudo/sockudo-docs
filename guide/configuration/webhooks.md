# Webhooks Configuration

Sockudo can send webhooks to your application to notify it of various events occurring on the WebSocket server, such as when channels become occupied or vacated, or when members join or leave presence channels.

Global webhook settings, particularly for batching, are configured under the `webhooks` object in your `config.json`. Specific webhook endpoints and event types are typically defined per application within the App Manager configuration.

## Global Webhook Settings (`webhooks`)

These settings apply to the overall webhook sending mechanism.

**JSON Key (Parent):** `webhooks`

### Batching Configuration (`webhooks.batching`)

Sockudo can batch multiple webhook events together before sending them to your application. This can reduce the number of HTTP requests to your webhook endpoint.

**JSON Key (Parent Object):** `webhooks.batching`

#### `webhooks.batching.enabled`

- **JSON Key:** `enabled`
- **Type:** boolean
- **Description:** Enables or disables webhook batching.
- **Default Value:** `true`

#### `webhooks.batching.duration`

- **JSON Key:** `duration`
- **Type:** integer (u64, milliseconds)
- **Description:** The maximum duration (in milliseconds) to buffer webhook events before sending a batch, if batching is enabled. Even if the batch isn't full, it will be sent after this duration.
- **Default Value:** `50` (milliseconds)

### Example Global Webhook Configuration

```json
{
  "webhooks": {
    "batching": {
      "enabled": true,
      "duration": 100
    }
  }
}
```

## Per-Application Webhook Configuration

Individual webhook endpoints, the events they subscribe to, and other details are configured within each application's definition. This is typically done in the `apps` array under `app_manager.array` if using the memory app manager, or in the corresponding database record if using a database-backed app manager.

### Webhook Object Structure

Each webhook configuration within an app's `webhooks` array supports the following properties:

#### HTTP Webhooks

- **`url`** (string, optional): The HTTP(S) URL of your application's endpoint that will receive the webhook POST requests.

- **`headers`** (object, map of string to string, optional): Custom HTTP headers to include in the webhook request sent to the `url`.

#### AWS Lambda Webhooks

- **`lambda_function`** (string, optional): The name of an AWS Lambda function to invoke for the webhook.

- **`lambda`** (object, optional): Detailed Lambda configuration with the following fields:
  - **`function_name`** (string): Name of the Lambda function.
  - **`invocation_type`** (string, optional): Lambda invocation type (e.g., "RequestResponse", "Event"). Default: "Event".
  - **`qualifier`** (string, optional): Lambda function version or alias.
  - **`region`** (string, optional): AWS region for the Lambda function. If not set, uses default from SDK.
  - **`endpoint_url`** (string, optional): Custom AWS Lambda endpoint URL (for testing with LocalStack, etc.).

#### Event Configuration

- **`event_types`** (array of strings, required): A list of event types that should trigger this webhook. Common Pusher event types include:
  - `channel_occupied`: Sent when a channel first becomes active (first subscriber).
  - `channel_vacated`: Sent when a channel becomes empty (last subscriber leaves).
  - `member_added`: Sent when a user joins a presence channel.
  - `member_removed`: Sent when a user leaves a presence channel.
  - `client_event`: Sent when a client sends an event on a channel (if enabled and configured).

#### Filtering

- **`filter`** (object, optional): Defines filters for when to send webhooks:
  - **`channel_type`** (string, optional): Filter by channel type (e.g., "public", "private", "presence").
  - **`channel_prefix`** (string, optional): Filter by channel name prefix (e.g., "private-").

## Example Webhook Configurations

### HTTP Webhook Example

```json
{
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "my-app-with-webhooks",
          "key": "app-key-wh",
          "secret": "app-secret-wh",
          "max_connections": "1000",
          "enable_client_messages": true,
          "enabled": true,
          "max_client_events_per_second": "20",
          "webhooks": [
            {
              "url": "https://api.example.com/sockudo/events",
              "event_types": ["channel_occupied", "channel_vacated"],
              "headers": {
                "X-Custom-Auth": "mysecrettoken",
                "User-Agent": "Sockudo-Webhook/1.0"
              }
            }
          ]
        }
      ]
    }
  },
  "webhooks": {
    "batching": {
      "enabled": true,
      "duration": 75
    }
  }
}
```

### AWS Lambda Webhook Example

```json
{
  "webhooks": [
    {
      "lambda": {
        "function_name": "sockudoPresenceHandler",
        "region": "us-east-1",
        "invocation_type": "Event"
      },
      "event_types": ["member_added", "member_removed"],
      "filter": {
        "channel_prefix": "presence-"
      }
    }
  ]
}
```

### Mixed Webhook Configuration

```json
{
  "webhooks": [
    {
      "url": "https://api.example.com/webhooks/general",
      "event_types": ["channel_occupied", "channel_vacated"],
      "headers": {
        "Authorization": "Bearer your-api-token"
      }
    },
    {
      "lambda_function": "handleClientEvents",
      "event_types": ["client_event"],
      "filter": {
        "channel_type": "presence"
      }
    },
    {
      "url": "https://analytics.example.com/events",
      "event_types": ["member_added", "member_removed"],
      "headers": {
        "X-Source": "sockudo"
      },
      "filter": {
        "channel_prefix": "presence-chat"
      }
    }
  ]
}
```

## Webhook Payload Structure

The payload sent to your webhook endpoint will be a JSON object (or an array of objects if batched) containing information about the event(s). The structure is compatible with Pusher webhook payloads.

### Single Event Payload

```json
{
  "name": "member_added",
  "channel": "presence-globalchat",
  "event": "pusher_internal:member_added",
  "data": "{\"user_id\":\"user-123\",\"user_info\":{\"name\":\"Alice\"}}",
  "socket_id": "some-socket-id",
  "user_id": "user-123",
  "time_ms": 1678886400000
}
```

### Batched Payload

If batching is enabled, your endpoint might receive an array:

```json
{
  "time_ms": 1678886400500,
  "events": [
    {
      "name": "member_added",
      "channel": "presence-chat",
      "user_id": "u1",
      "time_ms": 1678886400100
    },
    {
      "name": "channel_vacated",
      "channel": "private-room-1",
      "time_ms": 1678886400200
    }
  ]
}
```

## Security Considerations

### HTTPS
Always use `https://` URLs for your webhook endpoints in production.

### Signature Verification
Sockudo includes webhook signature verification compatible with Pusher. The request includes:
- `X-Pusher-Key` header: Your app key
- `X-Pusher-Signature` header: HMAC SHA256 signature

**Verification Process:**
```python
import hmac
import hashlib

def verify_webhook(request_body, signature, app_secret):
    expected_signature = hmac.new(
        app_secret.encode('utf-8'),
        request_body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)
```

### IP Whitelisting
If your Sockudo server has static IPs, you can whitelist them on your application server's firewall.

## Queue Integration

Webhook processing utilizes the Queue System for reliability and performance. If a queue driver (like Redis or SQS) is configured, webhook events are pushed onto the queue and processed by background workers.

### Queue Configuration for Webhooks

```json
{
  "queue": {
    "driver": "redis",
    "redis": {
      "concurrency": 5,
      "prefix": "sockudo_queue:"
    }
  }
}
```

## Error Handling and Retries

### Response Requirements
Your webhook endpoint should:
- Respond with a 2xx status code to acknowledge receipt
- Respond quickly (within a few seconds)
- Handle retries gracefully (webhooks may be sent multiple times)

### Timeout and Retry Logic
- **Timeouts**: Sockudo has configurable timeouts for webhook requests
- **Retries**: Failed webhooks are retried with exponential backoff when using persistent queue drivers
- **Dead Letter Queue**: Persistently failed webhooks can be moved to a dead letter queue for manual inspection

## Best Practices

1. **Endpoint Design**:
  - Make your webhook endpoints idempotent
  - Include proper error handling and logging
  - Validate incoming signatures
  - Process webhooks asynchronously when possible

2. **Testing**:
  - Use tools like ngrok for local development
  - Test with webhook.site for quick verification
  - Implement proper monitoring and alerting

3. **Performance**:
  - Enable batching for high-volume scenarios
  - Use appropriate queue drivers for your scale
  - Monitor webhook processing metrics

4. **Security**:
  - Always verify webhook signatures
  - Use HTTPS in production
  - Implement proper authentication and authorization
  - Consider IP whitelisting for additional security

For more information about webhook payloads and event types, see the [Webhooks Guide](./webhooks.md).