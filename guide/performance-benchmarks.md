# Performance Benchmarks

Sockudo has been benchmarked against similar WebSocket servers to demonstrate its performance characteristics. These benchmarks help you understand what to expect in terms of message latency, throughput, and connection handling under load.

## WebSocket Server Comparison

The following benchmarks compare Sockudo against Soketi (a popular Node.js-based Pusher-compatible server) using k6 load testing tools. Both servers were tested under identical conditions with 500 concurrent virtual users over a 2 minute 19 second test duration.

### Test Configuration
- **Virtual Users**: 500 concurrent connections
- **Test Duration**: 2m 19s 
- **Message Pattern**: Real-time WebSocket messaging
- **Infrastructure**: Identical server resources for both tests

#### Hardware Specifications
- **Device**: Loki
- **Processor**: AMD Ryzen 7 8845HS w/ Radeon 780M Graphics (3.80 GHz)
- **RAM**: 32.0 GB (31.3 GB usable)
- **System**: 64-bit operating system, x64-based processor

Both Sockudo and Soketi were tested on the same hardware configuration to ensure fair comparison.

### Results Summary

| Metric | Sockudo | Soketi | Improvement |
|--------|---------|---------|-------------|
| **Avg Message Delay** | 1.84ms | 12.01ms | **6.5x faster** |
| **95th Percentile Delay** | 3ms | 24ms | **8x faster** |
| **Max Message Delay** | 13ms | 37ms | **2.8x faster** |
| **WebSocket Messages/sec** | 2,927 | 2,523 | **16% higher** |
| **Data Throughput** | 243 kB/s | 209 kB/s | **16% higher** |

### Detailed Benchmark Results

#### Sockudo Performance
```
CUSTOM
message_delay_ms.........................: avg=1.84ms   min=-1    med=2ms      max=13ms   p(90)=3ms    p(95)=3ms

EXECUTION  
iteration_duration.......................: avg=2m19s    min=1m50s med=2m40s    max=2m40s  p(90)=2m40s  p(95)=2m40s
iterations...............................: 249          1.310504/s
vus......................................: 101          min=4         max=500
vus_max..................................: 500          min=500       max=500

NETWORK
data_received............................: 46 MB        243 kB/s
data_sent................................: 206 kB       1.1 kB/s

WEBSOCKET
ws_connecting............................: avg=892.84µs min=0s    med=844.85µs max=3.17ms p(90)=1.36ms p(95)=1.55ms
ws_msgs_received.........................: 556,125      2926.923435/s
ws_msgs_sent.............................: 2,261        11.899796/s
ws_session_duration......................: avg=2m19s    min=1m50s med=2m40s    max=2m40s  p(90)=2m40s  p(95)=2m40s
ws_sessions..............................: 500          2.631534/s
```

#### Soketi Performance
```
CUSTOM
message_delay_ms.........................: avg=12.01ms  min=-1    med=10ms     max=37ms   p(90)=22ms   p(95)=24ms

EXECUTION
iteration_duration.......................: avg=2m19s    min=1m50s med=2m40s    max=2m40s  p(90)=2m40s  p(95)=2m40s
iterations...............................: 249          1.310506/s
vus......................................: 101          min=4         max=500
vus_max..................................: 500          min=500       max=500

NETWORK
data_received............................: 40 MB        209 kB/s
data_sent................................: 206 kB       1.1 kB/s

WEBSOCKET
ws_connecting............................: avg=1.37ms   min=0s    med=1.02ms   max=14.22ms p(90)=2.05ms p(95)=4.14ms
ws_msgs_received.........................: 479,283      2522.502687/s
ws_msgs_sent.............................: 2,261        11.899814/s
ws_session_duration......................: avg=2m19s    min=1m50s med=2m40s    max=2m40s  p(90)=2m40s  p(95)=2m40s
ws_sessions..............................: 500          2.631538/s
```

### Key Performance Insights

#### Message Latency
Sockudo demonstrates significantly lower message latency:
- **Average latency**: 1.84ms vs 12.01ms (6.5x improvement)
- **95th percentile**: 3ms vs 24ms (8x improvement)
- **Consistent performance**: Lower variance in latency measurements

