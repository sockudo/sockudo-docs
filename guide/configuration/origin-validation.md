# Origin Validation Configuration

Origin validation provides an additional security layer for WebSocket connections by allowing per-app configuration of allowed origins. This feature works alongside CORS to restrict which domains can establish WebSocket connections to specific Sockudo applications.

## Overview

When configured, Sockudo validates the `Origin` header of incoming WebSocket connections against a list of allowed patterns before fully establishing the connection. This provides app-specific origin restrictions that complement global CORS settings.

**Key Features:**
- Per-app origin validation configuration
- CORS-like pattern matching with protocol-agnostic and wildcard support
- Backward compatible (no configuration means all origins allowed)
- Clear error messages for rejected connections

## Configuration Methods

The `allowed_origins` field can be configured through multiple methods depending on your app management driver.

### 1. Memory/Array Configuration (JSON)

Add the `allowed_origins` field to your app configuration in `config.json`:

```json
{
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "my-app",
          "key": "my-app-key",
          "secret": "my-app-secret",
          "allowed_origins": [
            "https://app.example.com",
            "https://*.staging.example.com",
            "http://localhost:3000"
          ]
        }
      ]
    }
  }
}
```

### 2. Environment Variables (Default App)

For the default app, configure allowed origins via environment variable:

```bash
SOCKUDO_DEFAULT_APP_ALLOWED_ORIGINS=https://app.example.com,*.staging.example.com,http://localhost:3000
```

### 3. MySQL Database Configuration

Store apps in MySQL with the `allowed_origins` JSON column:

```sql
-- Create/update an app with allowed origins
INSERT INTO applications (
  id, `key`, secret, max_connections, 
  enable_client_messages, enabled, 
  max_client_events_per_second, allowed_origins
) VALUES (
  'my-app', 'my-app-key', 'my-app-secret', 1000,
  true, true, 100,
  JSON_ARRAY('https://app.example.com', '*.staging.example.com', 'http://localhost:3000')
) ON DUPLICATE KEY UPDATE allowed_origins = VALUES(allowed_origins);
```

Run the migration to add the column to existing tables:
```bash
mysql -u username -p database_name < migrations/mysql/001_add_allowed_origins.sql
```

### 4. PostgreSQL Database Configuration

Store apps in PostgreSQL with the `allowed_origins` JSONB column:

```sql
-- Create/update an app with allowed origins
INSERT INTO applications (
  id, key, secret, max_connections, 
  enable_client_messages, enabled, 
  max_client_events_per_second, allowed_origins
) VALUES (
  'my-app', 'my-app-key', 'my-app-secret', 1000,
  true, true, 100,
  '["https://app.example.com", "*.staging.example.com", "http://localhost:3000"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET allowed_origins = EXCLUDED.allowed_origins;
```

Run the migration to add the column to existing tables:
```bash
psql -U username -d database_name -f migrations/postgresql/001_add_allowed_origins.sql
```

### 5. DynamoDB Configuration

Store the allowed origins as a List attribute in DynamoDB:

```json
{
  "id": { "S": "my-app" },
  "key": { "S": "my-app-key" },
  "secret": { "S": "my-app-secret" },
  "allowed_origins": {
    "L": [
      { "S": "https://app.example.com" },
      { "S": "*.staging.example.com" },
      { "S": "http://localhost:3000" }
    ]
  }
}
```

Using AWS CLI:
```bash
aws dynamodb put-item \
    --table-name sockudo-applications \
    --item '{
        "id": {"S": "my-app"},
        "key": {"S": "my-app-key"},
        "secret": {"S": "my-app-secret"},
        "allowed_origins": {
            "L": [
                {"S": "https://app.example.com"},
                {"S": "*.staging.example.com"},
                {"S": "http://localhost:3000"}
            ]
        }
    }'
```

## Pattern Matching (CORS-like Behavior)

The origin validation works exactly like CORS, supporting both protocol-specific and protocol-agnostic patterns:

### 1. Protocol-Agnostic Patterns (Recommended)
```json
"allowed_origins": [
  "example.com",                // Matches both http:// and https://
  "api.example.com",            // Matches both protocols for subdomain
  "localhost:3000",             // Matches both http:// and https:// on port 3000
  "node1.example.com"      // Custom domain with port - matches both protocols
]
```

### 2. Protocol-Specific Patterns
```json
"allowed_origins": [
  "https://secure.example.com", // Only matches HTTPS
  "http://insecure.example.com" // Only matches HTTP
]
```

