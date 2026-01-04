# Monitoring Sockudo

Monitoring your Sockudo server is crucial for understanding its performance, identifying bottlenecks, and ensuring its reliability in a production environment. Sockudo can expose metrics via a Prometheus-compatible endpoint and provides comprehensive observability features.

## Enabling Metrics

First, ensure that metrics are enabled in your Sockudo configuration:

```json
{
  "metrics": {
    "enabled": true,
    "driver": "prometheus",
    "host": "0.0.0.0",
    "port": 9601,
    "prometheus": {
      "prefix": "sockudo_"
    }
  }
}
```

**Environment Variables:**
```bash
METRICS_ENABLED=true
METRICS_HOST="0.0.0.0"
METRICS_PORT=9601
METRICS_PROMETHEUS_PREFIX="sockudo_"
```

By default, metrics will be available at `http://<metrics_host>:<metrics_port>/metrics` (e.g., `http://localhost:9601/metrics`).

## Available Metrics

Sockudo exposes comprehensive metrics for monitoring server performance and health. For a complete list of available metrics and their descriptions, see the [Metrics Configuration Guide](./configuration/metrics.md#available-metrics).

### Key Monitoring Categories

The available metrics cover the following areas:
- **Connection Management**: Track active connections, connection/disconnection rates, and connection errors
- **Message Throughput**: Monitor WebSocket messages and bytes transmitted/received
- **HTTP API Performance**: Track API calls and data transfer
- **Channel Activity**: Monitor channel subscriptions and active channels
- **Rate Limiting**: Track rate limit checks and triggers
- **Horizontal Scaling**: Monitor adapter performance for distributed deployments (Redis, NATS)
- **Broadcast Performance**: End-to-end latency tracking for message broadcasts (v2.6.1+)

## Setting up Prometheus

### Prometheus Configuration

Add a scrape job to your `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sockudo'
    static_configs:
      - targets: ['localhost:9601']
        labels:
          instance: 'sockudo-1'
          environment: 'production'
    scrape_interval: 15s
    metrics_path: /metrics
    scheme: http
```

### Multi-Instance Setup

For multiple Sockudo instances:

```yaml
scrape_configs:
  - job_name: 'sockudo'
    static_configs:
      - targets: 
          - 'sockudo-1.example.com:9601'
          - 'sockudo-2.example.com:9601'
          - 'sockudo-3.example.com:9601'
        labels:
          environment: 'production'
          cluster: 'main'
```

### Docker Compose with Prometheus

```yaml
version: '3.8'
services:
  sockudo:
    image: sockudo/sockudo:latest
    ports:
      - "6001:6001"
      - "9601:9601"
    environment:
      - METRICS_ENABLED=true
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=9601"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

volumes:
  prometheus_data:
```

### Kubernetes Service Discovery

```yaml
scrape_configs:
  - job_name: 'sockudo'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: ['sockudo-namespace']
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: sockudo
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        target_label: __address__
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: instance
```

## Visualization with Grafana

### Installing Grafana

```yaml
# Add to docker-compose.yml
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
```

### Key Dashboard Panels

#### 1. Connection Overview
```promql
# Active connections gauge
sockudo_connected

# Connection rate (connections per second)
rate(sockudo_new_connections_total[5m])

# Connections by app
sockudo_connected by (app_id)
```

#### 2. Message Throughput
```promql
# Messages sent rate
rate(sockudo_ws_messages_sent_total[5m])

# Messages received rate
rate(sockudo_ws_messages_received_total[5m])

# Bytes transmitted rate
rate(sockudo_socket_transmitted_bytes[5m])

# Bytes received rate
rate(sockudo_socket_received_bytes[5m])
```

#### 3. HTTP API Performance
```promql
# HTTP API calls rate
rate(sockudo_http_calls_received_total[5m])

# HTTP bytes received rate
rate(sockudo_http_received_bytes[5m])

# HTTP bytes transmitted rate
rate(sockudo_http_transmitted_bytes[5m])
```

#### 4. Channel Activity
```promql
# Active channels
sockudo_active_channels

# Subscription rate
rate(sockudo_channel_subscriptions_total[5m])

# Channel activity by type
sockudo_active_channels by (channel_type)
```

#### 5. System Health
```promql
# Rate limit triggers
rate(sockudo_rate_limit_triggered_total[5m])

# Horizontal adapter resolve time
histogram_quantile(0.95, rate(sockudo_horizontal_adapter_resolve_time_bucket[5m]))

# Horizontal adapter operations
rate(sockudo_horizontal_adapter_sent_requests[5m])
rate(sockudo_horizontal_adapter_received_requests[5m])
```

#### 6. Broadcast Performance (v2.6.1+)
```promql
# Broadcast latency percentiles by recipient count
histogram_quantile(0.50, rate(sockudo_broadcast_latency_ms_bucket[5m])) by (recipient_count_bucket)
histogram_quantile(0.95, rate(sockudo_broadcast_latency_ms_bucket[5m])) by (recipient_count_bucket)
histogram_quantile(0.99, rate(sockudo_broadcast_latency_ms_bucket[5m])) by (recipient_count_bucket)

# Average broadcast latency by channel type
rate(sockudo_broadcast_latency_ms_sum[5m]) / rate(sockudo_broadcast_latency_ms_count[5m]) by (channel_type)

# Broadcast latency distribution heatmap
rate(sockudo_broadcast_latency_ms_bucket[5m])

# Broadcast performance by size category
histogram_quantile(0.95, rate(sockudo_broadcast_latency_ms_bucket{recipient_count_bucket="xs"}[5m]))
histogram_quantile(0.95, rate(sockudo_broadcast_latency_ms_bucket{recipient_count_bucket="md"}[5m]))
histogram_quantile(0.95, rate(sockudo_broadcast_latency_ms_bucket{recipient_count_bucket="xl"}[5m]))
```

### Sample Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Sockudo Metrics",
    "panels": [
      {
        "title": "Active Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "sockudo_connected",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Message Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(sockudo_ws_messages_sent_total[5m])",
            "legendFormat": "Sent"
          },
          {
            "expr": "rate(sockudo_ws_messages_received_total[5m])",
            "legendFormat": "Received"
          }
        ]
      },
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(sockudo_http_calls_received_total[5m])",
            "legendFormat": "API Calls"
          },
          {
            "expr": "rate(sockudo_http_received_bytes[5m])",
            "legendFormat": "Bytes In"
          },
          {
            "expr": "rate(sockudo_http_transmitted_bytes[5m])",
            "legendFormat": "Bytes Out"
          }
        ]
      },
      {
        "title": "Broadcast Latency by Size (v2.6.1+)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(sockudo_broadcast_latency_ms_bucket[5m])) by (recipient_count_bucket)",
            "legendFormat": "{{recipient_count_bucket}} (p95)"
          }
        ]
      }
    ]
  }
}
```

## Alerting Rules

### Prometheus Alerting Rules

Create an `alerts.yml` file:

```yaml
groups:
  - name: sockudo_alerts
    rules:
      # Connection Alerts
      - alert: SockudoHighConnectionCount
        expr: sockudo_connected > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High connection count on {{ $labels.instance }}"
          description: "Sockudo instance {{ $labels.instance }} has {{ $value }} active connections"

      - alert: SockudoConnectionDrops
        expr: rate(sockudo_new_disconnections_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High connection drop rate on {{ $labels.instance }}"
          description: "Connection drop rate is {{ $value }} per second"

      # Performance Alerts

      # System Health Alerts
      - alert: SockudoInstanceDown
        expr: up{job="sockudo"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Sockudo instance down"
          description: "Instance {{ $labels.instance }} is not responding"

      - alert: SockudoRateLimitTriggered
        expr: rate(sockudo_rate_limit_triggered_total[5m]) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit triggers on {{ $labels.instance }}"
          description: "Rate limits are being triggered {{ $value }} times per second"

      # Horizontal Adapter Alerts
      - alert: SockudoHighAdapterLatency
        expr: histogram_quantile(0.95, rate(sockudo_horizontal_adapter_resolve_time_bucket[5m])) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High horizontal adapter latency on {{ $labels.instance }}"
          description: "95th percentile adapter resolve time is {{ $value }}ms"

      # Broadcast Performance Alerts (v2.6.1+)
      - alert: SockudoHighBroadcastLatency
        expr: histogram_quantile(0.95, rate(sockudo_broadcast_latency_ms_bucket[5m])) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High broadcast latency on {{ $labels.instance }}"
          description: "95th percentile broadcast latency is {{ $value }}ms for {{ $labels.recipient_count_bucket }} recipient bucket"

      - alert: SockudoVeryHighBroadcastLatency
        expr: histogram_quantile(0.99, rate(sockudo_broadcast_latency_ms_bucket[5m])) > 500
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical broadcast latency on {{ $labels.instance }}"
          description: "99th percentile broadcast latency is {{ $value }}ms for {{ $labels.recipient_count_bucket }} recipient bucket"
```

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourcompany.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@yourcompany.com'
        subject: 'Sockudo Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'Sockudo Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Logging and Log Aggregation

### Structured Logging

Configure Sockudo for structured logging:

```json
{
  "debug": false,
  "log_format": "json"
}
```

**Environment Variables:**
```bash
LOG_FORMAT=json
LOG_LEVEL=info
```

### Log Aggregation with ELK Stack

#### Filebeat Configuration

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/sockudo/*.log
  fields:
    service: sockudo
    environment: production
  fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "sockudo-logs-%{+yyyy.MM.dd}"

setup.template:
  name: "sockudo-logs"
  pattern: "sockudo-logs-*"
```

#### Logstash Configuration

```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [service] == "sockudo" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    mutate {
      add_field => { "[@metadata][index]" => "sockudo-logs-%{+YYYY.MM.dd}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index]}"
  }
}
```

### Log Queries and Dashboards

#### Common Log Queries (Kibana/Elasticsearch)

```json
// Error logs
{
  "query": {
    "bool": {
      "must": [
        {"term": {"service": "sockudo"}},
        {"term": {"level": "ERROR"}}
      ],
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "now-1h"
          }
        }
      }
    }
  }
}

// Connection events
{
  "query": {
    "bool": {
      "must": [
        {"term": {"service": "sockudo"}},
        {"wildcard": {"message": "*connection*"}}
      ]
    }
  }
}

// Authentication failures
{
  "query": {
    "bool": {
      "must": [
        {"term": {"service": "sockudo"}},
        {"match": {"message": "authentication failed"}}
      ]
    }
  }
}
```

## Performance Monitoring

### System Resource Monitoring

Use node_exporter with Prometheus to monitor system resources:

```yaml
# Add to docker-compose.yml
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points'
      - '^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/aufs)($|/)'
```

### Key System Metrics

```promql
# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Network I/O
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])

# File descriptors
node_filefd_allocated / node_filefd_maximum * 100
```

## Best Practices

### Monitoring Strategy

1. **Start with key metrics**: Focus on connection count, message rates, and error rates
2. **Set meaningful thresholds**: Base alerts on your actual usage patterns
3. **Use percentiles**: Monitor 95th and 99th percentiles for latency metrics
4. **Monitor trends**: Look for gradual changes that might indicate issues

### Alert Fatigue Prevention

1. **Tune alert thresholds**: Avoid false positives
2. **Use appropriate time windows**: Don't alert on brief spikes
3. **Group related alerts**: Use alert grouping in Alertmanager
4. **Regular review**: Periodically review and adjust alert rules

### Dashboard Design

1. **Hierarchy of dashboards**: Overview → Detailed → Troubleshooting
2. **Consistent time ranges**: Use standard time ranges across panels
3. **Meaningful legends**: Use clear, descriptive legend formats
4. **Color coding**: Use consistent colors for similar metrics

### Data Retention

1. **Metrics retention**: Configure appropriate retention for Prometheus
2. **Log retention**: Set up log rotation and archival policies
3. **Historical analysis**: Keep enough history for trend analysis
4. **Storage costs**: Balance retention needs with storage costs

By implementing comprehensive monitoring with Prometheus, Grafana, and proper alerting, you can ensure your Sockudo deployment remains healthy, performant, and reliable in production environments.
