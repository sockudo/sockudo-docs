# Troubleshooting Guide

This guide provides solutions and diagnostic steps for common issues you might encounter while setting up or running Sockudo.

## Enabling Debug Mode

The first step in troubleshooting is often to get more detailed logs from Sockudo. You can enable debug mode in two ways:

### Via `config.json`
Set the `debug` option to `true`:
```json
{
  "debug": true
}
```

### Via Environment Variable
Set the `DEBUG` environment variable:
```bash
export DEBUG=true
./target/release/sockudo
```

When debug mode is enabled, Sockudo will output more verbose logs, which can provide valuable clues about the problem.

## Viewing Logs

How you view logs depends on how you're running Sockudo:

### Direct Execution
Logs will be printed to `stdout` and `stderr` in your terminal.

### systemd Service
If running as a `systemd` service (recommended for production):
```bash
sudo journalctl -u sockudo.service          # View all logs for the service
sudo journalctl -u sockudo.service -f       # Follow new logs in real-time
sudo journalctl -u sockudo.service -n 100   # View the last 100 log lines
sudo journalctl -u sockudo.service --since "1 hour ago" # Logs from the last hour
```

### Docker
If running in Docker:
```bash
docker logs <container_name_or_id>
docker logs -f <container_name_or_id>  # Follow logs
docker-compose logs sockudo
docker-compose logs -f sockudo         # Follow logs
```

### Docker Compose
```bash
docker-compose logs sockudo
docker-compose logs -f sockudo --tail=100
```

Look for error messages (often prefixed with `ERROR` or `WARN`), stack traces, or any unusual activity.

## Common Issues and Solutions

### 1. Connection Refused / Server Not Reachable

**Symptom**: Clients (Laravel Echo, Pusher JS) cannot connect to Sockudo. Browsers show "connection refused" or timeout errors.

**Possible Causes & Solutions**:

#### Sockudo Not Running
```bash
# Check if Sockudo process is running
ps aux | grep sockudo
systemctl status sockudo.service  # If using systemd
docker ps | grep sockudo          # If using Docker
```

#### Incorrect Host/Port Configuration
```bash
# Check current configuration
curl http://localhost:6001/usage

# Verify configuration matches client settings
# Client must use same host:port as configured in Sockudo
```

**Common fixes**:
- Ensure `host` is set to `"0.0.0.0"` for external access (not `"127.0.0.1"`)
- Verify `port` matches what clients are trying to connect to
- Check if port is already in use: `netstat -tuln | grep 6001`

#### Firewall Issues
```bash
# Check if firewall is blocking the port
sudo ufw status                    # Ubuntu/Debian
sudo firewall-cmd --list-all      # CentOS/RHEL

# Allow port through firewall
sudo ufw allow 6001               # Ubuntu/Debian
sudo firewall-cmd --add-port=6001/tcp --permanent  # CentOS/RHEL
```

#### Docker Network Issues
```bash
# Check if container is properly exposing ports
docker port <container_name>

# Verify Docker network configuration
docker network ls
docker network inspect <network_name>
```

### 2. SSL/TLS Issues

**Symptom**: Clients cannot connect when SSL is enabled, or certificate errors occur.

#### Certificate File Issues
```bash
# Check if certificate files exist and are readable
ls -la /etc/ssl/certs/sockudo.crt
ls -la /etc/ssl/private/sockudo.key

# Test certificate validity
openssl x509 -in /etc/ssl/certs/sockudo.crt -text -noout

# Verify private key
openssl rsa -in /etc/ssl/private/sockudo.key -check

# Check if certificate and key match
openssl x509 -noout -modulus -in /etc/ssl/certs/sockudo.crt | md5sum
openssl rsa -noout -modulus -in /etc/ssl/private/sockudo.key | md5sum
# Should produce identical hashes
```

#### SSL Configuration Problems
```bash
# Test SSL connection
openssl s_client -connect localhost:6001 -servername localhost

# Test with curl
curl -k https://localhost:6001/usage  # -k ignores certificate errors
```

