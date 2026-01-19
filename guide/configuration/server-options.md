# Server Options Configuration

This section details general server-level configurations for Sockudo, including core server settings like host, port, debug mode, SSL configuration, and instance management.

These settings control fundamental aspects of how Sockudo operates and are typically found at the top level of your `config.json`.

## Core Server Settings

These options are at the top level of your `config.json`.

### `debug`
* **JSON Key**: `debug`
* **Environment Variable**: `DEBUG` (Set to `true` or `1`)
* **Type**: `boolean`
* **Description**: Enables or disables debug mode. When enabled, more verbose logging and potentially other debugging features are active.
* **Default Value**: `false`

### `host`
* **JSON Key**: `host`
* **Environment Variable**: `HOST`
* **Type**: `string`
* **Description**: The IP address the Sockudo server will listen on. Use `0.0.0.0` to listen on all available network interfaces or a specific IP address.
* **Default Value**: `"0.0.0.0"`

### `port`
* **JSON Key**: `port`
* **Environment Variable**: `PORT`
* **Type**: `integer` (u16)
* **Description**: The port number the Sockudo server will listen on for WebSocket and HTTP API connections.
* **Default Value**: `6001`

### `mode`
* **JSON Key**: `mode`
* **Environment Variable**: `APP_MODE`
* **Type**: `string`
* **Description**: Specifies the application mode, e.g., "production", "development". This can be used by Sockudo for mode-specific behavior.
* **Default Value**: `"production"`

### `path_prefix`
* **JSON Key**: `path_prefix`
* **Environment Variable**: `PATH_PREFIX`
* **Type**: `string`
* **Description**: A prefix for all HTTP and WebSocket paths. For example, if set to `/ws`, the WebSocket endpoint would be `/ws/app/{appKey}`.
* **Default Value**: `/`

### `shutdown_grace_period`
* **JSON Key**: `shutdown_grace_period`
* **Environment Variable**: `SHUTDOWN_GRACE_PERIOD`
* **Type**: `integer` (u64, seconds)
* **Description**: The number of seconds Sockudo will wait for existing connections to close gracefully during shutdown before forcing termination.
* **Default Value**: `10`

### `user_authentication_timeout`
* **JSON Key**: `user_authentication_timeout`
* **Environment Variable**: `USER_AUTHENTICATION_TIMEOUT`
* **Type**: `integer` (u64, seconds)
* **Description**: Timeout in seconds for user authentication requests, typically for private/presence channels.
* **Default Value**: `3600` (1 hour)

### `websocket_max_payload_kb`
* **JSON Key**: `websocket_max_payload_kb`
* **Environment Variable**: `WEBSOCKET_MAX_PAYLOAD_KB`
* **Type**: `integer` (u32, kilobytes)
* **Description**: The maximum allowed size for a single WebSocket message payload in kilobytes.
* **Default Value**: `64`

### `activity_timeout`
* **JSON Key**: `activity_timeout`
* **Environment Variable**: `ACTIVITY_TIMEOUT`
* **Type**: `integer` (u64, seconds)
* **Description**: Timeout in seconds for client-server activity synchronization. This controls how long the server waits for activity from a client before considering it inactive.
* **Default Value**: `120` (2 minutes)

**Example (Basic Server Configuration)**:
```json
{
  "debug": false,
  "host": "0.0.0.0",
  "port": 6001,
  "mode": "production",
  "path_prefix": "/",
  "shutdown_grace_period": 10,
  "user_authentication_timeout": 3600,
  "websocket_max_payload_kb": 64,
  "activity_timeout": 120
}
```

**Example (Environment Variables)**:
```bash
export HOST="0.0.0.0"
export PORT=6001
export DEBUG=false
export APP_MODE="production"
export SHUTDOWN_GRACE_PERIOD=30
export USER_AUTHENTICATION_TIMEOUT=7200
export WEBSOCKET_MAX_PAYLOAD_KB=128
export ACTIVITY_TIMEOUT=120
```

## SSL/TLS Configuration (`ssl`)

These options are configured under the `ssl` object in your `config.json`.

* **JSON Key (Parent)**: `ssl`

### `ssl.enabled`
* **JSON Key**: `enabled`
* **Environment Variable**: `SSL_ENABLED` (Set to `true` or `1`)
* **Type**: `boolean`
* **Description**: Enables or disables SSL/TLS for WebSocket (WSS) and HTTP API (HTTPS) connections.
* **Default Value**: `false`

