# Deployment Guide

This guide provides recommendations and strategies for deploying your Sockudo server to a production environment, covering everything from building and containerization to scaling and security best practices.

## Building for Production

Always compile Sockudo in release mode for production deployments to ensure optimal performance and smaller binary size:

```bash
cargo build --release
```

The executable will be located at `target/release/sockudo`.

### Performance Optimizations

Starting from version 2.7.3, Sockudo uses **mimalloc** as its memory allocator, providing platform-optimized memory allocation with improved performance characteristics:

- **Reduced memory fragmentation** across long-running deployments
- **Better multi-threaded performance** for concurrent connections
- **Lower memory overhead** compared to standard allocators
- **Automatic platform optimization** for different architectures

This memory allocator is automatically included in release builds and requires no additional configuration.

### Cross-Compilation

For different target architectures:

```bash
# Install target
rustup target add x86_64-unknown-linux-musl

# Build for musl (static linking)
cargo build --release --target x86_64-unknown-linux-musl

# For ARM64 (e.g., AWS Graviton)
rustup target add aarch64-unknown-linux-gnu
cargo build --release --target aarch64-unknown-linux-gnu
```

## Docker Deployment

### Production Dockerfile

Create an optimized Dockerfile for production:

```dockerfile
# Multi-stage build for optimized production image
FROM rust:1.75-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/sockudo

# Copy source code
COPY . .

# Build release binary
RUN cargo build --release

# Runtime stage
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system sockudo && \
    useradd --system --no-log-init -g sockudo sockudo

# Create directories
RUN mkdir -p /app/config /app/ssl /app/logs && \
    chown -R sockudo:sockudo /app

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /usr/src/sockudo/target/release/sockudo .
COPY --from=builder /usr/src/sockudo/config/config.json ./config/

# Set ownership and permissions
RUN chown sockudo:sockudo ./sockudo && \
    chmod +x ./sockudo

# Switch to non-root user
USER sockudo

# Expose ports
EXPOSE 6001 9601

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:6001/usage || exit 1

# Default command
CMD ["./sockudo", "--config=./config/config.json"]
```

### Docker Compose for Production

```yaml
version: '3.8'

services:
  sockudo:
    image: sockudo/sockudo:latest
    restart: unless-stopped
    ports:
      - "6001:6001"
      - "9601:9601"
    environment:
      - DEBUG=false
      - ADAPTER_DRIVER=redis
      - REDIS_URL=redis://redis:6379/0
      - APP_MANAGER_DRIVER=mysql
      - DATABASE_MYSQL_HOST=mysql
      - DATABASE_MYSQL_USER=sockudo
      - DATABASE_MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - DATABASE_MYSQL_DATABASE=sockudo
      - CACHE_DRIVER=redis
      - QUEUE_DRIVER=redis
      - METRICS_ENABLED=true
      - SSL_ENABLED=${SSL_ENABLED:-false}
    volumes:
      - ./config:/app/config:ro
      - ./ssl:/app/ssl:ro
      - sockudo_logs:/app/logs
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sockudo_network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.5'

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - sockudo_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  mysql:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=sockudo
      - MYSQL_USER=sockudo
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
    networks:
      - sockudo_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - sockudo
    networks:
      - sockudo_network

  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - sockudo_network

volumes:
  redis_data:
  mysql_data:
  prometheus_data:
  sockudo_logs:

networks:
  sockudo_network:
    driver: bridge
```

### Environment Configuration

Create a `.env` file for production:

```bash
# .env.production
MYSQL_ROOT_PASSWORD=secure_root_password_here
MYSQL_PASSWORD=secure_sockudo_password_here
SSL_ENABLED=true

# Redis Configuration
REDIS_PASSWORD=secure_redis_password

# Security
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CORS_CREDENTIALS=true

# Performance
DATABASE_CONNECTION_POOL_SIZE=15
REDIS_CONNECTION_POOL_SIZE=10

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info

# Instance identification
INSTANCE_PROCESS_ID=sockudo-prod-01
```

## Kubernetes Deployment

### Basic Deployment