**Common fixes**:
- Ensure certificate files have correct permissions (644 for cert, 600 for key)
- Verify certificate chain is complete
- Check that SSL paths in config are correct
- Ensure certificate is not expired

### 3. Authentication Failures (4xx Errors for Private/Presence Channels)

**Symptom**: Clients fail to subscribe to private or presence channels with 401, 403, or other 4xx errors.

#### App Credentials Mismatch
```bash
# Check configured apps
curl http://localhost:6001/usage  # Shows basic server info

# Verify app configuration in config.json or database
# Ensure client app_key matches server app configuration
```

#### Auth Endpoint Issues
The authentication endpoint (typically `/pusher/auth` or `/broadcasting/auth`) must:
- Be accessible from the client
- Return proper JSON response with auth signature
- Use the correct app secret for signing

**Debug auth endpoint**:
```bash
# Test auth endpoint directly
curl -X POST http://your-app.com/pusher/auth \
  -d "socket_id=123.456&channel_name=private-test" \
  -H "Cookie: your-session-cookie"
```

#### CORS Issues with Auth Endpoint
```bash
# Test CORS headers
curl -H "Origin: https://your-frontend.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://your-app.com/pusher/auth
```

### 4. Redis Connection Issues

**Symptom**: Sockudo fails to start or logs Redis connection errors when using Redis for adapter, cache, queue, or rate limiter.

#### Redis Server Issues
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Test connectivity
telnet redis-host 6379
```

#### Redis Configuration Problems
```bash
# Test Redis connection with auth (if password protected)
redis-cli -h redis-host -p 6379 -a your-password ping

# Check Redis configuration
redis-cli CONFIG GET '*'

# Monitor Redis operations
redis-cli MONITOR
```

**Common fixes**:
- Verify Redis URL format: `redis://[password@]host:port[/db]`
- Check network connectivity between Sockudo and Redis
- Ensure Redis password/auth is correctly configured
- Verify Redis is accepting connections from Sockudo's IP

### 5. High Resource Usage (CPU/Memory)

**Symptom**: Sockudo process consumes excessive CPU or memory.

#### Resource Monitoring
```bash
# Monitor resource usage
top -p $(pgrep sockudo)
htop  # Better interface

# Memory usage details
cat /proc/$(pgrep sockudo)/status | grep -i mem

# File descriptor usage
lsof -p $(pgrep sockudo) | wc -l
```

#### Common Causes
- **High connection volume**: Too many concurrent connections
- **Debug mode enabled**: Disable in production
- **Memory leaks**: Check for gradual memory increase
- **Inefficient client behavior**: Clients creating too many connections
- **Large message payloads**: Monitor message sizes

**Solutions**:
```json
{
  "debug": false,  // Disable in production
  "websocket_max_payload_kb": 32,  // Reduce if needed
  "rate_limiter": {
    "enabled": true,
    "api_rate_limit": {
      "max_requests": 50,  // Reduce if under attack
      "window_seconds": 60
    }
  }
}
```

### 6. Queue/Webhook Issues

**Symptom**: Webhooks not being sent, or queue jobs not processing.

#### Queue System Problems
```bash
# Check queue depth (Redis)
redis-cli LLEN sockudo_queue:default

# Monitor queue processing
redis-cli MONITOR | grep sockudo_queue

# SQS queue inspection (if using SQS)
aws sqs get-queue-attributes --queue-url YOUR_QUEUE_URL --attribute-names All
```

#### Webhook Endpoint Issues
```bash
# Test webhook endpoint manually
curl -X POST https://your-app.com/webhook/sockudo \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check endpoint accessibility
ping your-app.com
curl -I https://your-app.com/webhook/sockudo
```

### 7. Database Connection Issues (App Manager)

**Symptom**: Cannot load app configurations when using database-backed app manager.

#### MySQL/PostgreSQL Issues
```bash
# Test database connection
mysql -h mysql-host -u username -p database_name
psql -h postgres-host -U username -d database_name

# Check if table exists
mysql -e "DESCRIBE applications;" database_name
psql -c "\d applications" database_name
```

