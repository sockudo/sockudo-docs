# Webhooks

Sockudo can send HTTP POST requests (webhooks) to your application server when certain events occur within the WebSocket system. This allows you to react to real-time events, store data, trigger other processes, or audit activity.

## Overview

Webhooks provide a way for Sockudo to notify your application about events that happen on the WebSocket server, such as:
- When channels become occupied or vacated
- When users join or leave presence channels
- When client events are triggered
- Custom application events

This enables you to:
- Update databases when users join/leave
- Send notifications via email or push messages
- Track analytics and usage patterns
- Audit user activity
- Trigger business logic based on real-time events

## Configuration

Webhooks are configured per application within the `app_manager.apps` array in your `config.json` file, and global webhook settings are managed under the `webhooks` object.

### Global Webhook Settings

```json
{
  "webhooks": {
    "batching": {
      "enabled": true,
      "duration": 50
    }
  }
}
```

### Per-Application Webhook Configuration

Each app can have a `webhooks` array, where each object defines a specific webhook endpoint and the events that trigger it:

```json
{
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "my-app",
          "key": "my-key",
          "secret": "my-secret",
          "webhooks": [
            {
              "url": "https://yourapi.com/sockudo/webhooks",
              "event_types": ["channel_occupied", "channel_vacated"]
            },
            {
              "lambda": {
                "function_name": "sockudoPresenceHandler",
                "region": "us-east-1"
              },
              "event_types": ["member_added", "member_removed"],
              "filter": {
                "channel_prefix": "presence-"
              }
            }
          ]
        }
      ]
    }
  }
}
```

## Webhook Types

Sockudo supports multiple types of webhook targets:

### HTTP/HTTPS Webhooks

Standard HTTP POST requests to your application endpoints:

```json
{
  "url": "https://yourapi.com/webhooks/sockudo",
  "event_types": ["channel_occupied", "channel_vacated"],
  "headers": {
    "Authorization": "Bearer your-api-token",
    "X-Source": "sockudo"
  }
}
```

### AWS Lambda Webhooks

Direct invocation of AWS Lambda functions:

```json
{
  "lambda": {
    "function_name": "sockudoEventHandler",
    "region": "us-east-1",
    "invocation_type": "Event",
    "qualifier": "PROD"
  },
  "event_types": ["member_added", "member_removed"]
}
```

## Supported Event Types

Sockudo aims for Pusher compatibility and supports these webhook events:

### Channel Events
- **`channel_occupied`**: Triggered when a channel, previously empty, gets its first subscriber
- **`channel_vacated`**: Triggered when a channel becomes empty (last subscriber leaves)

### Presence Channel Events
- **`member_added`**: Triggered when a user subscribes to a presence channel
- **`member_removed`**: Triggered when a user unsubscribes from a presence channel

### Client Events
- **`client_event`**: Triggered when a client sends a client event (if `enable_client_messages` is true)

### Application Events
- **`connection_established`**: When a new WebSocket connection is established (if configured)
- **`connection_terminated`**: When a WebSocket connection is closed (if configured)

## Webhook Payload Structure

When an event occurs, Sockudo sends a POST request to the configured URL with a `Content-Type: application/json` header.

### Single Event Payload

```json
{
  "time_ms": 1678886400000,
  "events": [
    {
      "name": "member_added",
      "channel": "presence-chat-room",
      "user_id": "user-123",
      "socket_id": "socket-456",
      "data": "{\"user_id\":\"user-123\",\"user_info\":{\"name\":\"Alice\"}}"
    }
  ]
}
```

### Batched Events Payload

When batching is enabled, multiple events are sent together:

```json
{
  "time_ms": 1678886400500,
  "events": [
    {
      "name": "member_added",
      "channel": "presence-chat",
      "user_id": "user1",
      "time_ms": 1678886400100
    },
    {
      "name": "channel_vacated",
      "channel": "private-room-1",
      "time_ms": 1678886400200
    },
    {
      "name": "client_event",
      "channel": "presence-game",
      "event": "client-move",
      "data": "{\"x\":100,\"y\":200}",
      "socket_id": "socket-789",
      "time_ms": 1678886400300
    }
  ]
}
```

### Event-Specific Fields

#### Channel Events
```json
{
  "name": "channel_occupied",
  "channel": "chat-room-1",
  "time_ms": 1678886400000
}
```