```yaml
# sockudo-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sockudo
  labels:
    app: sockudo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sockudo
  template:
    metadata:
      labels:
        app: sockudo
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9601"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: sockudo
        image: sockudo/sockudo:latest
        ports:
        - containerPort: 6001
          name: websocket
        - containerPort: 9601
          name: metrics
        env:
        - name: ADAPTER_DRIVER
          value: "redis"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: APP_MANAGER_DRIVER
          value: "mysql"
        - name: DATABASE_MYSQL_HOST
          value: "mysql-service"
        - name: DATABASE_MYSQL_USER
          value: "sockudo"
        - name: DATABASE_MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        - name: INSTANCE_PROCESS_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /usage
            port: 6001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /usage
            port: 6001
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: ssl-certs
          mountPath: /app/ssl
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: sockudo-config
      - name: ssl-certs
        secret:
          secretName: sockudo-ssl
---
apiVersion: v1
kind: Service
metadata:
  name: sockudo-service
spec:
  selector:
    app: sockudo
  ports:
  - name: websocket
    port: 6001
    targetPort: 6001
  - name: metrics
    port: 9601
    targetPort: 9601
  type: LoadBalancer
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: sockudo-config
data:
  config.json: |
    {
      "debug": false,
      "host": "0.0.0.0",
      "port": 6001,
      "metrics": {
        "enabled": true,
        "port": 9601
      },
      "ssl": {
        "enabled": true,
        "cert_path": "/app/ssl/tls.crt",
        "key_path": "/app/ssl/tls.key"
      }
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
data:
  password: <base64-encoded-password>
---
apiVersion: v1
kind: Secret
metadata:
  name: sockudo-ssl
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-certificate>
  tls.key: <base64-encoded-private-key>
```

### Horizontal Pod Autoscaler

```yaml
# sockudo-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sockudo-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sockudo
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: sockudo_active_connections
      target:
        type: AverageValue
        averageValue: "1000"
```

### Ingress Configuration

```yaml
# sockudo-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sockudo-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-read-timeout: "86400"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "86400"
    nginx.ingress.kubernetes.io/websocket-services: "sockudo-service"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - sockudo.yourdomain.com
    secretName: sockudo-tls
  rules:
  - host: sockudo.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sockudo-service
            port:
              number: 6001
```

## systemd Service Deployment

### Service Configuration

Create `/etc/systemd/system/sockudo.service`:

```ini
[Unit]
Description=Sockudo WebSocket Server
After=network.target
Wants=redis.service mysql.service
After=redis.service mysql.service

[Service]
Type=simple
User=sockudo
Group=sockudo
WorkingDirectory=/opt/sockudo
ExecStart=/opt/sockudo/sockudo --config=/opt/sockudo/config/config.json
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sockudo

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/sockudo/logs
ReadOnlyPaths=/opt/sockudo/config

# Resource limits
LimitNOFILE=65536
MemoryMax=1G

# Environment
Environment=RUST_LOG=info
EnvironmentFile=-/etc/sockudo/sockudo.env

[Install]
WantedBy=multi-user.target
```

### Installation Script

```bash
#!/bin/bash
# install-sockudo.sh

set -e

SOCKUDO_USER="sockudo"
SOCKUDO_GROUP="sockudo"
SOCKUDO_HOME="/opt/sockudo"
BINARY_PATH="./target/release/sockudo"
CONFIG_PATH="./config/config.json"

echo "Installing Sockudo..."

# Create user and group
if ! id "$SOCKUDO_USER" &>/dev/null; then
    sudo groupadd "$SOCKUDO_GROUP"
    sudo useradd -r -g "$SOCKUDO_GROUP" -d "$SOCKUDO_HOME" -s /sbin/nologin "$SOCKUDO_USER"
    echo "Created user $SOCKUDO_USER"
fi

# Create directories
sudo mkdir -p "$SOCKUDO_HOME"/{config,ssl,logs}
sudo chown -R "$SOCKUDO_USER:$SOCKUDO_GROUP" "$SOCKUDO_HOME"

# Install binary
sudo cp "$BINARY_PATH" "$SOCKUDO_HOME/"
sudo chown "$SOCKUDO_USER:$SOCKUDO_GROUP" "$SOCKUDO_HOME/sockudo"
sudo chmod +x "$SOCKUDO_HOME/sockudo"

# Install configuration
sudo cp "$CONFIG_PATH" "$SOCKUDO_HOME/config/"
sudo chown "$SOCKUDO_USER:$SOCKUDO_GROUP" "$SOCKUDO_HOME/config/config.json"

# Install systemd service
sudo cp sockudo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sockudo.service

echo "Installation complete!"
echo "Start the service with: sudo systemctl start sockudo"
echo "Check status with: sudo systemctl status sockudo"
```

## Load Balancer Configuration

### Nginx Load Balancer

