# SSL/TLS Configuration

To secure WebSocket connections using `wss://` (WebSocket Secure), you need to configure Sockudo with an SSL/TLS certificate. This encrypts the data transmitted between clients and your Sockudo server, protecting it from eavesdropping and tampering.

## When to Use SSL/TLS

It is **highly recommended** to use SSL/TLS for all production deployments of Sockudo. Unencrypted `ws://` connections are vulnerable and should only be used for local development or in trusted network environments where traffic is otherwise secured.

Browsers also enforce stricter rules for `wss://`, often requiring it for features like Service Workers or when the main page is served over `https://`.

## Configuration in `config.json`

SSL/TLS settings are configured via the `ssl` object within your `config.json`. The WebSocket server will automatically use `wss://` if SSL is enabled.

```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/sockudo/certs/fullchain.pem",
    "key_path": "/etc/sockudo/certs/privkey.pem",
    "passphrase": null,
    "ca_path": null,
    "redirect_http": true,
    "http_port": 80
  },
  "port": 6001
}
```

## SSL Configuration Options

### `ssl.enabled`
* **JSON Key**: `enabled`
* **Environment Variable**: `SSL_ENABLED` (Set to `true` or `1`)
* **Type**: `boolean`
* **Description**: Enables or disables SSL/TLS. If `true`, you must provide paths to your certificate and private key.
* **Default Value**: `false`

### `ssl.cert_path`
* **JSON Key**: `cert_path`
* **Environment Variable**: `SSL_CERT_PATH`
* **Type**: `string`
* **Description**: The absolute or relative path to your SSL certificate file. This is typically a PEM-encoded file containing the server's certificate, and potentially intermediate certificates.
* **Default Value**: `"/app/ssl/cert.pem"`
* **Required**: Yes, if `ssl.enabled` is `true`.

### `ssl.key_path`
* **JSON Key**: `key_path`
* **Environment Variable**: `SSL_KEY_PATH`
* **Type**: `string`
* **Description**: The absolute or relative path to your SSL private key file. This key must correspond to the certificate specified in `cert_path`.
* **Default Value**: `"/app/ssl/key.pem"`
* **Required**: Yes, if `ssl.enabled` is `true`.

### `ssl.passphrase`
* **JSON Key**: `passphrase`
* **Environment Variable**: `SSL_PASSPHRASE`
* **Type**: `string` (optional)
* **Description**: The passphrase for your SSL private key, if the key is encrypted. If your key is not encrypted, omit this option or set it to `null`.
* **Default Value**: `null` (None)

### `ssl.ca_path`
* **JSON Key**: `ca_path`
* **Environment Variable**: `SSL_CA_PATH`
* **Type**: `string` (optional)
* **Description**: Path to a file containing trusted CA certificates in PEM format. This can be used for features like client certificate authentication (mTLS).
* **Default Value**: `null` (None)

### `ssl.redirect_http`
* **JSON Key**: `redirect_http`
* **Environment Variable**: `SSL_REDIRECT_HTTP` (Set to `true` or `1`)
* **Type**: `boolean`
* **Description**: If `ssl.enabled` is `true`, setting this to `true` will also start a basic HTTP server on the port specified by `ssl.http_port`. This HTTP server will automatically redirect all incoming HTTP requests to their HTTPS equivalents.
* **Default Value**: `false`

### `ssl.http_port`
* **JSON Key**: `http_port`
* **Environment Variable**: `SSL_HTTP_PORT`
* **Type**: `integer` (u16, optional)
* **Description**: The port number for the HTTP redirect server if `ssl.redirect_http` is `true`.
* **Default Value**: `80`

## Example Configurations

### Basic SSL Configuration
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/sockudo.crt",
    "key_path": "/etc/ssl/private/sockudo.key"
  }
}
```

### SSL with HTTP Redirect
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/letsencrypt/live/yourdomain.com/fullchain.pem",
    "key_path": "/etc/letsencrypt/live/yourdomain.com/privkey.pem",
    "redirect_http": true,
    "http_port": 80
  }
}
```

### SSL with Encrypted Private Key
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/sockudo.crt",
    "key_path": "/etc/ssl/private/sockudo.key",
    "passphrase": "yourSecretPrivateKeyPassword"
  }
}
```

### SSL with Client Certificate Authentication
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/sockudo.crt",
    "key_path": "/etc/ssl/private/sockudo.key",
    "ca_path": "/etc/ssl/certs/ca-bundle.crt"
  }
}
```

## Environment Variable Configuration

```bash
export SSL_ENABLED=true
export SSL_CERT_PATH="/etc/ssl/certs/sockudo.crt"
export SSL_KEY_PATH="/etc/ssl/private/sockudo.key"
export SSL_REDIRECT_HTTP=true
export SSL_HTTP_PORT=80
```