#### DynamoDB Issues
```bash
# Test AWS credentials and connectivity
aws dynamodb list-tables --region us-east-1

# Check specific table
aws dynamodb describe-table --table-name sockudo-applications --region us-east-1

# Test local DynamoDB (if using LocalStack)
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

### 8. Adapter/Scaling Issues

**Symptom**: Messages not being distributed across multiple Sockudo instances.

#### Adapter Connectivity
```bash
# Redis adapter - check pub/sub
redis-cli PSUBSCRIBE "sockudo_adapter:*"

# NATS adapter - check connectivity
nats pub test.subject "test message"
nats sub test.subject
```

#### Instance Communication
```bash
# Check if instances can reach adapter
# From each Sockudo instance:
redis-cli -h adapter-host ping  # For Redis adapter
nats-pub -s nats://nats-host:4222 test "message"  # For NATS adapter
```

## Debugging Tools and Commands

### Health Checks
```bash
# Basic server health
curl http://localhost:6001/usage

# App-specific health
curl http://localhost:6001/up/your-app-id

# Metrics endpoint
curl http://localhost:9601/metrics | head -20
```

### Network Diagnostics
```bash
# Check if port is listening
netstat -tuln | grep 6001
ss -tuln | grep 6001

# Test WebSocket connection
wscat -c ws://localhost:6001/app/your-app-key

# Test with SSL
wscat -c wss://localhost:6001/app/your-app-key
```

### Configuration Validation
```bash
# Validate JSON configuration
jq . config/config.json

# Check environment variables
printenv | grep -E "(REDIS|SOCKUDO|DEBUG|SSL)"

# Docker configuration check
docker-compose config
```

### Log Analysis
```bash
# Search for errors in logs
journalctl -u sockudo.service | grep -i error

# Filter for specific patterns
docker logs sockudo-container 2>&1 | grep "connection"

# Count error types
journalctl -u sockudo.service --since "1 hour ago" | grep ERROR | sort | uniq -c
```

## Performance Troubleshooting

### Connection Issues
```bash
# Monitor connection patterns
watch 'curl -s http://localhost:6001/usage'

# Check for connection leaks
netstat -an | grep :6001 | wc -l

# Monitor file descriptor usage
watch 'lsof -p $(pgrep sockudo) | wc -l'
```

### Message Flow Analysis
```bash
# Monitor metrics for message flow
curl http://localhost:9601/metrics | grep -E "(messages_sent|messages_received)"

# Check for message bottlenecks
redis-cli MONITOR | grep sockudo  # If using Redis adapter
```

### Memory Analysis
```bash
# Check for memory leaks
watch 'cat /proc/$(pgrep sockudo)/status | grep VmRSS'

# Monitor memory growth over time
while true; do
  echo "$(date): $(cat /proc/$(pgrep sockudo)/status | grep VmRSS)"
  sleep 60
done
```

## Getting Help

If you're unable to resolve an issue:

### Gather Information
Before seeking help, collect:
- Sockudo version or commit hash
- Complete configuration (with secrets redacted)
- Relevant log excerpts with debug mode enabled
- Steps to reproduce the issue
- Your environment details (OS, Docker version, etc.)
- Client library and version information

### Check Resources
1. **GitHub Issues**: [https://github.com/sockudo/sockudo/issues](https://github.com/sockudo/sockudo/issues)
2. **Documentation**: Review all relevant configuration guides
3. **Community Forums**: Check if others have faced similar issues

### Creating Bug Reports
When opening a GitHub issue:
- Use a descriptive title
- Provide complete reproduction steps
- Include configuration and log files
- Specify your environment details
- Mention any workarounds you've tried

### Emergency Procedures
For production issues:
1. **Immediate**: Switch to fallback/backup instance if available
2. **Short-term**: Disable problematic features (debug mode, specific adapters)
3. **Investigation**: Enable debug logging and collect detailed information
4. **Resolution**: Apply fixes and test in staging before production

## Prevention Strategies

### Monitoring and Alerting
Set up proper monitoring to catch issues early:
```yaml
# Prometheus alert example
- alert: SockudoHighErrorRate
  expr: rate(sockudo_errors_total[5m]) > 10
  for: 2m
  annotations:
    summary: "High error rate detected"