#### Throughput
Sockudo shows superior message handling:
- **16% higher message throughput**: 2,927 vs 2,523 messages/second
- **16% higher data throughput**: 243 kB/s vs 209 kB/s received
- **More efficient processing**: Higher throughput with lower latency

#### Connection Handling
Both servers handled the connection load well:
- **Identical connection patterns**: Both successfully managed 500 concurrent connections
- **Faster connection establishment**: Sockudo averaged 892µs vs 1.37ms for initial WebSocket handshake
- **Stable session duration**: Both maintained consistent session durations

### Running Your Own Benchmarks

The benchmarks use a comprehensive multi-component setup with k6 for WebSocket connections and PHP for message publishing to simulate realistic real-time application patterns.

#### Benchmark Architecture

The testing setup consists of:
1. **k6 WebSocket clients**: Simulate concurrent user connections with realistic traffic patterns
2. **PHP message publisher**: Sends timestamped messages to measure end-to-end latency
3. **Dynamic thresholds**: Automatically adjust performance expectations based on configuration
4. **Multi-scenario testing**: Combines soak testing (sustained connections) with high traffic bursts

This approach provides realistic performance measurements by:
- **Simulating real user behavior**: Multiple connection patterns and message rates
- **Measuring end-to-end latency**: From message publish to WebSocket delivery
- **Testing different configurations**: Adapters, databases, and caching layers
- **Accounting for infrastructure**: Dynamic thresholds based on selected components

#### k6 WebSocket Test Script

```javascript
// ci-local.js
import { Trend } from 'k6/metrics';
import ws from 'k6/ws';

const delayTrend = new Trend('message_delay_ms');

let maxP95 = 100;
let maxAvg = 100;

// External DBs are really slow for benchmarks.
if (['mysql', 'postgres', 'dynamodb'].includes(__ENV.APP_MANAGER_DRIVER)) {
    maxP95 += 500;
    maxAvg += 100;
}

// Horizontal drivers take additional time to communicate with other nodes.
if (['redis', 'cluster', 'nats'].includes(__ENV.ADAPTER_DRIVER)) {
    maxP95 += 100;
    maxAvg += 100;
}

if (['redis'].includes(__ENV.CACHE_DRIVER)) {
    maxP95 += 20;
    maxAvg += 20;
}

export const options = {
    thresholds: {
        message_delay_ms: [
            { threshold: `p(95)<${maxP95}`, abortOnFail: false },
            { threshold: `avg<${maxAvg}`, abortOnFail: false },
        ],
    },

    scenarios: {
        // Keep connected many users at the same time.
        soakTraffic: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '0s',
            stages: [
                { duration: '50s', target: 250 },
                { duration: '110s', target: 250 },
            ],
            gracefulRampDown: '40s',
            env: {
                SLEEP_FOR: '160',
                WS_HOST: __ENV.WS_HOST || 'ws://127.0.0.1:6001/app/app-key',
            },
        },

        // High amount of connections and disconnections
        // representing active traffic
        highTraffic: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '50s',
            stages: [
                { duration: '50s', target: 250 },
                { duration: '30s', target: 250 },
                { duration: '10s', target: 100 },
                { duration: '10s', target: 50 },
                { duration: '10s', target: 100 },
            ],
            gracefulRampDown: '20s',
            env: {
                SLEEP_FOR: '110',
                WS_HOST: __ENV.WS_HOST || 'ws://127.0.0.1:6001/app/app-key',
            },
        },
    },
};

export default () => {
    ws.connect(__ENV.WS_HOST, null, (socket) => {
        socket.setTimeout(() => {
            socket.close();
        }, __ENV.SLEEP_FOR * 1000);

        socket.on('open', () => {
            // Keep connection alive with pusher:ping
            socket.setInterval(() => {
                socket.send(JSON.stringify({
                    event: 'pusher:ping',
                    data: JSON.stringify({}),
                }));
            }, 30000);

            socket.on('message', message => {
                let receivedTime = Date.now();
                message = JSON.parse(message);

                if (message.event === 'pusher:connection_established') {
                    socket.send(JSON.stringify({
                        event: 'pusher:subscribe',
                        data: { channel: 'benchmark' },
                    }));
                }

                if (message.event === 'timed-message') {
                    let data = JSON.parse(message.data);
                    delayTrend.add(receivedTime - data.time);
                }
            });
        });
    });
}
```

