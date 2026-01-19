# Using with PusherJS Client

Sockudo is compatible with the official Pusher JavaScript client library, `pusher-js`. This allows you to integrate real-time functionality into any frontend JavaScript application, not just those using Laravel Echo.

This guide provides examples based on the `README.md`.

## Installation

First, you need to include `pusher-js` in your project.

**Using npm or yarn:**
```bash
npm install pusher-js
# or
yarn add pusher-js
```

Then import it into your JavaScript file:
```javascript
import Pusher from 'pusher-js';
```

**Using a CDN:**
```html
<script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
```

If using a CDN, Pusher will be available as a global variable.

## Initialization

To connect to your Sockudo server, instantiate the Pusher client with the appropriate configuration:

```javascript
const APP_KEY = 'your_sockudo_app_key'; // Replace with your Sockudo App Key
const SOCKUDO_HOST = 'localhost';       // Replace with your Sockudo server hostname
const SOCKUDO_PORT = 6001;              // Replace with your Sockudo server port
const SOCKUDO_USE_TLS = false;          // Set to true if Sockudo uses SSL (wss://)

const pusher = new Pusher(APP_KEY, {
  wsHost: SOCKUDO_HOST,
  wsPort: SOCKUDO_PORT,
  wssPort: SOCKUDO_PORT, // Use the same port for WSS if SSL is handled by Sockudo or proxy
  forceTLS: SOCKUDO_USE_TLS,
  disableStats: true, // Recommended for self-hosted solutions
  enabledTransports: ['ws', 'wss'], // Ensure 'ws' and 'wss' are enabled

  // For private or presence channels, configure the authentication endpoint
  authEndpoint: '/your-app-auth-endpoint', // e.g., http://localhost:3000/pusher/auth
  // auth: {
  //   params: { userId: 'user-123' }, // Optional: custom params for your auth endpoint
  //   headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' } // Optional: custom headers
  // }
});
```

### Key Configuration Options:

- **APP_KEY**: Your application key from Sockudo's configuration.
- **wsHost**: The hostname or IP address of your Sockudo server.
- **wsPort**: The port Sockudo is listening on (e.g., 6001).
- **wssPort**: The port for secure connections if forceTLS is true. Often the same as wsPort.
- **forceTLS**: Set to true if your Sockudo server (or a reverse proxy in front of it) is using SSL/TLS, and you want to connect via wss://.
- **disableStats**: It's good practice to disable this, as stats are typically sent to Pusher's commercial service.
- **enabledTransports**: Usually ['ws', 'wss'].
- **authEndpoint**: The URL of an endpoint on your application server that will authorize subscriptions to private and presence channels. This endpoint will be called by pusher-js.
- **auth**: An object to customize the authentication request (e.g., sending additional parameters or headers to your authEndpoint).

## Subscribing to Channels

### Public Channels

Public channels do not require authentication.

```javascript
const publicChannel = pusher.subscribe('public-chat');

publicChannel.bind('new-message', function(data) {
  console.log('Received new message on public-chat:', data);
  // Example: display the message in your UI
  // const messagesDiv = document.getElementById('messages');
  // messagesDiv.innerHTML += `<p><strong>${data.user}:</strong> ${data.text}</p>`;
});

// Check subscription success (optional)
publicChannel.bind('pusher:subscription_succeeded', function() {
  console.log('Successfully subscribed to public-chat!');
});

publicChannel.bind('pusher:subscription_error', function(status) {
  console.error('Failed to subscribe to public-chat, status:', status);
});
```

### Private Channels

Private channels (prefixed with `private-`) require authentication via the authEndpoint you configured.

```javascript
const privateChannel = pusher.subscribe('private-user-notifications-123'); // Example channel name

privateChannel.bind('personal-alert', function(data) {
  console.log('Received personal alert:', data);
  // Update UI with the alert
});

privateChannel.bind('pusher:subscription_succeeded', function() {
  console.log('Successfully subscribed to private-user-notifications-123!');
});

privateChannel.bind('pusher:subscription_error', function(status) {
  // This usually means your authEndpoint denied access or there was an error.
  console.error('Failed to subscribe to private channel, status:', status);
  // status might be 401 or 403 if auth failed.
});
```

### Presence Channels

Presence channels (prefixed with `presence-`) also require authentication and provide information about other subscribed users.

```javascript
const presenceChannel = pusher.subscribe('presence-collaboration-room-abc');

// Called once when subscription succeeds, with the initial list of members
presenceChannel.bind('pusher:subscription_succeeded', function(members) {
  console.log('Successfully subscribed to presence channel!');
  // 'members' is an object with a 'count' and a 'me' property (representing the current user)
  // It also has 'each' method to iterate over other members.
  console.log('Initial member count:', members.count);
  members.each(function(member) {
    console.log('Member present:', member.id, member.info);
    // member.id is the user_id
    // member.info is the user_info object provided during authentication
  });
});

// Called when the current user is successfully authenticated and joins (after subscription_succeeded)
presenceChannel.bind('pusher:member_added', function(member) {
  console.log(member.id, member.info, 'joined the channel.');
  // Add member to your UI list
});

// Called when another member leaves the channel
presenceChannel.bind('pusher:member_removed', function(member) {
  console.log(member.id, 'left the channel.');
  // Remove member from your UI list
});

// Listening to custom events on the presence channel
presenceChannel.bind('document-update', function(data) {
  console.log('Document update received:', data);
});

presenceChannel.bind('pusher:subscription_error', function(status) {
  console.error('Failed to subscribe to presence channel, status:', status);
});
```

## Sending Client Events

If client events are enabled on the server for your app and you are subscribed to a private or presence channel, you can trigger client events.

```javascript
// Ensure you are subscribed to a private or presence channel first
// e.g., privateChannel or presenceChannel from above examples

// Example: Sending a typing indicator on a presence channel
// This event will be received by other clients on 'presence-collaboration-room-abc'
// but NOT by the sender itself, and not by your server backend (unless webhooks are set up for client events).
const success = presenceChannel.trigger('client-typing', { user: 'MyUsername' });
if (success) {
  console.log('Successfully triggered client-typing event.');
} else {
  console.log('Failed to trigger client-typing event (e.g., not subscribed, or over rate limit).');
}
```

Client event names must be prefixed with `client-`.

## Connection States

pusher-js manages connection states. You can bind to these:

```javascript
pusher.connection.bind('connected', () => {
  console.log('PusherJS connected to Sockudo!');
  // You can re-subscribe to channels here if needed, though pusher-js often handles this.
});

pusher.connection.bind('disconnected', () => {
  console.log('PusherJS disconnected from Sockudo.');
});

pusher.connection.bind('connecting', () => {
  console.log('PusherJS is connecting to Sockudo...');
});

pusher.connection.bind('error', (err) => {
  console.error('PusherJS connection error:', err);
  // Example: err.error.data.code, err.error.data.message
  // if (err.error.data.code === 4004) {
  //   console.log('Connection limit reached for app.');
  // }
});
```

## Disconnecting

```javascript
pusher.disconnect();
```

This provides a basic overview of using pusher-js with Sockudo. For more advanced features of pusher-js, refer to the official Pusher documentation.