#### Presence Events
```json
{
  "name": "member_added",
  "channel": "presence-lobby",
  "user_id": "user-456",
  "socket_id": "socket-123",
  "data": "{\"user_id\":\"user-456\",\"user_info\":{\"name\":\"Bob\",\"avatar\":\"url\"}}",
  "time_ms": 1678886400000
}
```

#### Client Events
```json
{
  "name": "client_event",
  "channel": "private-game-room",
  "event": "client-typing",
  "data": "{\"isTyping\":true}",
  "socket_id": "socket-789",
  "user_id": "user-123",
  "time_ms": 1678886400000
}
```

## Webhook Filtering

You can filter which events trigger webhooks using the `filter` object:

### Channel Type Filtering

```json
{
  "url": "https://yourapi.com/webhooks/presence",
  "event_types": ["member_added", "member_removed"],
  "filter": {
    "channel_type": "presence"
  }
}
```

### Channel Prefix Filtering

```json
{
  "url": "https://yourapi.com/webhooks/chat",
  "event_types": ["channel_occupied", "channel_vacated"],
  "filter": {
    "channel_prefix": "chat-"
  }
}
```

### Combined Filtering

```json
{
  "url": "https://yourapi.com/webhooks/admin",
  "event_types": ["member_added", "member_removed"],
  "filter": {
    "channel_type": "presence",
    "channel_prefix": "admin-"
  }
}
```

## Webhook Batching

Batching allows you to receive multiple events in a single HTTP request, reducing the number of requests to your endpoint:

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

- **`enabled`**: Whether to batch multiple events together
- **`duration`**: Maximum time (in milliseconds) to wait before sending a batch

## Security

### Signature Verification

Sockudo signs webhook requests using HMAC-SHA256, compatible with Pusher's webhook signing:

**Request Headers:**
```
X-Pusher-Key: your-app-key
X-Pusher-Signature: sha256=calculated_signature
Content-Type: application/json
```

**Verification Logic (Node.js example):**
```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

// Usage
const isValid = verifyWebhook(
  request.body,
  request.headers['x-pusher-signature'],
  'your-app-secret'
);
```

**Verification Logic (Python example):**
```python
import hmac
import hashlib

def verify_webhook(body, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    received_signature = signature.replace('sha256=', '')
    
    return hmac.compare_digest(expected_signature, received_signature)

# Usage
is_valid = verify_webhook(
    request.body,
    request.headers.get('X-Pusher-Signature'),
    'your-app-secret'
)
```

### HTTPS Requirements

Always use HTTPS for webhook URLs in production:

```json
{
  "url": "https://yourapi.com/webhooks/sockudo",
  "headers": {
    "Authorization": "Bearer your-secure-token"
  }
}
```

### IP Whitelisting

If your Sockudo servers have static IPs, you can whitelist them on your webhook endpoint server.

## Error Handling and Retries

### Response Requirements

Your webhook endpoint should:
- Respond with a 2xx status code (200, 201, 204) to acknowledge receipt
- Respond quickly (within 10 seconds)
- Handle duplicate events gracefully (webhooks may be sent multiple times)

### Retry Logic

Sockudo implements retry logic with exponential backoff:
- Initial retry after 1 second
- Subsequent retries with exponential backoff (2s, 4s, 8s, etc.)
- Maximum of 5 retry attempts
- Dead letter queue for persistently failed webhooks (when using persistent queue drivers)

### Monitoring Failed Webhooks

```bash
# Check failed webhooks (Redis queue)
redis-cli llen sockudo_queue:failed

# Monitor webhook metrics
curl http://localhost:9601/metrics | grep webhook
```

## Queue Integration

Webhook processing utilizes Sockudo's queue system for reliability and performance:

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

Benefits:
- **Asynchronous processing**: Webhooks don't block main request processing
- **Reliability**: Failed webhooks are retried automatically
- **Scalability**: Multiple workers can process webhooks concurrently
- **Monitoring**: Queue depth and processing metrics available

## Implementation Examples

### Laravel Webhook Handler