```

### Health Checks
Implement automated health checks:
```bash
#!/bin/bash
# health-check.sh

SOCKUDO_HOST="localhost"
SOCKUDO_PORT="6001"
APP_ID="your-app-id"

# Check if server is responding
if ! curl -f -s "http://${SOCKUDO_HOST}:${SOCKUDO_PORT}/usage" > /dev/null; then
    echo "CRITICAL: Sockudo server not responding"
    exit 2
fi

# Check app health
if ! curl -f -s "http://${SOCKUDO_HOST}:${SOCKUDO_PORT}/up/${APP_ID}" > /dev/null; then
    echo "WARNING: App ${APP_ID} not healthy"
    exit 1
fi

# Check metrics endpoint
if ! curl -f -s "http://${SOCKUDO_HOST}:9601/metrics" > /dev/null; then
    echo "WARNING: Metrics endpoint not responding"
    exit 1
fi

echo "OK: All health checks passed"
exit 0
```

### Configuration Validation
```bash
#!/bin/bash
# validate-config.sh

CONFIG_FILE="config/config.json"

# Validate JSON syntax
if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo "ERROR: Invalid JSON in $CONFIG_FILE"
    exit 1
fi

# Check required fields
if ! jq -e '.host' "$CONFIG_FILE" >/dev/null; then
    echo "ERROR: Missing 'host' configuration"
    exit 1
fi

if ! jq -e '.port' "$CONFIG_FILE" >/dev/null; then
    echo "ERROR: Missing 'port' configuration"
    exit 1
fi

# Check SSL configuration if enabled
if jq -e '.ssl.enabled == true' "$CONFIG_FILE" >/dev/null; then
    CERT_PATH=$(jq -r '.ssl.cert_path' "$CONFIG_FILE")
    KEY_PATH=$(jq -r '.ssl.key_path' "$CONFIG_FILE")
    
    if [[ ! -f "$CERT_PATH" ]]; then
        echo "ERROR: SSL certificate not found: $CERT_PATH"
        exit 1
    fi
    
    if [[ ! -f "$KEY_PATH" ]]; then
        echo "ERROR: SSL private key not found: $KEY_PATH"
        exit 1
    fi
fi

echo "Configuration validation passed"
```

### Regular Maintenance
```bash
#!/bin/bash
# maintenance.sh

echo "Starting Sockudo maintenance tasks..."

# Check log file sizes
LOG_DIR="/var/log/sockudo"
if [[ -d "$LOG_DIR" ]]; then
    find "$LOG_DIR" -name "*.log" -size +100M -exec echo "Large log file: {}" \;
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 80 ]]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f%%\n", $3*100/$2}' | sed 's/%//')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "WARNING: Memory usage is ${MEM_USAGE}%"
fi

# Check SSL certificate expiration
if [[ -f "/etc/ssl/certs/sockudo.crt" ]]; then
    DAYS_UNTIL_EXPIRY=$(openssl x509 -in /etc/ssl/certs/sockudo.crt -noout -checkend 2592000 && echo "30+" || echo "< 30")
    if [[ "$DAYS_UNTIL_EXPIRY" == "< 30" ]]; then
        echo "WARNING: SSL certificate expires in less than 30 days"
    fi
fi

