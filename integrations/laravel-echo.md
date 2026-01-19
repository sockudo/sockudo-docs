# Integrating with Laravel Echo

Sockudo is fully compatible with Laravel Echo when using the Pusher driver. This makes it an excellent choice for Laravel applications requiring a high-performance, self-hosted WebSocket server.

This guide will show you how to configure Laravel Echo to connect to your Sockudo server. The instructions are based on the example provided in Sockudo's `README.md`.

## Prerequisites

* A running Sockudo server instance.
* Your Sockudo application `key` (e.g., `demo-key`).
* A Laravel application set up with broadcasting capabilities.

## Client-Side Configuration (JavaScript)

You'll need to update your Laravel Echo configuration, typically found in `resources/js/bootstrap.js` or a similar JavaScript entry file.

```javascript
// resources/js/bootstrap.js
import Echo from 'laravel-echo';

// Import Pusher JS client
// window.Pusher = require('pusher-js'); // For older setups
import Pusher from 'pusher-js'; // Modern ESM import
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY, // Your Sockudo App Key

    // Sockudo Server Configuration
    wsHost: import.meta.env.VITE_PUSHER_HOST ?? window.location.hostname, // Hostname of your Sockudo server
    wsPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,                   // Port your Sockudo server is listening on
    wssPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,                  // Use the same port for WSS if SSL is handled by Sockudo or proxy

    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'http') === 'https', // Set to true if Sockudo uses SSL (wss://)

    disableStats: true, // Recommended for self-hosted solutions like Sockudo
    enabledTransports: ['ws', 'wss'], // Ensure 'ws' and 'wss' are enabled

    // The 'cluster' option for Pusher SaaS is not directly applicable to Sockudo.
    // However, some Echo configurations might require it.
    // You can often set it to a placeholder or remove it if not needed.
    // cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1', // Placeholder

    // For private/presence channels, specify your app's auth endpoint
    authEndpoint: '/broadcasting/auth', // Default Laravel auth endpoint
    // auth: {
    //     headers: {
    //         Authorization: `Bearer ${yourAuthToken}` // If your auth endpoint requires a token
    //     }
    // }
});
```

## Key Configuration Options for Sockudo:

- **broadcaster**: Must be 'pusher'.
- **key**: Your Sockudo application key.
- **wsHost**: The hostname or IP address where your Sockudo server is accessible.
- **wsPort**: The port Sockudo is listening on (default 6001).
- **wssPort**: If using SSL, this should also be the port Sockudo is listening on for secure connections. Often the same as wsPort.
- **forceTLS**: Set to true if you are connecting to Sockudo via wss:// (i.e., SSL is enabled on Sockudo or your reverse proxy).
- **disableStats**: PusherJS sends stats to Pusher's servers by default. It's good practice to disable this when using a self-hosted solution like Sockudo.
- **enabledTransports**: Ensure ws (for http) and wss (for https) are included.
- **authEndpoint**: Crucial for private and presence channels. This is the endpoint in your Laravel application that will authorize channel subscriptions.

## Server-Side Configuration (Laravel .env)

Update your Laravel application's `.env` file to match your Sockudo server details and application credentials.

```
# .env

BROADCAST_DRIVER=pusher

# Sockudo Application Credentials & Connection Details
# These VITE_ variables are used by your frontend JavaScript (Echo config)
VITE_PUSHER_APP_ID="your_sockudo_app_id"      # Your Sockudo App ID (e.g., "demo-app")
VITE_PUSHER_APP_KEY="your_sockudo_app_key"    # Your Sockudo App Key (e.g., "demo-key")
VITE_PUSHER_APP_SECRET="your_sockudo_app_secret" # Your Sockudo App Secret (e.g., "demo-secret")
VITE_PUSHER_HOST="localhost"                  # Hostname of your Sockudo server (e.g., sockudo.example.com)
VITE_PUSHER_PORT=6001                         # Port your Sockudo server is listening on
VITE_PUSHER_SCHEME="http"                     # Use "http" for ws:// or "https" for wss://
VITE_PUSHER_APP_CLUSTER="mt1"                 # Placeholder, not strictly used by Sockudo but often expected by Echo/PusherJS setup

# These PUSHER_ variables are used by Laravel's backend broadcasting system
# (e.g., when you call `broadcast(new MyEvent($data))->toOthers();`)
PUSHER_APP_ID="${VITE_PUSHER_APP_ID}"
PUSHER_APP_KEY="${VITE_PUSHER_APP_KEY}"
PUSHER_APP_SECRET="${VITE_PUSHER_APP_SECRET}"
PUSHER_HOST="${VITE_PUSHER_HOST}"
PUSHER_PORT="${VITE_PUSHER_PORT}"
PUSHER_SCHEME="${VITE_PUSHER_SCHEME}"
# If your Laravel version uses PUSHER_APP_CLUSTER on the backend, set it:
# PUSHER_APP_CLUSTER="${VITE_PUSHER_APP_CLUSTER}"
```