```nginx
# /etc/nginx/sites-available/sockudo
upstream sockudo_backend {
    least_conn;
    server sockudo-1.internal:6001 max_fails=3 fail_timeout=30s weight=1;
    server sockudo-2.internal:6001 max_fails=3 fail_timeout=30s weight=1;
    server sockudo-3.internal:6001 max_fails=3 fail_timeout=30s weight=1;
    keepalive 32;
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=sockudo_api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=sockudo_ws:10m rate=5r/s;

server {
    listen 80;
    server_name sockudo.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sockudo.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/sockudo.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sockudo.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # WebSocket and API endpoints
    location / {
        # Apply rate limiting based on path
        if ($request_uri ~ "^/app/") {
            limit_req zone=sockudo_ws burst=10 nodelay;
        }
        if ($request_uri ~ "^/apps/.*/events") {
            limit_req zone=sockudo_api burst=20 nodelay;
        }

        proxy_pass http://sockudo_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket specific settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 86400s;
        proxy_read_timeout 86400s;
        proxy_buffering off;
        proxy_cache off;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        
        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # Health check endpoint (no rate limiting)
    location = /health {
        access_log off;
        proxy_pass http://sockudo_backend/usage;
        proxy_set_header Host $host;
    }

    # Metrics endpoint (restricted access)
    location /metrics {
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        
        proxy_pass http://sockudo_backend:9601/metrics;
        proxy_set_header Host $host;
    }
}
```

### HAProxy Configuration

```haproxy
# /etc/haproxy/haproxy.cfg
global
    log stdout local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option redispatch
    timeout connect 5000
    timeout client 86400000  # Long timeout for WebSockets
    timeout server 86400000  # Long timeout for WebSockets
    
frontend sockudo_frontend
    bind *:443 ssl crt /etc/ssl/certs/sockudo.pem
    bind *:80
    redirect scheme https if !{ ssl_fc }
    
    # ACLs
    acl is_websocket hdr_beg(Upgrade) -i websocket
    acl is_api path_beg /apps/
    acl is_health path /health /usage
    
    # Route to backend
    use_backend sockudo_backend
    
backend sockudo_backend
    balance leastconn
    option httpchk GET /usage
    http-check expect status 200
    
    # Servers
    server sockudo1 sockudo-1.internal:6001 check inter 5s rise 2 fall 3 maxconn 1000
    server sockudo2 sockudo-2.internal:6001 check inter 5s rise 2 fall 3 maxconn 1000
    server sockudo3 sockudo-3.internal:6001 check inter 5s rise 2 fall 3 maxconn 1000
```

## Security Best Practices

### Network Security

```bash
# Firewall configuration (UFW example)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port as needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS for load balancer
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Sockudo port only from load balancer
sudo ufw allow from 10.0.1.100 to any port 6001

# Allow metrics port only from monitoring server
sudo ufw allow from 10.0.1.200 to any port 9601

# Allow Redis/MySQL ports only from Sockudo servers
sudo ufw allow from 10.0.1.0/24 to any port 6379  # Redis
sudo ufw allow from 10.0.1.0/24 to any port 3306  # MySQL

sudo ufw enable
```

### SSL/TLS Configuration

```bash
# Generate strong DH parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Set proper file permissions
sudo chmod 644 /etc/ssl/certs/sockudo.crt
sudo chmod 600 /etc/ssl/private/sockudo.key
sudo chown root:sockudo /etc/ssl/private/sockudo.key
```

### Application Security

```json
{
  "cors": {
    "credentials": true,
    "origin": ["https://yourdomain.com"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allowed_headers": ["Authorization", "Content-Type", "X-Requested-With"]
  },
  "rate_limiter": {
    "enabled": true,
    "driver": "redis",
    "api_rate_limit": {
      "max_requests": 100,
      "window_seconds": 60,
      "trust_hops": 1
    },
    "websocket_rate_limit": {
      "max_requests": 20,
      "window_seconds": 60
    }
  }
}
```

### Secret Management

```bash
# Using HashiCorp Vault
vault kv put secret/sockudo \
  mysql_password=secure_password \
  redis_password=secure_redis_password \
  app_secret=secure_app_secret

# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name "sockudo/production" \
  --description "Sockudo production secrets" \
  --secret-string '{"mysql_password":"secure_password","redis_password":"secure_redis_password"}'

# Using Kubernetes secrets
kubectl create secret generic sockudo-secrets \
  --from-literal=mysql-password=secure_password \
  --from-literal=redis-password=secure_redis_password
```

## Monitoring and Logging

### Log Management