## Obtaining SSL/TLS Certificates

### Let's Encrypt (Recommended for public servers)

Let's Encrypt provides free, automated SSL certificates. Use Certbot to obtain and manage certificates:

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate (HTTP challenge)
sudo certbot certonly --standalone -d yourdomain.com

# Certificate files will be located at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Configure automatic renewal:
```bash
# Add to crontab
sudo crontab -e

# Add line for automatic renewal (runs twice daily)
0 12 * * * /usr/bin/certbot renew --quiet
```

### Commercial Certificate Authorities

Purchase certificates from providers like:
- DigiCert
- Comodo
- GlobalSign
- GeoTrust

### Self-Signed Certificates (Development/Testing ONLY)

```bash
# Generate private key
openssl genpkey -algorithm RSA -out privkey.pem -pkeyopt rsa_keygen_bits:2048

# Generate certificate signing request
openssl req -new -key privkey.pem -out cert.csr
# Answer prompts - use "localhost" for Common Name if testing locally

# Generate self-signed certificate
openssl x509 -req -days 365 -in cert.csr -signkey privkey.pem -out fullchain.pem

# Clean up
rm cert.csr
```

**Warning**: Self-signed certificates will show security warnings in browsers and should never be used in production.

## Docker SSL Configuration

### Volume Mount for Certificates
```yaml
services:
  sockudo:
    image: sockudo/sockudo:latest
    ports:
      - "443:6001"
      - "80:80"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    environment:
      - SSL_ENABLED=true
      - SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
      - SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
      - SSL_REDIRECT_HTTP=true
```

### Using Docker Secrets
```yaml
version: '3.8'
services:
  sockudo:
    image: sockudo/sockudo:latest
    ports:
      - "443:6001"
    secrets:
      - ssl_cert
      - ssl_key
    environment:
      - SSL_ENABLED=true
      - SSL_CERT_PATH=/run/secrets/ssl_cert
      - SSL_KEY_PATH=/run/secrets/ssl_key

secrets:
  ssl_cert:
    file: ./ssl/cert.pem
  ssl_key:
    file: ./ssl/key.pem
```

## Reverse Proxy SSL Termination

In many production setups, you might terminate SSL/TLS at a reverse proxy and communicate with Sockudo over plain HTTP internally.

### Nginx SSL Termination Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 86400s;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }
}
```

With this setup, configure Sockudo without SSL:
```json
{
  "ssl": {
    "enabled": false
  },
  "host": "127.0.0.1",
  "port": 6001
}
```

### HAProxy SSL Termination Example

```
global
    ssl-default-bind-ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-options ssl-min-ver TLSv1.2

frontend sockudo_frontend
    bind *:443 ssl crt /etc/ssl/certs/sockudo.pem
    bind *:80
    redirect scheme https if !{ ssl_fc }
    default_backend sockudo_backend

backend sockudo_backend
    balance roundrobin
    option httpchk GET /usage
    server sockudo1 127.0.0.1:6001 check
    server sockudo2 127.0.0.1:6002 check
```

## SSL Certificate Management

### Certificate Monitoring

Monitor certificate expiration:
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/sockudo.crt -noout -dates

# Check certificate from remote server
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Automated Certificate Renewal

For Let's Encrypt with Certbot:
```bash
#!/bin/bash
# /etc/cron.daily/certbot-renew

# Renew certificates
/usr/bin/certbot renew --quiet

# Reload Sockudo if certificates were renewed
if [ $? -eq 0 ]; then
    # Send SIGHUP to reload certificates (if Sockudo supports it)
    # Or restart the service
    systemctl reload sockudo
fi
```

### Certificate Validation Script

```bash
#!/bin/bash
# validate-ssl.sh

DOMAIN="yourdomain.com"
PORT="6001"

# Check if certificate is valid
echo | openssl s_client -connect ${DOMAIN}:${PORT} -servername ${DOMAIN} 2>/dev/null | \
openssl x509 -noout -subject -issuer -dates

# Check certificate chain
echo | openssl s_client -connect ${DOMAIN}:${PORT} -servername ${DOMAIN} 2>/dev/null | \
openssl x509 -noout -text | grep -A1 "X509v3 Subject Alternative Name"
```

## Security Best Practices

### Certificate Security
1. **Keep private keys secure** with restrictive file permissions (600 or 640)
2. **Use strong key lengths** (2048-bit RSA minimum, 4096-bit recommended)
3. **Implement proper certificate chain** including intermediate certificates
4. **Monitor certificate expiration** and automate renewal

### SSL/TLS Configuration
1. **Disable weak protocols** (SSLv3, TLSv1.0, TLSv1.1)
2. **Use strong cipher suites** and prefer server cipher order
3. **Enable HTTP Strict Transport Security** (HSTS)
4. **Implement certificate transparency** monitoring

### File Permissions

```bash
# Set proper permissions for SSL files
sudo chown root:sockudo /etc/ssl/private/sockudo.key
sudo chmod 640 /etc/ssl/private/sockudo.key