```php
<?php
// routes/web.php
Route::post('/webhooks/sockudo', [WebhookController::class, 'handle']);

// app/Http/Controllers/WebhookController.php
class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        // Verify signature
        if (!$this->verifySignature($request)) {
            return response('Unauthorized', 401);
        }
        
        $payload = $request->json()->all();
        
        foreach ($payload['events'] as $event) {
            $this->processEvent($event);
        }
        
        return response('OK', 200);
    }
    
    private function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-Pusher-Signature');
        $body = $request->getContent();
        $secret = config('broadcasting.connections.pusher.secret');
        
        $expectedSignature = hash_hmac('sha256', $body, $secret);
        $receivedSignature = str_replace('sha256=', '', $signature);
        
        return hash_equals($expectedSignature, $receivedSignature);
    }
    
    private function processEvent(array $event): void
    {
        switch ($event['name']) {
            case 'member_added':
                $this->handleMemberAdded($event);
                break;
            case 'member_removed':
                $this->handleMemberRemoved($event);
                break;
            case 'channel_occupied':
                $this->handleChannelOccupied($event);
                break;
            case 'channel_vacated':
                $this->handleChannelVacated($event);
                break;
        }
    }
    
    private function handleMemberAdded(array $event): void
    {
        // Update database, send notifications, etc.
        DB::table('presence_log')->insert([
            'channel' => $event['channel'],
            'user_id' => $event['user_id'],
            'action' => 'joined',
            'created_at' => now()
        ]);
    }
}
```

### Express.js Webhook Handler

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/sockudo', (req, res) => {
  // Verify signature
  const signature = req.headers['x-pusher-signature'];
  const body = req.body;
  const secret = process.env.PUSHER_SECRET;
  
  if (!verifySignature(body, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const payload = JSON.parse(body);
  
  payload.events.forEach(event => {
    processEvent(event);
  });
  
  res.status(200).send('OK');
});

function verifySignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  const receivedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

function processEvent(event) {
  switch (event.name) {
    case 'member_added':
      console.log(`User ${event.user_id} joined ${event.channel}`);
      // Update database, send notifications, etc.
      break;
    case 'member_removed':
      console.log(`User ${event.user_id} left ${event.channel}`);
      break;
    case 'client_event':
      console.log(`Client event ${event.event} on ${event.channel}`);
      break;
  }
}
```

## AWS Lambda Webhook Handler

```python
import json
import hmac
import hashlib
import os

def lambda_handler(event, context):
    # Extract webhook data
    body = event.get('body', '')
    signature = event.get('headers', {}).get('X-Pusher-Signature', '')
    
    # Verify signature
    secret = os.environ['PUSHER_SECRET']
    if not verify_signature(body, signature, secret):
        return {
            'statusCode': 401,
            'body': 'Unauthorized'
        }
    
    # Process events
    payload = json.loads(body)
    for webhook_event in payload['events']:
        process_event(webhook_event)
    
    return {
        'statusCode': 200,
        'body': 'OK'
    }

def verify_signature(body, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    received_signature = signature.replace('sha256=', '')
    
    return hmac.compare_digest(expected_signature, received_signature)

def process_event(event):
    event_name = event['name']
    
    if event_name == 'member_added':
        handle_member_added(event)
    elif event_name == 'member_removed':
        handle_member_removed(event)
    elif event_name == 'channel_occupied':
        handle_channel_occupied(event)
    elif event_name == 'channel_vacated':
        handle_channel_vacated(event)

def handle_member_added(event):
    # Update DynamoDB, send SNS notifications, etc.
    print(f"User {event['user_id']} joined {event['channel']}")

def handle_member_removed(event):
    print(f"User {event['user_id']} left {event['channel']}")

def handle_channel_occupied(event):
    print(f"Channel {event['channel']} became active")

def handle_channel_vacated(event):
    print(f"Channel {event['channel']} became empty")
```

## Testing Webhooks

### Using webhook.site

For quick testing, you can use webhook.site:

```json
{
  "webhooks": [
    {
      "url": "https://webhook.site/your-unique-id",
      "event_types": ["channel_occupied", "channel_vacated"]
    }
  ]
}
```

### Local Testing with ngrok

```bash
# Start your local webhook server
node webhook-server.js  # Running on port 3000

# In another terminal, expose it via ngrok
ngrok http 3000

# Use the ngrok URL in your webhook configuration
```

### Manual Testing

```bash
# Trigger a webhook by creating channel activity
curl -X POST "http://localhost:6001/apps/your-app-id/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-event",
    "channels": ["test-channel"],
    "data": {"message": "test"}
  }'