echo "Maintenance tasks completed"
```

## Common Error Messages and Solutions

### "Address already in use"
```
Error: Address already in use (os error 98)
```
**Solution**: Another process is using the port. Find and stop it:
```bash
sudo lsof -i :6001
sudo kill -9 <PID>
# Or change Sockudo's port in configuration
```

### "Permission denied"
```
Error: Permission denied (os error 13)
```
**Solution**: File permission issues, usually with SSL certificates:
```bash
sudo chown sockudo:sockudo /etc/ssl/private/sockudo.key
sudo chmod 640 /etc/ssl/private/sockudo.key
```

### "Connection refused" (Redis)
```
Error: Connection refused (Redis)
```
**Solution**: Redis server not running or not accessible:
```bash
# Start Redis
sudo systemctl start redis
# Or check Redis URL configuration
```

### "No route to host"
```
Error: No route to host (os error 113)
```
**Solution**: Network connectivity issue:
```bash
# Check firewall rules
sudo iptables -L
# Check network connectivity
ping target-host
```

### "SSL handshake failed"
```
Error: SSL handshake failed
```
**Solution**: SSL certificate or configuration issues:
```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout
# Verify certificate chain
openssl verify -CAfile ca-bundle.crt cert.pem
```

### "Authentication failed"
```
Error: Authentication failed for channel subscription
```
**Solution**: Private/presence channel auth issues:
- Verify auth endpoint returns correct JSON format
- Check app secret matches between client and server
- Ensure auth endpoint is accessible and returns 200 status

### "Rate limit exceeded"
```
Error: Rate limit exceeded
```
**Solution**: Client hitting rate limits:
```json
{
  "rate_limiter": {
    "api_rate_limit": {
      "max_requests": 200,  // Increase if legitimate traffic
      "window_seconds": 60
    }
  }
}
```

## Debugging Specific Components

### WebSocket Connections
```bash
# Test WebSocket handshake
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: test" \
     http://localhost:6001/app/your-app-key

# Use wscat for interactive testing
wscat -c ws://localhost:6001/app/your-app-key
```

### Channel Subscriptions
```bash
# Test channel subscription via WebSocket
echo '{"event":"pusher:subscribe","data":{"channel":"test-channel"}}' | wscat -c ws://localhost:6001/app/your-app-key
```

### Event Publishing
```bash
# Test event publishing via HTTP API
curl -X POST "http://localhost:6001/apps/your-app-id/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-event",
    "channels": ["test-channel"],
    "data": {"message": "test"}
  }'
```

### Presence Channels
```bash
# Test presence channel subscription (requires auth)
# First get auth token from your auth endpoint, then:
echo '{
  "event":"pusher:subscribe",
  "data":{
    "channel":"presence-test",
    "auth":"your-auth-signature",
    "channel_data":"{\"user_id\":\"123\",\"user_info\":{\"name\":\"Test\"}}"
  }
}' | wscat -c ws://localhost:6001/app/your-app-key
```

## Performance Debugging

### Memory Profiling
```bash
# Monitor memory allocation patterns
valgrind --tool=massif ./target/release/sockudo

# Use heaptrack for detailed heap analysis
heaptrack ./target/release/sockudo
```

### CPU Profiling
```bash
# Use perf for CPU profiling
sudo perf record -g ./target/release/sockudo
sudo perf report

# Generate flame graphs
sudo perf record -F 99 -g -p $(pgrep sockudo) -- sleep 30
sudo perf script | flamegraph.pl > sockudo-flamegraph.svg
```

### Network Analysis
```bash
# Monitor network connections
netstat -an | grep :6001

# Capture network traffic
sudo tcpdump -i any port 6001 -w sockudo-traffic.pcap

# Analyze with Wireshark
wireshark sockudo-traffic.pcap
```

## Environment-Specific Issues

### Docker Issues
```bash
# Check container logs
docker logs sockudo-container --tail=100

# Execute commands inside container
docker exec -it sockudo-container /bin/bash

# Check resource limits
docker stats sockudo-container

# Inspect container configuration
docker inspect sockudo-container
```

### Kubernetes Issues
```bash
# Check pod status
kubectl get pods -l app=sockudo

# View pod logs
kubectl logs -f deployment/sockudo

# Describe pod for events
kubectl describe pod sockudo-pod-name

# Check service and ingress
kubectl get svc,ingress
```

### systemd Issues
```bash
# Check service status
systemctl status sockudo.service

# View service configuration
systemctl cat sockudo.service

# Check for failed starts
journalctl -u sockudo.service --since today --grep "Failed"

# Reload service configuration
sudo systemctl daemon-reload
sudo systemctl restart sockudo.service
```

By following this troubleshooting guide and using the provided diagnostic commands, you should be able to identify and resolve most common issues with Sockudo. Remember to always check the logs first and enable debug mode when investigating problems.