sudo chown root:root /etc/ssl/certs/sockudo.crt
sudo chmod 644 /etc/ssl/certs/sockudo.crt
```

## Performance Considerations

### SSL Performance Optimization
1. **Use hardware acceleration** if available (AES-NI)
2. **Enable SSL session resumption**
3. **Use OCSP stapling** to reduce handshake time
4. **Consider TLS 1.3** for improved performance

### Load Balancing with SSL
When using multiple Sockudo instances with SSL:
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/shared/ssl/cert.pem",
    "key_path": "/shared/ssl/key.pem"
  }
}
```

Ensure certificates are accessible to all instances via shared storage.

## Troubleshooting SSL Issues

### Common Problems

#### Certificate Not Found
```bash
# Check if files exist and are readable
ls -la /etc/ssl/certs/sockudo.crt
ls -la /etc/ssl/private/sockudo.key

# Check file permissions
sudo -u sockudo cat /etc/ssl/private/sockudo.key
```

#### Certificate/Key Mismatch
```bash
# Compare certificate and key
openssl x509 -noout -modulus -in /etc/ssl/certs/sockudo.crt | md5sum
openssl rsa -noout -modulus -in /etc/ssl/private/sockudo.key | md5sum
# Should produce identical hashes
```

#### Certificate Chain Issues
```bash
# Verify certificate chain
openssl verify -CAfile /etc/ssl/certs/ca-bundle.crt /etc/ssl/certs/sockudo.crt

# Check certificate chain completeness
echo | openssl s_client -connect yourdomain.com:6001 -servername yourdomain.com
```

#### SSL Handshake Failures
```bash
# Test SSL connection
openssl s_client -connect localhost:6001 -servername localhost

# Test with specific TLS version
openssl s_client -connect localhost:6001 -tls1_2
openssl s_client -connect localhost:6001 -tls1_3
```

### Debug Commands

```bash
# Check Sockudo SSL configuration
curl -k https://localhost:6001/usage

# Test WebSocket SSL connection
wscat -c wss://localhost:6001/app/demo-key

# Check certificate details
openssl x509 -in /etc/ssl/certs/sockudo.crt -text -noout

# Validate private key
openssl rsa -in /etc/ssl/private/sockudo.key -check

# Test SSL configuration
nmap --script ssl-enum-ciphers -p 6001 localhost
```

### SSL Health Check Script

```bash
#!/bin/bash
# ssl-health-check.sh

DOMAIN="localhost"
PORT="6001"

echo "Checking SSL configuration for ${DOMAIN}:${PORT}"

# Check if port is listening
if ! nc -z ${DOMAIN} ${PORT}; then
    echo "ERROR: Port ${PORT} is not listening"
    exit 1
fi

# Check SSL certificate
CERT_INFO=$(echo | openssl s_client -connect ${DOMAIN}:${PORT} 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "SSL certificate information:"
    echo "${CERT_INFO}"
    
    # Check expiration
    EXPIRY=$(echo "${CERT_INFO}" | grep "notAfter" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "${EXPIRY}" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    echo "Days until expiration: ${DAYS_UNTIL_EXPIRY}"
    
    if [ ${DAYS_UNTIL_EXPIRY} -lt 30 ]; then
        echo "WARNING: Certificate expires in less than 30 days"
    fi
else
    echo "ERROR: Could not retrieve SSL certificate"
    exit 1
fi

echo "SSL configuration check completed"
```

## Important Considerations

### Certificate Formats
- **PEM Format**: Most common, ASCII-encoded
- **DER Format**: Binary-encoded
- **PKCS#12**: Combined certificate and key file

Sockudo expects PEM format certificates.

### Certificate Chain Order
Ensure proper certificate chain order in your certificate file:
1. Server certificate (first)
2. Intermediate certificates
3. Root certificate (optional, usually not included)

### Wildcard Certificates
Wildcard certificates (*.yourdomain.com) can be used with Sockudo:
```json
{
  "ssl": {
    "enabled": true,
    "cert_path": "/etc/ssl/certs/wildcard.yourdomain.com.crt",
    "key_path": "/etc/ssl/private/wildcard.yourdomain.com.key"
  }
}
```

### Multi-Domain Certificates (SAN)
Subject Alternative Name (SAN) certificates supporting multiple domains work seamlessly with Sockudo.

By following these SSL/TLS configuration guidelines, you can ensure secure, encrypted communication between your clients and Sockudo server while maintaining optimal performance and security standards.