# Subscribe to a presence channel to trigger member events
wscat -c ws://localhost:6001/app/your-app-key
# Then send: {"event":"pusher:subscribe","data":{"channel":"presence-test","auth":"your-auth","channel_data":"your-data"}}
```

## Best Practices

### Endpoint Design

1. **Idempotency**: Make your webhook handlers idempotent to handle duplicate events
2. **Fast Processing**: Process webhooks quickly, queue heavy work for background processing
3. **Error Handling**: Return appropriate HTTP status codes and handle errors gracefully
4. **Logging**: Log all webhook events for debugging and auditing

### Security

1. **Always verify signatures** in production
2. **Use HTTPS** for all webhook URLs
3. **Implement proper authentication** and authorization
4. **Validate input data** from webhook payloads
5. **Rate limiting** on your webhook endpoints to prevent abuse

### Performance

1. **Enable batching** for high-volume scenarios
2. **Use appropriate queue drivers** (Redis/SQS for production)
3. **Monitor webhook processing** metrics and queue depths
4. **Scale webhook workers** based on load

### Monitoring

```json
// Example webhook metrics to monitor
{
  "webhook_success_rate": "95%",
  "average_processing_time": "150ms",
  "queue_depth": 12,
  "failed_webhooks_last_hour": 3
}
```

### Error Recovery

```bash
#!/bin/bash
# webhook-recovery.sh

# Check for failed webhooks
FAILED_COUNT=$(redis-cli llen sockudo_queue:failed)

if [ "$FAILED_COUNT" -gt 100 ]; then
    echo "High number of failed webhooks: $FAILED_COUNT"
    
    # Inspect failed jobs
    redis-cli lrange sockudo_queue:failed 0 5
    
    # Optionally requeue failed jobs
    # redis-cli rpoplpush sockudo_queue:failed sockudo_queue:default
fi
```

## Webhook Event Reference

### Complete Event Type List

| Event Type | Description | Available Fields |
|------------|-------------|------------------|
| `channel_occupied` | First subscriber joins empty channel | `name`, `channel`, `time_ms` |
| `channel_vacated` | Last subscriber leaves channel | `name`, `channel`, `time_ms` |
| `member_added` | User joins presence channel | `name`, `channel`, `user_id`, `socket_id`, `data`, `time_ms` |
| `member_removed` | User leaves presence channel | `name`, `channel`, `user_id`, `socket_id`, `time_ms` |
| `client_event` | Client triggers custom event | `name`, `channel`, `event`, `data`, `socket_id`, `user_id`, `time_ms` |

### Field Descriptions

- **`name`**: The event type identifier
- **`channel`**: The channel name where the event occurred
- **`user_id`**: The user identifier (presence channels only)
- **`socket_id`**: The WebSocket connection identifier
- **`data`**: Event-specific data (JSON string)
- **`event`**: The original event name (for client events)
- **`time_ms`**: Timestamp in milliseconds since Unix epoch

## Troubleshooting

### Common Issues

#### Webhooks Not Being Sent
1. Check webhook configuration in app settings
2. Verify queue system is running (if using Redis/SQS)
3. Check Sockudo logs for webhook errors
4. Ensure events are actually occurring (test with metrics)

#### Signature Verification Failing
1. Verify app secret matches between client and Sockudo
2. Check webhook endpoint is using raw request body
3. Ensure signature algorithm matches (HMAC-SHA256)
4. Verify header name is exactly `X-Pusher-Signature`

#### High Webhook Failure Rate
1. Check endpoint availability and response times
2. Monitor endpoint logs for error patterns
3. Verify payload format expectations
4. Check for rate limiting on webhook endpoint

#### Queue Backlog Growing
1. Increase webhook worker concurrency
2. Optimize webhook endpoint performance
3. Check for failed webhook patterns
4. Scale queue infrastructure (Redis/SQS)

### Debug Commands

```bash
# Check webhook configuration
curl http://localhost:6001/usage

# Monitor webhook queue
redis-cli monitor | grep webhook

# Check webhook metrics
curl http://localhost:9601/metrics | grep webhook

# Test webhook endpoint manually
curl -X POST https://your-webhook-url.com/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Pusher-Key: your-app-key" \
  -H "X-Pusher-Signature: sha256=test-signature" \
  -d '{"time_ms":1234567890,"events":[{"name":"test","channel":"test"}]}'
```

Webhooks provide a powerful way to integrate Sockudo with your application architecture, enabling real-time responsiveness to WebSocket events while maintaining system reliability and performance.