```bash
# Logrotate configuration
# /etc/logrotate.d/sockudo
/var/log/sockudo/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 sockudo sockudo
    postrotate
        systemctl reload sockudo
    endscript
}

# Syslog configuration
# /etc/rsyslog.d/sockudo.conf
if $programname == 'sockudo' then /var/log/sockudo/sockudo.log
& stop
```

### Centralized Logging with ELK

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
    instance: ${HOSTNAME}
  fields_under_root: true
  multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
  multiline.negate: true
  multiline.match: after

output.logstash:
  hosts: ["logstash.internal:5044"]

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded
```

### Monitoring Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "sockudo-alerts.yml"

scrape_configs:
  - job_name: 'sockudo'
    static_configs:
      - targets:
        - 'sockudo-1.internal:9601'
        - 'sockudo-2.internal:9601'
        - 'sockudo-3.internal:9601'
    scrape_interval: 15s
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets:
        - 'sockudo-1.internal:9100'
        - 'sockudo-2.internal:9100'
        - 'sockudo-3.internal:9100'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager.internal:9093
```

## Backup and Disaster Recovery

### Database Backup

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backup/sockudo"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_HOST="mysql.internal"
MYSQL_USER="backup_user"
MYSQL_PASSWORD="backup_password"
DATABASE="sockudo"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# MySQL backup
mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --single-transaction --routines --triggers "$DATABASE" | \
  gzip > "$BACKUP_DIR/sockudo_${DATE}.sql.gz"

# Redis backup (if using Redis for app manager)
redis-cli --rdb "$BACKUP_DIR/redis_${DATE}.rdb"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/sockudo_${DATE}.sql.gz"
```

### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/backup/sockudo-config"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup configuration
tar -czf "$BACKUP_DIR/config_${DATE}.tar.gz" \
  /opt/sockudo/config/ \
  /etc/systemd/system/sockudo.service \
  /etc/nginx/sites-available/sockudo

# Backup SSL certificates
tar -czf "$BACKUP_DIR/ssl_${DATE}.tar.gz" \
  /etc/ssl/certs/sockudo.* \
  /etc/ssl/private/sockudo.*

echo "Configuration backup completed"
```

### Disaster Recovery Plan

```bash
#!/bin/bash
# disaster-recovery.sh

# 1. Deploy new infrastructure
# 2. Restore configuration
cd /backup/sockudo-config
latest_config=$(ls -t config_*.tar.gz | head -1)
tar -xzf "$latest_config" -C /

# 3. Restore database
cd /backup/sockudo
latest_db=$(ls -t sockudo_*.sql.gz | head -1)
gunzip -c "$latest_db" | mysql -h mysql.internal -u sockudo -p sockudo

# 4. Start services
systemctl start sockudo
systemctl enable sockudo

# 5. Verify recovery
curl http://localhost:6001/usage
```

## Performance Optimization

### System Tuning

```bash
# /etc/sysctl.d/99-sockudo.conf
# Network optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10

# File descriptor limits
fs.file-max = 1000000

# Apply changes
sudo sysctl -p /etc/sysctl.d/99-sockudo.conf
```

```bash
# /etc/security/limits.d/sockudo.conf
sockudo soft nofile 65535
sockudo hard nofile 65535
sockudo soft nproc 32768
sockudo hard nproc 32768
```

### Application Tuning

```json
{
  "websocket_max_payload_kb": 32,
  "database_pooling": {
    "enabled": true,
    "min": 5,
    "max": 20
  },
  "cache": {
    "driver": "redis",
    "redis": {
      "prefix": "sockudo_cache:",
      "url_override": "redis://redis-cache.internal:6379/1"
    }
  },
  "queue": {
    "driver": "redis",
    "redis": {
      "concurrency": 10,
      "prefix": "sockudo_queue:",
      "url_override": "redis://redis-queue.internal:6379/2"
    }
  }
}
```

## Health Checks and Readiness

### Application Health Check

