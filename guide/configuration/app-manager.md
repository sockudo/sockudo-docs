# App Manager Configuration

The App Manager is responsible for managing application credentials (like app ID, key, and secret) and their settings (e.g., max connections, enabled features, webhook configurations). Sockudo allows you to store and retrieve this application data from various backends.

Configuration for the App Manager is managed under the `app_manager` object in your `config.json`.

## Main App Manager Settings

* **JSON Key (Parent)**: `app_manager`

### `app_manager.driver`
* **JSON Key**: `driver`
* **Environment Variable**: `APP_MANAGER_DRIVER`
* **Type**: `enum` (string)
* **Description**: Specifies the backend driver for storing and managing application configurations.
* **Default Value**: `"memory"`
* **Possible Values**:
  * `"memory"`: Stores app configurations in memory. Suitable for single-instance deployments or when apps are defined directly in the config file. Data is lost when Sockudo restarts unless apps are defined in `app_manager.array.apps`.
  * `"mysql"`: Uses a MySQL database to store app configurations. Requires `database.mysql` to be configured.
  * `"postgres"`: Uses a PostgreSQL database to store app configurations. Requires `database.postgres` to be configured.
  * `"dynamodb"`: Uses AWS DynamoDB to store app configurations. Requires `database.dynamodb` to be configured.

### `app_manager.cache`
This sub-object configures caching for the App Manager itself, helping to reduce lookups to the backend datastore.

* **JSON Key (Parent Object)**: `app_manager.cache`

#### `app_manager.cache.enabled`
* **JSON Key**: `enabled`
* **Type**: `boolean`
* **Description**: Enables or disables caching for app configurations retrieved by the App Manager.
* **Default Value**: `true`

#### `app_manager.cache.ttl`
* **JSON Key**: `ttl`
* **Type**: `integer` (u64, seconds)
* **Description**: Time-to-live in seconds for cached app configurations.
* **Default Value**: `300` (5 minutes)

## Array App Manager (`app_manager.array`)

These settings are primarily used when `app_manager.driver` is set to `"memory"` and you want to define applications directly within the configuration file.

* **JSON Key (Parent Object)**: `app_manager.array`

### `app_manager.array.apps`
* **JSON Key**: `apps`
* **Type**: `array` of `App` objects
* **Description**: A list of application configurations.
* **Default Value**: `[]` (empty array)

### App Object Structure

Each object in the array represents an application and has the following fields:

#### Required Fields

* **`id`** (string, required): A unique identifier for the app (e.g., "my-app-123").
* **`key`** (string, required): The application key, used by clients to connect.
* **`secret`** (string, required): The application secret, used for signing API requests and private channel authentication.

#### Connection and Basic Settings

* **`max_connections`** (integer/string, required): Maximum number of concurrent connections allowed for this app. Can be specified as a number or string. Set to `0` for unlimited (limited by system resources).
* **`enable_client_messages`** (boolean): Whether clients can publish messages directly to channels (client events). Default: `false`.
* **`enabled`** (boolean): Whether the app is currently active. Default: `true`.

#### Rate Limiting

* **`max_backend_events_per_second`** (integer, optional): Maximum number of events per second that can be triggered via the HTTP API for this app. Default: `null` (no limit).
* **`max_client_events_per_second`** (integer/string, required): Maximum number of client events a single connection can send per second for this app. Can be specified as a number or string.
* **`max_read_requests_per_second`** (integer, optional): Maximum number of read requests (like channel info, user lists) per second for this app. Default: `null` (no limit).

#### Presence Channel Settings

* **`max_presence_members_per_channel`** (integer, optional): Maximum number of members allowed in a single presence channel for this app. Overrides global setting if set. Default: `null` (use global).
* **`max_presence_member_size_in_kb`** (integer, optional): Maximum size in kilobytes for the `user_info` data associated with a presence channel member for this app. Overrides global setting if set. Default: `null` (use global).

#### Channel and Event Limits

* **`max_channel_name_length`** (integer, optional): Maximum length for channel names for this app. Overrides global setting if set. Default: `null` (use global).
* **`max_event_channels_at_once`** (integer, optional): Maximum number of channels an event can be published to at once for this app. Overrides global setting if set. Default: `null` (use global).
* **`max_event_name_length`** (integer, optional): Maximum length for event names for this app. Overrides global setting if set. Default: `null` (use global).
* **`max_event_payload_in_kb`** (integer, optional): Maximum payload size for a single event in kilobytes for this app. Overrides global setting if set. Default: `null` (use global).
* **`max_event_batch_size`** (integer, optional): Maximum number of events in a batch API call for this app. Overrides global setting if set. Default: `null` (use global).

#### Authentication and Features

* **`enable_user_authentication`** (boolean, optional): Whether user authentication is enabled for this app. Default: `null` (use global setting).
* **`enable_watchlist_events`** (boolean, optional): Whether watchlist events are enabled for this app. Default: `null` (disabled).

#### Security Settings

* **`allowed_origins`** (array of strings, optional): List of allowed origin patterns for WebSocket connections. Provides app-level origin validation as an additional security layer. Supports CORS-like pattern matching including protocol-agnostic (`example.com`), protocol-specific (`https://example.com`), and wildcard patterns (`*.example.com`). If not configured or empty, all origins are allowed (backward compatible). See [Origin Validation Configuration](./origin-validation.md) for detailed configuration examples. Default: `null`.

#### Webhooks