#### PHP Message Publisher

```php
#!/usr/bin/env php
<?php

require __DIR__ . '/vendor/autoload.php';

use Carbon\Carbon;
use Pusher\Pusher;
use React\EventLoop\Loop;
use Toolkit\PFlag\Flags;
use Toolkit\PFlag\FlagType;

$loop = Loop::get();
$flags = array_shift($argv);

$fs = Flags::new();
$fs->setScriptFile($flags);

$fs->addOpt('interval', 'i', 'Specify at which interval to send each message.', FlagType::FLOAT, false, 0.1);
$fs->addOpt('messages', 'm', 'Specify the number of messages to send.', FlagType::INT, false);
$fs->addOpt('host', 'h', 'Specify the host to connect to.', FlagType::STRING, false, '127.0.0.1');
$fs->addOpt('app-id', 'app-id', 'Specify the ID to use.', FlagType::STRING, false, 'app-id');
$fs->addOpt('app-key', 'app-key', 'Specify the key to use.', FlagType::STRING, false, 'app-key');
$fs->addOpt('app-secret', 'app-secret', 'Specify the secret to use.', FlagType::STRING, false, 'app-secret');
$fs->addOpt('port', 'p', 'Specify the port to connect to.', FlagType::INT, false, 6001);
$fs->addOpt('ssl', 's', 'Securely connect to the server.', FlagType::BOOL, false, false);
$fs->addOpt('verbose', 'v', 'Enable verbosity.', FlagType::BOOL, false, false);

if (! $fs->parse($argv)) {
    return;
}

$options = $fs->getOpts();

$pusher = new Pusher(
    $options['app-key'] ?? 'app-key',
    $options['app-secret'] ?? 'app-secret',
    $options['app-id'] ?? 'app-id',
    [
        'host' => $options['host'],
        'port' => $options['port'],
        'scheme' => $options['ssl'] ? 'https' : 'http',
        'encrypted' => true,
        'useTLS' => $options['ssl'],
    ]
);

$interval = $options['interval'] ?? null;
$messagesBeforeStop = $options['messages'] ?? null;
$totalMessages = 0;

$loop->addPeriodicTimer($interval, function () use ($pusher, &$totalMessages, $messagesBeforeStop, $loop, $options) {
    if ($messagesBeforeStop && $totalMessages >= $messagesBeforeStop) {
        echo "Sent: {$totalMessages} messages";
        return $loop->stop();
    }

    $pusher->trigger('benchmark', 'timed-message', [
        'time' => $time = Carbon::now()->getPreciseTimestamp(3),
    ]);

    $totalMessages++;

    if ($options['verbose'] ?? false) {
        echo 'Sent message with time: '.$time.PHP_EOL;
    }
});
#### Understanding the Results

The benchmark provides comprehensive performance insights:

**Message Delay Metrics**: The core performance indicator measuring the time from when a PHP script publishes a message via HTTP API until it's received by WebSocket clients. This represents real-world application latency.

**Dynamic Thresholds**: The benchmark automatically adjusts expectations based on your configuration:
- **External databases** (MySQL, PostgreSQL, DynamoDB): +500ms P95, +100ms average
- **Horizontal adapters** (Redis, NATS, Cluster): +100ms P95, +100ms average  
- **Redis caching**: +20ms P95, +20ms average

**Scenario Breakdown**:
- **soakTraffic**: Tests sustained performance with 250 concurrent connections for 110 seconds
- **highTraffic**: Tests burst performance with varying connection loads (50-250 users)

This provides a realistic assessment of how Sockudo performs under different infrastructure configurations and load patterns.

You need 4 terminals to run the complete benchmark:

**Terminal 1: Start Sockudo**
```bash
cargo run --release
```

**Terminal 2: Start PHP Message Publisher**
```bash
# Low traffic (1 message/second)
php send.php --interval 1 --port 6001

# Mild traffic (2 messages/second) 
php send.php --interval 0.5 --port 6001

