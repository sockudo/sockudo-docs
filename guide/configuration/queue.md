# Queue Configuration

Sockudo can utilize a queueing system for background processing tasks, most notably for handling webhook dispatches. This allows Sockudo to send webhooks asynchronously without blocking the main application flow, improving responsiveness and reliability.

Queue configuration is managed under the `queue` object in your `config.json`.

## Main Queue Settings

* **JSON Key (Parent)**: `queue`

### `queue.driver`
* **JSON Key**: `driver`
* **Environment Variable**: `QUEUE_DRIVER`
* **Type**: `enum` (string)
* **Description**: Specifies the backend driver for the queueing system.
* **Default Value**: `"redis"`
* **Possible Values**:
  * `"memory"`: In-memory queue. Simple for development but not persistent or shared across instances.
  * `"redis"`: Uses a Redis server as a message queue.
  * `"redis-cluster"`: Uses a Redis Cluster as a message queue for high availability and scalability.
  * `"sqs"`: Uses Amazon Simple Queue Service (SQS).
  * `"none"`: Disables the queueing system. Webhooks might be sent synchronously or not at all.

**Example (`config.json`)**:
```json
{
  "queue": {
    "driver": "redis",
    "redis": {
      "concurrency": 5,
      "prefix": "sockudo_queue:",
      "cluster_mode": false
    }
  }
}
```

**Example (Environment Variable)**:
```bash
export QUEUE_DRIVER=redis
export REDIS_URL=redis://redis:6379/0
```

## Redis Queue Options (`queue.redis`)

These settings are applicable if `queue.driver` is set to `"redis"`.

* **JSON Key (Parent Object)**: `queue.redis`

### `queue.redis.concurrency`
* **JSON Key**: `concurrency`
* **Type**: `integer` (u32)
* **Description**: The number of concurrent workers processing jobs from this Redis queue.
* **Default Value**: `5`

### `queue.redis.prefix`
* **JSON Key**: `prefix`
* **Environment Variable**: `QUEUE_REDIS_PREFIX`
* **Type**: `string` (optional)
* **Description**: A prefix for Redis keys used by the queue (e.g., list names).
* **Default Value**: `"sockudo_queue:"`

### `queue.redis.url_override`
* **JSON Key**: `url_override`
* **Environment Variable**: `QUEUE_REDIS_URL`
* **Type**: `string` (optional)
* **Description**: A specific Redis connection URL to use for the queue, overriding the global `database.redis.url` if provided.
  Format: `redis://[username:password@]host:port[/db]`
* **Default Value**: `null` (None). If not set, it will use the global Redis configuration from `database.redis`.

### `queue.redis.cluster_mode`
* **JSON Key**: `cluster_mode`
* **Type**: `boolean`
* **Description**: Indicates if the Redis connection for the queue should operate in cluster mode.
* **Default Value**: `false`

**Example (`config.json`)**:
```json
{
  "queue": {
    "driver": "redis",
    "redis": {
      "concurrency": 10,
      "prefix": "sockudo_jobs:",
      "url_override": "redis://my-queue-redis:6379/2",
      "cluster_mode": false
    }
  }
}
```

**Environment Variables for Redis Queue:**
```bash
QUEUE_DRIVER=redis
QUEUE_REDIS_PREFIX="sockudo_jobs:"
QUEUE_REDIS_URL="redis://my-queue-redis:6379/2"
REDIS_CONNECTION_POOL_SIZE=10
```

## Redis Cluster Queue Options (`queue.redis_cluster`)

These settings are applicable if `queue.driver` is set to `"redis-cluster"`.

* **JSON Key (Parent Object)**: `queue.redis_cluster`

### `queue.redis_cluster.concurrency`
* **JSON Key**: `concurrency`
* **Environment Variable**: `REDIS_CLUSTER_QUEUE_CONCURRENCY`
* **Type**: `integer` (u32)
* **Description**: The number of concurrent workers processing jobs from this Redis Cluster queue.
* **Default Value**: `5`

### `queue.redis_cluster.prefix`
* **JSON Key**: `prefix`
* **Environment Variable**: `REDIS_CLUSTER_QUEUE_PREFIX`
* **Type**: `string` (optional)
* **Description**: A prefix for Redis keys used by the queue in the cluster.
* **Default Value**: `"sockudo_queue:"`

### `queue.redis_cluster.nodes`
* **JSON Key**: `nodes`
* **Environment Variable**: `REDIS_CLUSTER_NODES` (comma-separated list)
* **Type**: `array` of `string`
* **Description**: List of Redis cluster node URLs to connect to. The client will discover other nodes automatically.
  Format: `["redis://host1:port1", "redis://host2:port2", ...]`
* **Default Value**: `[]` (empty array)

### `queue.redis_cluster.request_timeout_ms`
* **JSON Key**: `request_timeout_ms`
* **Type**: `integer` (u64, milliseconds)
* **Description**: Request timeout for Redis cluster operations in milliseconds.
* **Default Value**: `5000`