### `ssl.cert_path`
* **JSON Key**: `cert_path`
* **Environment Variable**: `SSL_CERT_PATH`
* **Type**: `string`
* **Description**: Path to your SSL certificate file (e.g., PEM format). Required if `ssl.enabled` is `true`.
* **Default Value**: `"/app/ssl/cert.pem"`

### `ssl.key_path`
* **JSON Key**: `key_path`
* **Environment Variable**: `SSL_KEY_PATH`
* **Type**: `string`
* **Description**: Path to your SSL private key file. Required if `ssl.enabled` is `true`.
* **Default Value**: `"/app/ssl/key.pem"`

### `ssl.passphrase`
* **JSON Key**: `passphrase`
* **Environment Variable**: `SSL_PASSPHRASE`
* **Type**: `string` (optional)
* **Description**: Passphrase for your SSL private key, if it's encrypted.
* **Default Value**: `null` (None)

### `ssl.ca_path`
* **JSON Key**: `ca_path`
* **Environment Variable**: `SSL_CA_PATH`
* **Type**: `string` (optional)
* **Description**: Path to your SSL Certificate Authority (CA) bundle file. Useful for client certificate authentication or custom CAs.
* **Default Value**: `null` (None)

### `ssl.redirect_http`
* **JSON Key**: `redirect_http`
* **Environment Variable**: `SSL_REDIRECT_HTTP` (Set to `true` or `1`)
* **Type**: `boolean`
* **Description**: If `ssl.enabled` is `true`, this option will start an additional HTTP server that automatically redirects all incoming HTTP requests to HTTPS.
* **Default Value**: `false`

### `ssl.http_port`
* **JSON Key**: `http_port`
* **Environment Variable**: `SSL_HTTP_PORT`
* **Type**: `integer` (u16, optional)
* **Description**: The port for the HTTP redirect server if `ssl.redirect_http` is `true`.
* **Default Value**: `80`