```bash
#!/bin/bash
# health-check.sh

SOCKUDO_URL="http://localhost:6001"
TIMEOUT=10

# Check main service
if ! curl -f -m $TIMEOUT "$SOCKUDO_URL/usage" >/dev/null 2>&1; then
    echo "CRITICAL: Sockudo service not responding"
    exit 2
fi

# Check metrics endpoint
if ! curl -f -m $TIMEOUT "http://localhost:9601/metrics" >/dev/null 2>&1; then
    echo "WARNING: Metrics endpoint not responding"
    exit 1
fi

# Check Redis connectivity (if using Redis)
if ! redis-cli ping >/dev/null 2>&1; then
    echo "WARNING: Redis not accessible"
    exit 1
fi

# Check database connectivity (if using MySQL)
if ! mysqladmin ping -h mysql.internal >/dev/null 2>&1; then
    echo "WARNING: MySQL not accessible"
    exit 1
fi

echo "OK: All health checks passed"
exit 0
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /usage
    port: 6001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /usage
    port: 6001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

## Deployment Automation

### CI/CD Pipeline (GitLab CI)

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: registry.gitlab.com/yourgroup/sockudo
  DOCKER_TAG: $CI_COMMIT_SHORT_SHA

test:
  stage: test
  image: rust:1.75
  script:
    - cargo test --release
  only:
    - main
    - merge_requests

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $DOCKER_REGISTRY:$DOCKER_TAG .
    - docker push $DOCKER_REGISTRY:$DOCKER_TAG
    - docker tag $DOCKER_REGISTRY:$DOCKER_TAG $DOCKER_REGISTRY:latest
    - docker push $DOCKER_REGISTRY:latest
  only:
    - main

deploy_staging:
  stage: deploy
  image: alpine/k8s:latest
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/sockudo sockudo=$DOCKER_REGISTRY:$DOCKER_TAG
    - kubectl rollout status deployment/sockudo
  environment:
    name: staging
    url: https://sockudo-staging.yourdomain.com
  only:
    - main

deploy_production:
  stage: deploy
  image: alpine/k8s:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/sockudo sockudo=$DOCKER_REGISTRY:$DOCKER_TAG
    - kubectl rollout status deployment/sockudo
  environment:
    name: production
    url: https://sockudo.yourdomain.com
  when: manual
  only:
    - main
```

### Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

NEW_VERSION="$1"
CURRENT_COLOR=$(kubectl get service sockudo-service -o jsonpath='{.spec.selector.color}')

if [ "$CURRENT_COLOR" = "blue" ]; then
    NEW_COLOR="green"
else
    NEW_COLOR="blue"
fi

echo "Deploying version $NEW_VERSION to $NEW_COLOR environment"

# Update deployment
kubectl set image deployment/sockudo-$NEW_COLOR sockudo=sockudo/sockudo:$NEW_VERSION

# Wait for rollout
kubectl rollout status deployment/sockudo-$NEW_COLOR

# Run health checks
./health-check.sh http://sockudo-$NEW_COLOR.internal:6001

# Switch traffic
kubectl patch service sockudo-service -p '{"spec":{"selector":{"color":"'$NEW_COLOR'"}}}'

echo "Deployment complete. Traffic switched to $NEW_COLOR"
echo "Previous $CURRENT_COLOR environment is still running for rollback"
```

## Troubleshooting Production Issues

### Emergency Response

```bash
#!/bin/bash
# emergency-response.sh

case "$1" in
    "high-load")
        # Scale up quickly
        kubectl scale deployment sockudo --replicas=10
        ;;
    "memory-leak")
        # Rolling restart
        kubectl rollout restart deployment/sockudo
        ;;
    "redis-down")
        # Switch to local adapter temporarily
        kubectl set env deployment/sockudo ADAPTER_DRIVER=local
        ;;
    "rollback")
        # Rollback to previous version
        kubectl rollout undo deployment/sockudo
        ;;
    *)
        echo "Usage: $0 {high-load|memory-leak|redis-down|rollback}"
        exit 1
        ;;
esac
```

### Performance Monitoring

```bash
#!/bin/bash
# performance-monitor.sh

echo "=== Sockudo Performance Report ==="
echo "Date: $(date)"
echo

# Connection count
CONNECTIONS=$(curl -s http://localhost:9601/metrics | grep sockudo_active_connections | tail -1 | awk '{print $2}')
echo "Active Connections: $CONNECTIONS"

# Memory usage
MEMORY=$(ps -o rss= -p $(pgrep sockudo) | awk '{print $1/1024 " MB"}')
echo "Memory Usage: $MEMORY"

# CPU usage
CPU=$(ps -o %cpu= -p $(pgrep sockudo))
echo "CPU Usage: $CPU%"

# Network connections
NETWORK_CONN=$(netstat -an | grep :6001 | wc -l)
echo "Network Connections: $NETWORK_CONN"

# Redis info (if applicable)
if command -v redis-cli >/dev/null; then
    REDIS_MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    echo "Redis Memory: $REDIS_MEMORY"
fi

echo "================================"
```

This comprehensive deployment guide covers all aspects of running Sockudo in production, from basic setup to advanced scaling and monitoring strategies. Adapt the configurations and scripts to match your specific infrastructure and requirements.