**Example (`config.json` for Redis Cluster)**:
```json
{
  "queue": {
    "driver": "redis-cluster",
    "redis_cluster": {
      "nodes": [
        "redis://redis-cluster-node-1:7000",
        "redis://redis-cluster-node-2:7000",
        "redis://redis-cluster-node-3:7000"
      ],
      "concurrency": 8,
      "prefix": "production_queue:",
      "request_timeout_ms": 10000
    }
  }
}
```

**Example (Environment Variables for Redis Cluster)**:
```bash
export QUEUE_DRIVER=redis-cluster
export REDIS_CLUSTER_NODES="redis://node1:7000,redis://node2:7000,redis://node3:7000"
export REDIS_CLUSTER_QUEUE_CONCURRENCY=8
export REDIS_CLUSTER_QUEUE_PREFIX="production_queue:"
```

## SQS Queue Options (`queue.sqs`)

These settings are applicable if `queue.driver` is set to `"sqs"`.

* **JSON Key (Parent Object)**: `queue.sqs`

### `queue.sqs.region`
* **JSON Key**: `region`
* **Environment Variable**: `AWS_REGION` or `SQS_REGION`
* **Type**: `string`
* **Description**: The AWS region where your SQS queue is located (e.g., "us-east-1").
* **Default Value**: `"us-east-1"`

### `queue.sqs.queue_url_prefix`
* **JSON Key**: `queue_url_prefix`
* **Environment Variable**: `SQS_QUEUE_URL_PREFIX`
* **Type**: `string` (optional)
* **Description**: The prefix for your SQS queue URL. Sockudo will append the queue name to this prefix.
* **Default Value**: `null` (None)

### `queue.sqs.visibility_timeout`
* **JSON Key**: `visibility_timeout`
* **Type**: `integer` (i32, seconds)
* **Description**: The duration (in seconds) that a message received from a queue will be invisible to other consumers.
* **Default Value**: `30`

### `queue.sqs.endpoint_url`
* **JSON Key**: `endpoint_url`
* **Environment Variable**: `SQS_ENDPOINT_URL`
* **Type**: `string` (optional)
* **Description**: Custom SQS endpoint URL. Useful for testing with local SQS alternatives like LocalStack.
* **Default Value**: `null` (None)

### `queue.sqs.max_messages`
* **JSON Key**: `max_messages`
* **Type**: `integer` (i32)
* **Description**: The maximum number of messages to retrieve with each SQS receive message call (1-10).
* **Default Value**: `10`

### `queue.sqs.wait_time_seconds`
* **JSON Key**: `wait_time_seconds`
* **Type**: `integer` (i32, seconds)
* **Description**: The duration (in seconds) for which the call waits for a message to arrive in the queue before returning (long polling).
* **Default Value**: `5`

### `queue.sqs.concurrency`
* **JSON Key**: `concurrency`
* **Type**: `integer` (u32)
* **Description**: The number of concurrent workers processing jobs from this SQS queue.
* **Default Value**: `5`

### `queue.sqs.fifo`
* **JSON Key**: `fifo`
* **Type**: `boolean`
* **Description**: Set to `true` if the SQS queue is a FIFO (First-In-First-Out) queue.
* **Default Value**: `false`

### `queue.sqs.message_group_id`
* **JSON Key**: `message_group_id`
* **Type**: `string` (optional)
* **Description**: The message group ID to use when sending messages to an SQS FIFO queue. Required if `fifo` is `true`.
* **Default Value**: `"default"`

**Example (`config.json` for SQS)**:
```json
{
  "queue": {
    "driver": "sqs",
    "sqs": {
      "region": "eu-west-1",
      "queue_url_prefix": "https://sqs.eu-west-1.amazonaws.com/YOUR_ACCOUNT_ID/",
      "visibility_timeout": 60,
      "concurrency": 3,
      "fifo": false,
      "max_messages": 10,
      "wait_time_seconds": 5
    }
  }
}
```

**Example for FIFO Queue:**
```json
{
  "queue": {
    "driver": "sqs",
    "sqs": {
      "region": "us-east-1",
      "queue_url_prefix": "https://sqs.us-east-1.amazonaws.com/123456789012/",
      "fifo": true,
      "message_group_id": "sockudo-group",
      "visibility_timeout": 30,
      "concurrency": 5
    }
  }
}
```