**Example (SSL Configuration)**:
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/sockudo.crt",
    "key_path": "/etc/ssl/private/sockudo.key",
    "redirect_http": true,
    "http_port": 80
  }
}
```

**Example (Environment Variables for SSL)**:
```bash
export SSL_ENABLED=true
export SSL_CERT_PATH="/etc/ssl/certs/sockudo.crt"
export SSL_KEY_PATH="/etc/ssl/private/sockudo.key"
export SSL_REDIRECT_HTTP=true
export SSL_HTTP_PORT=80
```

## Instance Configuration (`instance`)

Settings related to the specific instance of the Sockudo server.

* **JSON Key (Parent)**: `instance`

### `instance.process_id`
* **JSON Key**: `process_id`
* **Environment Variable**: `INSTANCE_PROCESS_ID`
* **Type**: `string`
* **Description**: A unique identifier for this Sockudo process. Useful in clustered environments for identifying nodes.
* **Default Value**: A randomly generated UUID v4 string

**Example (Instance Configuration)**:
```json
{
  "instance": {
    "process_id": "sockudo-node-1"
  }
}
```

**Example (Environment Variable)**:
```bash
export INSTANCE_PROCESS_ID="sockudo-prod-01"
```

## CORS Configuration (`cors`)

Controls Cross-Origin Resource Sharing for the HTTP API.

* **JSON Key (Parent)**: `cors`

### `cors.credentials`
* **JSON Key**: `credentials`
* **Environment Variable**: `CORS_CREDENTIALS`
* **Type**: `boolean`
* **Description**: Whether to allow credentials (e.g., cookies, authorization headers) to be included in cross-origin requests.
* **Default Value**: `true`

### `cors.origin`
* **JSON Key**: `origin`
* **Environment Variable**: `CORS_ORIGINS` (comma-separated list)
* **Type**: `array` of `string`
* **Description**: A list of allowed origins. Use `["*"]` to allow all origins (use with caution in production).
* **Default Value**: `["*"]`

### `cors.methods`
* **JSON Key**: `methods`
* **Environment Variable**: `CORS_METHODS` (comma-separated list)
* **Type**: `array` of `string`
* **Description**: A list of allowed HTTP methods for cross-origin requests.
* **Default Value**: `["GET", "POST", "OPTIONS"]`

### `cors.allowed_headers`
* **JSON Key**: `allowed_headers`
* **Environment Variable**: `CORS_HEADERS` (comma-separated list)
* **Type**: `array` of `string`
* **Description**: A list of allowed HTTP headers in cross-origin requests.
* **Default Value**: `["Authorization", "Content-Type", "X-Requested-With", "Accept"]`

**Example (CORS Configuration)**:
```json
{
  "cors": {
    "credentials": true,
    "origin": ["https://app.example.com", "https://admin.example.com"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowed_headers": ["Authorization", "Content-Type", "X-My-Custom-Header"]
  }
}
```

**Example (Environment Variables for CORS)**:
```bash
export CORS_CREDENTIALS=true
export CORS_ORIGINS="https://app.example.com,https://admin.example.com"
export CORS_METHODS="GET,POST,PUT,DELETE,OPTIONS"
export CORS_HEADERS="Authorization,Content-Type,X-Custom-Header"
```

## Complete Server Configuration Example

```json
{
  "debug": false,
  "host": "0.0.0.0",
  "port": 6001,
  "mode": "production",
  "path_prefix": "/",
  "shutdown_grace_period": 30,
  "user_authentication_timeout": 3600,
  "websocket_max_payload_kb": 64,
  
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/sockudo.crt",
    "key_path": "/etc/ssl/private/sockudo.key",
    "redirect_http": true,
    "http_port": 80
  },
  
  "cors": {
    "credentials": true,
    "origin": ["https://myapp.com"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allowed_headers": ["Authorization", "Content-Type", "X-Requested-With", "Accept"]
  },
  
  "instance": {
    "process_id": "sockudo-prod-01"
  }
}
```

## Production vs Development Settings

### Development Configuration
```json
{
  "debug": true,
  "host": "127.0.0.1",
  "port": 6001,
  "mode": "development",
  "ssl": {
    "enabled": false
  },
  "cors": {
    "origin": ["*"]
  }
}
```

### Production Configuration
```json
{
  "debug": false,
  "host": "0.0.0.0",
  "port": 6001,
  "mode": "production",
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/sockudo.crt",
    "key_path": "/etc/ssl/private/sockudo.key"
  },
  "cors": {
    "credentials": true,
    "origin": ["https://yourdomain.com"]
  }
}
```

## Security Considerations

### SSL/TLS Best Practices
1. **Always use SSL in production**
2. **Use strong certificates** from trusted CAs
3. **Keep certificates updated** and automate renewal
4. **Secure private keys** with appropriate file permissions

### CORS Security
1. **Don't use wildcard origins** in production
2. **Specify exact allowed origins**
3. **Be careful with credentials** and wildcard combinations
4. **Regularly review** allowed origins and headers

### Network Security
1. **Bind to specific interfaces** when possible
2. **Use firewalls** to restrict access
3. **Monitor connection patterns** for unusual activity
4. **Implement rate limiting** (covered in separate configuration)

## Performance Tuning

### Connection Handling
- **`websocket_max_payload_kb`**: Increase for applications that need larger messages
- **`user_authentication_timeout`**: Adjust based on your authentication service performance
- **`shutdown_grace_period`**: Balance between graceful shutdown and restart speed

### Debug Mode Impact
- **Development**: Enable debug mode for troubleshooting
- **Production**: Disable debug mode for optimal performance
- **Logging**: Debug mode increases log verbosity significantly

## Troubleshooting

### Common Issues

#### Server Won't Start
1. Check if port is already in use: `netstat -tuln | grep 6001`
2. Verify SSL certificate paths if SSL is enabled
3. Check file permissions for SSL certificates
4. Verify host/port configuration

#### SSL Certificate Issues
1. Verify certificate file paths exist and are readable
2. Check certificate validity: `openssl x509 -in cert.pem -text -noout`
3. Ensure private key matches certificate
4. Check certificate chain completeness

#### CORS Issues
1. Verify origin URLs exactly match client domains
2. Check that required headers are allowed
3. Ensure credentials setting matches client expectations
4. Test CORS with browser developer tools

### Debug Commands

```bash
# Check if Sockudo is listening
netstat -tuln | grep 6001

# Test HTTP endpoint
curl http://localhost:6001/usage

# Test HTTPS endpoint (if SSL enabled)
curl -k https://localhost:6001/usage

# Check SSL certificate
openssl s_client -connect localhost:6001 -servername localhost

# Test CORS
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:6001/apps/demo-app/events
```