# High traffic (10 messages/second)
php send.php --interval 0.1 --port 6001
```

**Terminal 3: Run k6 WebSocket Test**
```bash
k6 run ci-local.js
```

**Terminal 4: Monitor (Optional)**
```bash
# Monitor metrics
curl http://localhost:9601/metrics

# Watch connections
watch 'curl -s http://localhost:6001/usage'
```

#### Environment Variables for Testing

Configure different components for comprehensive testing:

```bash
# Test with different adapters
export ADAPTER_DRIVER=local
export ADAPTER_DRIVER=redis
export ADAPTER_DRIVER=nats

# Test with different app managers
export APP_MANAGER_DRIVER=memory
export APP_MANAGER_DRIVER=mysql
export APP_MANAGER_DRIVER=postgres

# Test with caching
export CACHE_DRIVER=memory
export CACHE_DRIVER=redis

# Run benchmark
k6 run ci-local.js
```

### Production Performance Expectations

Based on these benchmarks, you can expect:

- **Sub-5ms message latency** for most real-time applications
- **3000+ messages/second** per instance under normal load
- **Efficient resource usage** with Rust's memory management
- **Linear scaling** when horizontally scaled with proper adapters

For production deployments, consider:
- **Load balancing** multiple Sockudo instances for higher throughput
- **Redis or NATS adapters** for horizontal scaling
- **Monitoring** message latency and connection metrics
- **Capacity planning** based on your specific message patterns

### Benchmark Environment

These benchmarks represent typical performance under controlled conditions on a high-performance development machine. Your results may vary based on:

#### Hardware Factors
- **CPU performance**: The test used an AMD Ryzen 7 8845HS (3.80 GHz) - results may differ on other processors
- **Available RAM**: 32GB provided ample memory - lower RAM may impact performance with many concurrent connections
- **Storage type**: SSD vs HDD can affect database and logging performance
- **Network interface**: Local testing eliminates network latency variables

#### Software Configuration
- **Operating system**: 64-bit Windows system was used for testing
- **Rust optimization**: Release builds (`cargo run --release`) are essential for accurate performance measurement
- **Database backend**: Results will vary significantly between in-memory, MySQL, PostgreSQL, and DynamoDB
- **Adapter choice**: Local, Redis, NATS, and cluster adapters have different performance characteristics

#### Application Factors
- **Message size and frequency**: Larger messages or higher frequencies will impact latency
- **Number of channels**: More active channels increase memory usage and processing overhead
- **Subscription patterns**: Many subscriptions per connection can affect performance
- **Authentication complexity**: Private and presence channels add processing overhead

For the most accurate performance assessment, run benchmarks in your specific deployment environment with your typical message patterns and loads.

## Optimization Tips

### Server Configuration
```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 6001,
    "max_connections": 10000,
    "keepalive_timeout": 60
  },
  "rate_limiting": {
    "enabled": true,
    "max_requests_per_minute": 1000
  }
}
```

### OS-Level Optimizations
```bash
# Increase file descriptor limits
ulimit -n 65536

# Optimize TCP settings for high-concurrency
echo 'net.core.somaxconn = 65536' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65536' >> /etc/sysctl.conf
sysctl -p
```

### Docker Performance
```dockerfile
# Use multi-stage builds for smaller images
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
COPY --from=builder /app/target/release/sockudo /usr/local/bin/
# Optimize for production
ENV RUST_LOG=info
ENV TOKIO_WORKER_THREADS=4
CMD ["sockudo"]
```

### Monitoring Performance in Production

Set up alerts for key performance metrics:

```yaml
# Prometheus alerts
groups:
  - name: sockudo_performance
    rules:
      - alert: HighMessageLatency
        expr: histogram_quantile(0.95, rate(sockudo_message_delay_seconds_bucket[5m])) > 0.01
        for: 2m
        annotations:
          summary: "Message latency is high"
          
      - alert: LowThroughput
        expr: rate(sockudo_messages_sent_total[5m]) < 1000
        for: 5m
        annotations:
          summary: "Message throughput below expected baseline"
```

Regular performance monitoring helps ensure your Sockudo deployment continues to meet performance expectations as your application scales.