# SSL/TLS Configuration (WSS)

To secure WebSocket connections using `wss://` (WebSocket Secure), you need to configure Sockudo with an SSL/TLS certificate. This encrypts the data transmitted between clients and your Sockudo server, protecting it from eavesdropping and tampering.

## When to Use SSL/TLS

It is **highly recommended** to use SSL/TLS for all production deployments of Sockudo. Unencrypted `ws://` connections are vulnerable and should only be used for local development or in trusted network environments where traffic is otherwise secured.

Browsers also enforce stricter rules for `wss://`, often requiring it for features like Service Workers or when the main page is served over `https://`.

## Configuration in `config.json`

Based on the `options.rs` structure, SSL/TLS settings are primarily configured via the top-level `ssl` object within your `config.json`. The WebSocket server will automatically use `wss://` if SSL is enabled.

```json
{
  // ... other top-level configurations like app_manager, adapter, etc.
  "ssl": {
    "enabled": true, // Set to true to enable SSL/TLS for WebSockets
    "cert_path": "/path/to/your/fullchain.pem",
    "key_path": "/path/to/your/privkey.pem",
    "passphrase": null, // Optional: if your private key is encrypted
    "ca_path": null,    // Optional: path to CA bundle if needed for client certificate authentication
    "redirect_http": false, // Optional: if true, redirects HTTP traffic on 'http_port' to HTTPS
    "http_port": 80         // Optional: port for HTTP redirection if redirect_http is true
  },
  "port": 6001, // This would be the WSS port if ssl.enabled is true
  // The "websockets" object might not exist or might not contain protocol/ssl settings
  // if the top-level ssl object and port are used as the primary mechanism.
  // "websockets": {
  //   "host": "0.0.0.0", // Host is likely still configured here or at top level
  //   "port": 6001 // This port becomes the WSS port if ssl.enabled is true
  // },
  // ... other configurations
}
```
ssl Object Fields:enabled: Boolean (Default: false as per SslConfig::default())
Set to true to enable SSL/TLS for the main WebSocket server running on the top-level port.
If true, the server will listen for wss:
// connections.cert_path: String (Required if enabled is true)Absolute path to your SSL certificate file. This should typically be the full chain certificate (including your server certificate and any intermediate certificates). Common file extensions are .pem, .crt.key_path: String (Required if enabled is true)Absolute path to your SSL private key file. This key must correspond to the certificate. Common file extensions are .pem, .key. Keep this file secure!passphrase: String (Optional, Default: null)If your private key file is encrypted with a passphrase, provide it here.ca_path: String (Optional, Default: null)Path to a CA certificate bundle. This is typically used if you need to enable client certificate authentication (mTLS), which is an advanced use case. For most server-side SSL setups, this is not needed.redirect_http: Boolean (Default: false)If true, Sockudo will attempt to start an additional HTTP server on ssl.http_port (default 80) that redirects all traffic to the HTTPS/WSS endpoint. This is useful if users might try to access your service via plain HTTP.http_port: Integer (Optional, Default: 80 if redirect_http is true)The port on which the HTTP redirection server will listen if ssl.redirect_http is enabled.WebSocket Port (port)The top-level port (e.g., 6001 by default) in your config.json will serve wss:// traffic if ssl.enabled is true. If ssl.enabled is false, it will serve ws:// traffic.Obtaining SSL/TLS CertificatesLet's Encrypt (Recommended for public servers): A free, automated, and open Certificate Authority. Tools like Certbot can automate the process of obtaining and renewing certificates.Commercial CAs: Purchase certificates from providers like DigiCert, Comodo, GlobalSign, etc.Self-Signed Certificates (For development/testing ONLY): You can generate your own certificates using tools like OpenSSL. However, browsers and clients will show security warnings because they are not trusted by default. Never use self-signed certificates in production.Example: Generating a Self-Signed Certificate (for testing)openssl genpkey -algorithm RSA -out privkey.pem -pkeyopt rsa_keygen_bits:2048
openssl req -new -key privkey.pem -out cert.csr
# Answer the prompts. For "Common Name (e.g. server FQDN or YOUR name)", use "localhost" if testing locally.
openssl x509 -req -days 365 -in cert.csr -signkey privkey.pem -out fullchain.pem
This will create privkey.pem and fullchain.pem in your current directory. Update cert_path and key_path in your config.json accordingly. Remember to only use these for local testing.Important ConsiderationsFile Permissions: Ensure that the Sockudo server process has read access to the certificate and private key files, but that the private key file is otherwise strictly protected.Certificate Renewal: SSL certificates have an expiration date. Automate the renewal process (especially if using Let's Encrypt) to avoid service interruptions.Reverse Proxies (e.g., Nginx, HAProxy):In many production setups, you might terminate SSL/TLS at a reverse proxy, and the proxy then communicates with Sockudo instances over plain ws:// on a private network.If this is your setup, you would configure SSL on your reverse proxy.Sockudo's ssl.enabled would be false.The reverse proxy would be configured to proxy wss:// requests to Sockudo's ws:// port.Ensure the proxy correctly forwards headers like X-Forwarded-For and X-Forwarded-Proto if Sockudo needs to be aware of the original client IP or protocol. Sockudo's cors and app_manager.apps[].allowed_origins settings might need to
