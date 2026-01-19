# Other Client & Server Integrations

Sockudo's compatibility with the Pusher protocol means you can use a wide variety of existing Pusher client and server libraries from different programming languages to interact with your Sockudo server.

The key is to configure these libraries to point to your Sockudo instance's host, port, and use your Sockudo application credentials (`app_id`, `key`, `secret`).

## General Configuration Principles

When using any Pusher-compatible library, you'll typically need to configure the following:

* **Host**: The hostname or IP address of your Sockudo server.
* **Port**: The port your Sockudo server is listening on (e.g., `6001`).
* **Scheme**: `http` (for `ws://` connections) or `https` (for `wss://` connections if SSL is enabled).
* **App ID**: Your Sockudo application's ID.
* **App Key**: Your Sockudo application's key.
* **App Secret**: Your Sockudo application's secret (this is **only** for server-side libraries that trigger events or for your auth server; never expose the secret in client-side code).
* **Cluster Name (Often a Placeholder)**: Many Pusher libraries require a `cluster` option. Since Sockudo is self-hosted and doesn't use Pusher's regional clusters, you can usually provide a placeholder value like `mt1` or `ap1`, or whatever your chosen library expects. This value is generally not used by Sockudo itself.
* **Disable Stats/Telemetry**: If the library has options to send anonymous statistics or telemetry to Pusher's commercial service, it's good practice to disable these when self-hosting with Sockudo.

## Server-Side Libraries (for Triggering Events)

These libraries are used in your backend application to send messages to Sockudo, which then broadcasts them to connected clients.

### PHP

The official `pusher-http-php` library can be used.

**Installation (via Composer):**
```bash
composer require pusher/pusher-php-server
```

**Example Usage:**
```php
<?php
require __DIR__ . '/vendor/autoload.php';

$options = [
  'host' => 'localhost',        // Your Sockudo host
  'port' => 6001,               // Your Sockudo port
  'scheme' => 'http',           // 'http' or 'https'
  'encrypted' => false,         // Set to true if scheme is 'https' (deprecated, use 'useTLS')
  'useTLS' => false,            // Set to true if scheme is 'https'
  // 'cluster' => 'mt1'         // Often required, but value is a placeholder for Sockudo
  // 'curl_options' => [],      // Optional cURL options
  // 'timeout' => 30,           // Optional HTTP request timeout
];

// Ensure your App ID, Key, and Secret match Sockudo's configuration
$pusher = new Pusher\Pusher(
  'your_sockudo_app_key',    // APP_KEY
  'your_sockudo_app_secret', // APP_SECRET
  'your_sockudo_app_id',     // APP_ID
  $options
);

$data = ['message' => 'Hello from PHP!'];
$pusher->trigger('my-channel', 'my-event', $data);

echo "Event triggered successfully!\n";
?>
```

### Node.js (Backend)

The official pusher Node.js library can be used on the server-side.

**Installation (via npm):**
```bash
npm install pusher
```

**Example Usage:**
```javascript
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: 'your_sockudo_app_id',
  key: 'your_sockudo_app_key',
  secret: 'your_sockudo_app_secret',
  // cluster: 'mt1', // Placeholder
  host: 'localhost',    // Your Sockudo host
  port: 6001,           // Your Sockudo port
  useTLS: false,        // Set to true if using https/wss
  // encrypted: false   // Deprecated, use useTLS
});

pusher.trigger("my-channel", "my-event", { message: "Hello from Node.js backend!" })
  .then(response => {
    console.log("Event triggered successfully:", response.status);
  })
  .catch(error => {
    console.error("Error triggering event:", error);
  });
```

### Python

Use the pusher Python library.

**Installation (via pip):**
```bash
pip install pusher
```

**Example Usage:**
```python
import pusher

pusher_client = pusher.Pusher(
    app_id='your_sockudo_app_id',
    key='your_sockudo_app_key',
    secret='your_sockudo_app_secret',
    # cluster='mt1', # Placeholder
    host='localhost',
    port=6001,
    ssl=False # Set to True if using https/wss
)

pusher_client.trigger('my-channel', 'my-event', {'message': 'Hello from Python!'})
print("Event triggered!")
```

### Other Server-Side Languages

Pusher provides official or community-supported libraries for many other languages like Ruby, Java, Go, etc. The configuration principles remain the same: point the library to your Sockudo server's address and use your Sockudo app credentials.

## Client-Side Libraries (for Subscribing to Events)

Besides pusher-js (covered in its own section), you can use other Pusher-compatible client libraries for different platforms.

### Android (Java/Kotlin)

Use the pusher-java-client library.

**Configuration Snippet (conceptual):**
```java
// import com.pusher.client.Pusher;
// import com.pusher.client.PusherOptions;
// import com.pusher.client.channel.Channel;
// import com.pusher.client.connection.ConnectionEventListener;

PusherOptions options = new PusherOptions();
options.setHost("your_sockudo_host");
options.setWsPort(6001); // Or your Sockudo port
options.setWssPort(6001); // If using TLS
options.setUseTLS(false); // Set to true for wss://
// options.setCluster("mt1"); // Placeholder

// If private/presence channels are used, set up an authorizer:
// options.setAuthorizer(yourCustomAuthorizer);

Pusher pusher = new Pusher("your_sockudo_app_key", options);
pusher.connect( /* ConnectionEventListener */ );

Channel channel = pusher.subscribe("my-channel");
channel.bind("my-event", (event) -> {
    // Log.i("Pusher", "Received event with data: " + event.getData());
});
```

### iOS (Swift/Objective-C)

Use the pusher-swift library.

**Configuration Snippet (conceptual, Swift):**
```swift
// import PusherSwift

// let options = PusherClientOptions(
//     host: .host("your_sockudo_host"),
//     port: 6001, // Your Sockudo port
//     useTLS: false // Set to true for wss://
//     // authMethod: .endpoint(authEndpoint: "https://your-app.com/pusher/auth") // For private/presence
// )

// let pusher = Pusher(
//   key: "your_sockudo_app_key",
//   options: options
// )

// pusher.connect()

// let channel = pusher.subscribe("my-channel")
// channel.bind(eventName: "my-event") { (event: PusherEvent) in
//     if let data = event.data {
//         // print("Received event: \(data)")
//     }
// }
```

## General Tips for Integration

* **Start Simple**: Begin with public channels to ensure basic connectivity and event flow are working before moving to private/presence channels that require authentication.
* **Check Sockudo Logs**: Sockudo's logs (especially in debug mode) can provide valuable information if connections or event publishing fail.
* **Network Configuration**: Ensure firewalls or network policies allow communication between your application server/clients and the Sockudo server on the configured port.
* **SSL/TLS**: If using https for Sockudo (either directly or via a reverse proxy), ensure your client libraries are configured to use secure WebSocket connections (wss://) and trust the certificate if it's self-signed (though using a valid CA-signed certificate is recommended for production).