**Environment Variables for SQS:**
```bash
QUEUE_DRIVER=sqs
AWS_REGION=eu-west-1
SQS_QUEUE_URL_PREFIX="https://sqs.eu-west-1.amazonaws.com/YOUR_ACCOUNT_ID/"
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## AWS Credentials for SQS

When using the SQS driver, Sockudo's AWS SDK will need credentials. These are typically sourced automatically by the SDK from standard locations:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
2. Shared credentials file (`~/.aws/credentials`)
3. IAM roles for EC2 instances or ECS tasks
4. AWS Profile specified in configuration

## Memory Queue Options

For development and testing, you can use an in-memory queue:

```json
{
  "queue": {
    "driver": "memory"
  }
}
```

**Environment Variable:**
```bash
QUEUE_DRIVER=memory
```

**Note**: Memory queues are not persistent and don't work across multiple instances.

## Queue Job Types

Sockudo uses queues primarily for:

### Webhook Processing
When webhooks are configured, events are queued for asynchronous processing:

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

### Background Tasks
Other background tasks may also use the queue system for processing.

## Queue Driver Comparison

| Feature | Memory | Redis | Redis Cluster | SQS |
|---------|--------|-------|---------------|-----|
| **Persistence** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Multi-instance** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **High Availability** | ❌ No | ⚠️ Limited | ✅ Yes | ✅ Yes |
| **Scalability** | ❌ Limited | ⚠️ Vertical | ✅ Horizontal | ✅ Managed |
| **Cost** | ✅ Free | 💰 Hosting | 💰 Hosting | 💰 Per message |
| **Setup Complexity** | ✅ Simple | ⚠️ Moderate | ❌ Complex | ✅ Managed |
| **Latency** | ✅ Very Low | ✅ Low | ⚠️ Medium | ⚠️ Medium-High |
| **Best For** | Development | Single Redis | HA deployments | AWS-native |

## Performance Considerations

### Concurrency Settings
- **Low concurrency (1-3)**: Better for ordered processing, less resource usage
- **Medium concurrency (5-10)**: Good balance for most workloads
- **High concurrency (10+)**: Better throughput, more resource usage

### Queue Monitoring
Monitor these key metrics:

```bash
# Redis queue monitoring
redis-cli llen sockudo_queue:default
redis-cli llen sockudo_queue:webhooks

# SQS queue monitoring (via AWS CLI)
aws sqs get-queue-attributes --queue-url YOUR_QUEUE_URL --attribute-names All
```

### Webhook Processing Patterns

#### Immediate Processing (No Queue)
```json
{
  "queue": {
    "driver": "none"
  }
}
```
- Webhooks sent synchronously
- Can slow down main request processing
- Simpler debugging

#### Asynchronous Processing (With Queue)
```json
{
  "queue": {
    "driver": "redis",
    "redis": {
      "concurrency": 5
    }
  }
}
```
- Webhooks sent asynchronously
- Better main request performance
- Requires queue infrastructure

## Error Handling and Retries

### Redis Retry Logic
- Failed jobs are automatically retried with exponential backoff
- Dead letter queue for persistently failed jobs
- Configurable retry attempts and delays

### SQS Retry Logic
- Uses SQS's built-in retry mechanism
- Configurable visibility timeout
- Dead letter queue support

### Monitoring Failed Jobs

```bash
# Check failed jobs in Redis
redis-cli llen sockudo_queue:failed

# Monitor SQS dead letter queues
aws sqs receive-message --queue-url YOUR_DLQ_URL
```

## Security Considerations

### Redis Security
```json
{
  "database": {
    "redis": {
      "password": "your_redis_password",
      "username": "queue_user"
    }
  }
}
```

### SQS Security
- Use IAM roles with minimal required permissions
- Enable SQS encryption at rest
- Use VPC endpoints for private communication

## Best Practices

### Development
1. **Use memory queue** for local development
2. **Test with Redis** in staging environment
3. **Monitor queue depths** during development

### Production
1. **Use Redis or SQS** for production
2. **Monitor queue performance** and adjust concurrency
3. **Set up alerting** for queue depth and failed jobs
4. **Plan for queue scaling** based on load

### Webhook Reliability
1. **Enable batching** for high-volume scenarios
2. **Configure appropriate timeouts** for webhook endpoints
3. **Implement idempotent webhook handlers**
4. **Monitor webhook success rates**

## Troubleshooting

### Common Issues

#### Queue Not Processing Jobs
1. Check queue driver configuration
2. Verify Redis/SQS connectivity
3. Check worker concurrency settings
4. Monitor queue worker logs

#### High Queue Depth
1. Increase worker concurrency
2. Check webhook endpoint performance
3. Monitor failed job rates
4. Scale queue infrastructure

#### Failed Webhooks
1. Check webhook endpoint availability
2. Verify webhook URL configuration
3. Monitor network connectivity
4. Check webhook authentication

### Debug Commands

```bash
# Check queue status
curl http://localhost:6001/usage

# Redis queue inspection
redis-cli llen sockudo_queue:default
redis-cli lrange sockudo_queue:default 0 10

# Monitor queue metrics
curl http://localhost:9601/metrics | grep queue

# SQS queue attributes
aws sqs get-queue-attributes --queue-url YOUR_QUEUE_URL --attribute-names All
```

Choose the queue driver that best fits your deployment requirements and infrastructure constraints.