### 3. Wildcard Patterns
```json
"allowed_origins": [
  "*",                          // Matches any origin
  "*.example.com",              // Matches any subdomain (any protocol)
  "https://*.secure.com"        // Matches HTTPS subdomains only
]
```

## Validation Rules

1. **Empty or Missing Configuration**: If `allowed_origins` is not configured or is empty, all origins are allowed (backward compatible).

2. **CORS-like Matching**: 
   - **Protocol-agnostic**: `example.com` matches both `http://example.com` and `https://example.com`
   - **Protocol-specific**: `https://example.com` only matches `https://example.com`
   - **Exact port matching**: `localhost:3000` matches both protocols but requires exact port

3. **Wildcard Matching**: 
   - `*.domain.com` matches any subdomain including nested subdomains
   - Wildcards without protocol match any protocol
   - Wildcards with protocol only match that specific protocol

4. **Missing Origin Header**: If the Origin header is missing, the connection is rejected when origin validation is configured.

## Error Response

When a connection is rejected due to origin validation, the client receives a Pusher protocol error before the connection is closed:

```json
{
  "event": "pusher:error",
  "data": {
    "code": 4009,
    "message": "Origin not allowed"
  }
}
```

Error code 4009 indicates an unauthorized connection, following the Pusher protocol specification.

### Implementation Details

- **Validation Timing**: Origin validation occurs after the WebSocket upgrade completes but before the connection is fully established. This ensures clients receive the error message through the WebSocket connection.
- **Single Error Message**: The error is sent exactly once to avoid duplicate messages.
- **Metrics**: Connection errors due to origin validation are tracked as `origin_not_allowed` in metrics without duplication.

## Security Considerations

1. **Browser-Only Protection**: Origin headers can only be trusted from browser clients. Non-browser clients can spoof the Origin header.

2. **Defense in Depth**: This feature provides an additional security layer but should not be the only security measure.

3. **Works with CORS**: This feature complements CORS configuration and provides app-specific origin restrictions.

## Configuration Examples

### Example 1: Mixed Protocol Environment (Recommended)
```json
{
  "id": "production-app",
  "allowed_origins": [
    "www.myapp.com",              // Matches both HTTP and HTTPS
    "app.myapp.com",              // Matches both HTTP and HTTPS
    "https://secure.myapp.com"    // HTTPS only for sensitive areas
  ]
}
```

### Example 2: Development Environment
```json
{
  "id": "dev-app", 
  "allowed_origins": [
    "localhost:3000",             // Matches both protocols
    "localhost:3001",             // Matches both protocols
    "127.0.0.1:8080"              // Matches both protocols
  ]
}
```

### Example 3: Multi-node Environment  
```json
{
  "id": "multinode-app",
  "allowed_origins": [
    "node1.example.com",     // Matches both HTTP and HTTPS
    "node2.example.com",     // Matches both HTTP and HTTPS  
    "*.example.com"              // Wildcard for all subdomains
  ]
}
```

### Example 4: Security-Conscious Setup
```json
{
  "id": "secure-app",
  "allowed_origins": [
    "https://app.example.com",    // HTTPS only for production
    "https://admin.example.com",  // HTTPS only for admin
    "localhost:3000"              // Any protocol for local dev
  ]
}
```

## Testing and Troubleshooting

### Testing Origin Validation

You can test origin validation by attempting WebSocket connections from different origins:

```javascript
// This will be allowed if "example.com" is in allowed_origins
const socket = new WebSocket('wss://your-sockudo-server.com/app/your-app-key');

// Monitor for pusher:error events
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.event === 'pusher:error' && data.data.code === 4009) {
    console.log('Origin not allowed:', data.data.message);
  }
};
```

### Common Issues

1. **Connection Rejected**: Verify that your domain is included in the `allowed_origins` array
2. **Protocol Mismatch**: Check if you're using protocol-specific patterns (`https://` vs `http://`)
3. **Port Requirements**: Ensure ports match exactly when specified in the origin pattern
4. **Wildcard Patterns**: Remember that `*.example.com` doesn't match the root domain `example.com`

### Backward Compatibility

- Apps without `allowed_origins` configured continue to work as before
- No changes required for existing deployments
- Origin validation is opt-in per app

## Environment Variable Reference

For default app configuration:

```bash
# Comma-separated list of allowed origins for the default app
SOCKUDO_DEFAULT_APP_ALLOWED_ORIGINS=https://app.example.com,*.staging.example.com,localhost:3000
```

This environment variable is particularly useful for simple deployments or when using the default app configuration.