* **`webhooks`** (array of `Webhook` objects, optional): Configuration for webhooks specific to this app. See [Webhooks Configuration](./webhooks.md) for the `Webhook` object structure. Default: `null`.

## Example Configuration

```json
{
  "app_manager": {
    "driver": "memory",
    "array": {
      "apps": [
        {
          "id": "demo-app",
          "key": "demo-key",
          "secret": "demo-secret-shhh",
          "max_connections": "1000",
          "enable_client_messages": true,
          "enabled": true,
          "max_backend_events_per_second": null,
          "max_client_events_per_second": "10000",
          "max_read_requests_per_second": null,
          "max_presence_members_per_channel": 50,
          "max_presence_member_size_in_kb": 2,
          "max_channel_name_length": 200,
          "max_event_channels_at_once": 100,
          "max_event_name_length": 200,
          "max_event_payload_in_kb": 100,
          "max_event_batch_size": 10,
          "enable_user_authentication": true,
          "enable_watchlist_events": false,
          "allowed_origins": [
            "https://myapp.com",
            "https://admin.myapp.com",
            "localhost:3000"
          ],
          "webhooks": [
            {
              "url": "https://myapplication.com/webhooks/sockudo",
              "event_types": ["channel_occupied", "channel_vacated"]
            }
          ]
        },
        {
          "id": "another-app",
          "key": "another-key",
          "secret": "another-secret-super-safe",
          "max_connections": "500",
          "enable_client_messages": false,
          "enabled": true,
          "max_client_events_per_second": "1000"
        }
      ]
    },
    "cache": {
      "enabled": true,
      "ttl": 600
    }
  }
}
```

## Database-Backed App Managers

When using `"mysql"`, `"postgres"`, or `"dynamodb"` as the `app_manager.driver`, Sockudo will expect the corresponding database connection details to be configured under the global `database` section.

### MySQL App Manager

* **Configuration**: Configure `database.mysql`. The App Manager will use a table (default: `applications`) in this database.
* **Table Structure**: The table includes columns for all App object fields, with JSON/TEXT columns for complex settings like `webhooks`.

Example database configuration for MySQL:

```json
{
  "database": {
    "mysql": {
      "host": "mysql",
      "port": 3306,
      "username": "sockudo",
      "password": "sockudo123",
      "database": "sockudo",
      "table_name": "applications",
      "connection_pool_size": 10,
      "cache_ttl": 300,
      "cache_cleanup_interval": 60,
      "cache_max_capacity": 100
    }
  }
}
```

### PostgreSQL App Manager

* **Configuration**: Configure `database.postgres`. The App Manager will use a table (default: `applications`) in this database.
* **Table Structure**: Similar to MySQL, with PostgreSQL-specific data types.

Example database configuration for PostgreSQL:

```json
{
  "database": {
    "postgres": {
      "host": "postgres",
      "port": 5432,
      "username": "sockudo",
      "password": "sockudo123",
      "database": "sockudo",
      "table_name": "applications",
      "connection_pool_size": 10,
      "cache_ttl": 300,
      "cache_cleanup_interval": 60,
      "cache_max_capacity": 100
    }
  }
}
```

### DynamoDB App Manager

* **Configuration**: Configure `database.dynamodb`. The App Manager will use a DynamoDB table (default: `sockudo-applications`).
* **Table Structure**: The table has attributes corresponding to the `App` object fields.

Example database configuration for DynamoDB:

```json
{
  "database": {
    "dynamodb": {
      "region": "us-east-1",
      "table_name": "sockudo-applications",
      "endpoint": null,
      "access_key": null,
      "secret_key": null,
      "profile_name": null
    }
  }
}
```

## Environment Variables for App Manager

You can use environment variables to configure the app manager:

```bash
# App Manager Driver
APP_MANAGER_DRIVER=memory

# Default App Settings (used when no apps are configured)
SOCKUDO_DEFAULT_APP_ID=demo-app
SOCKUDO_DEFAULT_APP_KEY=demo-key
SOCKUDO_DEFAULT_APP_SECRET=demo-secret
SOCKUDO_ENABLE_CLIENT_MESSAGES=true

# Database Settings (for database-backed app managers)
DATABASE_MYSQL_HOST=mysql
DATABASE_MYSQL_USER=sockudo
DATABASE_MYSQL_PASSWORD=your_password
DATABASE_MYSQL_DATABASE=sockudo

# PostgreSQL
DATABASE_POSTGRES_HOST=postgres
DATABASE_POSTGRES_USER=sockudo
DATABASE_POSTGRES_PASSWORD=your_password
DATABASE_POSTGRES_DATABASE=sockudo

# DynamoDB
AWS_REGION=us-east-1
```

## Number Field Handling

Note that numeric fields in the App configuration can be specified as either numbers or strings in the JSON configuration. This is handled by custom deserializers in the code:

```json
{
  "max_connections": 1000,        // As number
  "max_connections": "1000"       // As string - both work
}
```

This flexibility allows for easier configuration management, especially when values might come from environment variables or different data sources.

## Default Values and Inheritance

When an app-specific limit is set to `null` or not specified, Sockudo will use the global default values defined in the main server configuration. This allows you to:

1. Set global defaults that apply to all apps
2. Override specific limits for individual apps as needed
3. Keep app configurations minimal when defaults are sufficient

For example, if the global `event_limits.max_payload_in_kb` is set to 100, but a specific app has `max_event_payload_in_kb: 50`, that app will use 50KB as its limit while other apps use the global 100KB limit.