### Ensure consistency:

- The `VITE_PUSHER_APP_KEY` on the client-side must match `PUSHER_APP_KEY` (and the key configured in Sockudo).
- The `VITE_PUSHER_HOST`, `VITE_PUSHER_PORT`, and `VITE_PUSHER_SCHEME` on the client-side must correctly point to your Sockudo server.
- The `PUSHER_HOST`, `PUSHER_PORT`, and `PUSHER_SCHEME` on the server-side (for Laravel's backend broadcasting) must also correctly point to your Sockudo server so that Laravel can send events to it via the HTTP API.

## Broadcasting Events from Laravel

Once configured, you can broadcast events from your Laravel application as you normally would:

```php
// app/Events/OrderStatusUpdated.php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function broadcastOn()
    {
        // Example: broadcasting on a private channel
        return new PrivateChannel('orders.' . $this->order->id);
        // Or a public channel:
        // return new Channel('public-orders');
    }

    public function broadcastAs()
    {
        // Optional: customize the event name client-side
        return 'order.status.updated';
    }

    public function broadcastWith()
    {
        // Data to broadcast
        return ['order_id' => $this->order->id, 'status' => $this->order->status];
    }
}

// Triggering the event in your controller or service:
// use App\Events\OrderStatusUpdated;
// OrderStatusUpdated::dispatch($order);
// Or: broadcast(new OrderStatusUpdated($order));
```

## Listening for Events with Echo

In your JavaScript:

```javascript
// Assuming Echo is initialized as shown above

// Listening to a public channel
window.Echo.channel('public-orders')
    .listen('.order.status.updated', (e) => { // Note the '.' prefix if using broadcastAs
        console.log('Public event received:', e);
    });

// Listening to a private channel
window.Echo.private(`orders.${orderId}`) // Replace orderId with the actual ID
    .listen('.order.status.updated', (e) => {
        console.log('Private event received for order:', e);
    });

// Listening to a presence channel
window.Echo.join(`chat.${roomId}`) // Replace roomId
    .here((users) => {
        console.log('Users currently in chat:', users);
    })
    .joining((user) => {
        console.log(user.name, 'joined the chat.');
    })
    .leaving((user) => {
        console.log(user.name, 'left the chat.');
    })
    .listen('NewChatMessage', (e) => { // Example custom event
        console.log('New chat message:', e);
    })
    .error((error) => {
        console.error('Presence channel error:', error);
    });
```

## Troubleshooting

### Connection Issues:
- Double-check `wsHost`, `wsPort`, and `forceTLS` settings.
- Ensure Sockudo is running and accessible.
- Check firewalls.

### Authentication Failures (for private/presence channels):
- Verify your `authEndpoint` in Echo config is correct and your Laravel `/broadcasting/auth` route is working.
- Ensure `VITE_PUSHER_APP_KEY` and `VITE_PUSHER_APP_SECRET` match what Sockudo expects.
- Check Sockudo logs and your Laravel application logs for errors during authentication.

### Events Not Received:
- Ensure `BROADCAST_DRIVER=pusher` is set in Laravel's `.env`.
- Verify `PUSHER_HOST`, `PUSHER_PORT`, etc., in `.env` correctly point to Sockudo for backend event publishing.
- Make sure your Laravel event's `broadcastOn()` method returns the correct channel names.
- Check for typos in event names (client-side listening vs. `broadcastAs` or class name).
