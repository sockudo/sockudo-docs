---
layout: home
title: Sockudo - High-Performance WebSocket Server
titleTemplate: false
description: Sockudo is a high-performance WebSocket server built in Rust with Pusher protocol compatibility. 6.5x faster than alternatives with sub-5ms latency for real-time applications.

hero:
  name: "Sockudo"
  text: "High-Performance WebSocket Server"
  tagline: "Built in Rust • Pusher Compatible • 6.5x Faster Performance"
  image:
    src: /logo.svg
    alt: Sockudo WebSocket Server Logo
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: View Performance Benchmarks
      link: /guide/performance-benchmarks
    - theme: alt
      text: GitHub Repository
      link: https://github.com/sockudo/sockudo

features:
  - icon: ⚡
    title: Exceptional Performance
    details: 6.5x faster message latency (1.84ms vs 12.01ms) and 8x faster 95th percentile response times compared to Node.js alternatives.
    link: /guide/performance-benchmarks
    linkText: View Benchmarks
  
  - icon: 🔌
    title: Pusher Protocol Compatible
    details: Drop-in replacement for Pusher with existing client libraries like Laravel Echo, pusher-js, and all major frameworks.
    link: /integrations/
    linkText: Integration Guides
  
  - icon: 🚀
    title: Production Ready
    details: Horizontal scaling, rate limiting, SSL/TLS, webhooks, metrics, and comprehensive monitoring for enterprise deployments.
    link: /guide/deployment
    linkText: Deployment Guide
  
  - icon: 🔒
    title: Enterprise Security
    details: Built-in authentication, rate limiting, origin validation, and SSL/TLS support with configurable security policies.
    link: /concepts/security
    linkText: Security Guide
  
  - icon: 📊
    title: Real-time Monitoring
    details: Prometheus metrics, comprehensive logging, health checks, and performance monitoring out of the box.
    link: /guide/monitoring
    linkText: Monitoring Setup
  
  - icon: 🔧
    title: Flexible Architecture
    details: Multiple adapters (Redis, NATS, Local), database backends (MySQL, PostgreSQL, DynamoDB), and deployment options.
    link: /concepts/scaling
    linkText: Scaling Guide
---

## Why Choose Sockudo Over Alternatives?

Sockudo delivers the **fastest WebSocket server performance** available today, making it the ideal **Pusher alternative** for developers building real-time applications. Built in Rust for maximum efficiency, Sockudo provides enterprise-grade features while maintaining simplicity.

### 🏆 Performance Leadership

Our comprehensive benchmarks demonstrate Sockudo's superiority over popular alternatives:

| Metric | Sockudo | Soketi (Node.js) | Improvement |
|--------|---------|------------------|-------------|
| **Average Latency** | 1.84ms | 12.01ms | **6.5x faster** |
| **95th Percentile** | 3ms | 24ms | **8x faster** |
| **Throughput** | 2,927 msg/s | 2,523 msg/s | **16% higher** |
| **Memory Usage** | 45MB | 180MB | **75% less** |

[📊 **View Complete Performance Analysis**](/guide/performance-benchmarks)

### 🔄 Seamless Migration from Pusher

**Zero code changes required** - Sockudo implements the complete Pusher WebSocket protocol:

```javascript
// Your existing Laravel Echo configuration works unchanged
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: 'your-app-key',
    wsHost: 'your-sockudo-server.com',
    wsPort: 6001,
    forceTLS: true
});
```

**Supported client libraries:**
- Laravel Echo (PHP/Laravel)
- pusher-js (JavaScript/TypeScript)
- Pusher Swift (iOS)
- pusher-java-client (Android/Java)
- All official Pusher SDKs

### 🚀 Enterprise-Ready Features

**Horizontal Scaling Options:**
- Redis Adapter for multi-instance deployments
- NATS Adapter for distributed messaging
- Redis Cluster for high-availability setups
- Local adapter for single-instance deployments

**Production Essentials:**
- **Rate Limiting**: Protect against abuse with configurable limits
- **SSL/TLS Support**: End-to-end encryption for secure connections  
- **Webhooks**: Real-time event notifications to your application
- **Metrics**: Prometheus integration for comprehensive monitoring
- **Health Checks**: Built-in endpoints for load balancer integration

### 💻 Developer Experience

**Quick Installation:**
```bash
# Download and run in seconds
wget https://github.com/sockudo/sockudo/releases/latest/download/sockudo-linux
chmod +x sockudo-linux
./sockudo-linux --config config.json
```

**Docker Ready:**
```bash
docker run -p 6001:6001 -v $(pwd)/config.json:/config.json sockudo/sockudo
```

**Flexible Configuration:**
- JSON configuration files
- Environment variables
- Hybrid configuration approaches
- Hot-reload for development

## Real-World Use Cases

### 💬 Chat Applications
Build high-performance chat systems with sub-millisecond message delivery:
- Real-time messaging with presence detection
- Typing indicators and read receipts
- Multi-room chat with channel isolation
- Mobile and web client support

### 📊 Live Dashboards  
Create responsive dashboards with real-time data updates:
- Stock price feeds and trading platforms
- IoT sensor monitoring dashboards
- Analytics and metrics visualization
- System monitoring interfaces

### 🔔 Notification Systems
Implement instant notification delivery:
- Push notifications to web and mobile
- Real-time alerts and warnings
- User-specific notification channels
- Batch notification processing

### 🎮 Real-Time Gaming
Build multiplayer games with low-latency communication:
- Player position synchronization
- Game state broadcasting
- Real-time leaderboards
- Cross-platform compatibility

## Framework Integration

### Laravel + Sockudo
Perfect combination for PHP developers:
```php
// Broadcast events normally in Laravel
broadcast(new MessageSent($message))->toOthers();
```
[**🔗 Laravel Integration Guide**](/integrations/laravel-echo)

### React + Sockudo
Seamless real-time React applications:
```jsx
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const echo = new Echo({ /* Sockudo config */ });
```

### Vue.js + Sockudo
Real-time Vue applications made simple:
```javascript
// Use with Vue composition API
const { listen } = useEcho();
listen('channel', 'event', handleMessage);
```

## Deployment Options

### 🐳 **Docker & Kubernetes**
Production-ready containers with health checks:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sockudo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sockudo
```
[**🔗 Kubernetes Guide**](/guide/deployment#kubernetes)

### ☁️ **Cloud Platforms**
Deploy on any cloud provider:
- AWS ECS/EKS with Application Load Balancer
- Google Cloud Run with auto-scaling
- Azure Container Instances
- DigitalOcean App Platform

[**🔗 Cloud Deployment Guide**](/guide/deployment#cloud-deployment)

### 🏢 **On-Premises**
Self-hosted with full control:
- SystemD service configuration
- Nginx/HAProxy load balancing
- SSL certificate management
- Log aggregation and monitoring

[**🔗 On-Premises Guide**](/guide/deployment#on-premises)

## Getting Started in 5 Minutes

### 1. **Download Sockudo**
```bash
# Linux/macOS
curl -L https://github.com/sockudo/sockudo/releases/latest/download/sockudo-linux -o sockudo
chmod +x sockudo

# Or use Docker
docker pull sockudo/sockudo:latest
```

### 2. **Create Configuration**
```json
{
  "app_manager": {
    "driver": "memory",
    "apps": [{
      "id": "app-1",
      "key": "demo-key", 
      "secret": "demo-secret"
    }]
  }
}
```

### 3. **Start Server**
```bash
./sockudo --config config.json
# Server running on ws://localhost:6001
```

### 4. **Connect Client**
```javascript
const echo = new Echo({
    broadcaster: 'pusher',
    key: 'demo-key',
    wsHost: 'localhost',
    wsPort: 6001
});

echo.channel('my-channel')
    .listen('MyEvent', (e) => {
        console.log('Received:', e);
    });
```

### 5. **Send Messages**
```bash
curl -X POST http://localhost:6001/apps/app-1/events \
  -H "Content-Type: application/json" \
  -d '{"name": "MyEvent", "channel": "my-channel", "data": {"message": "Hello World!"}}'
```

[**🚀 Complete Setup Guide**](/guide/getting-started)

## Community & Support

### 📚 **Comprehensive Documentation**
- Step-by-step tutorials for all skill levels
- Complete API reference documentation
- Real-world examples and use cases
- Performance optimization guides

### 👥 **Active Community**
- [**Discord Server**](https://discord.gg/MRhmYg68RY) - Get help and share experiences
- [**GitHub Discussions**](https://github.com/sockudo/sockudo/discussions) - Feature requests and technical discussions
- [**Twitter Updates**](https://x.com/sockudorealtime) - Latest news and updates

### 🐛 **Issue Reporting**
Found a bug or need a feature? We're responsive to community feedback:
- [**GitHub Issues**](https://github.com/sockudo/sockudo/issues) - Bug reports and feature requests
- [**Security Reports**](mailto:security@sockudo.com) - Responsible disclosure for security issues

## What Makes Sockudo Different?

### **Performance First**
- **Native Performance**: Rust's zero-cost abstractions deliver optimal performance
- **Memory Safety**: No garbage collection pauses or memory leaks
- **Concurrent by Design**: Built from the ground up for high-concurrency scenarios
- **Proven Benchmarks**: Measurably faster than popular alternatives

### **Production Ready**
- **Battle Tested**: Comprehensive test suite and production deployment experience
- **Horizontal Scaling**: Built-in support for multiple instances with shared state
- **Monitoring**: Rich metrics and observability out of the box
- **Security**: Rate limiting, SSL/TLS, and authentication support

### **Developer Experience**
- **Drop-in Replacement**: Compatible with existing Pusher client libraries
- **Flexible Configuration**: Environment variables, JSON config, or hybrid approaches
- **Clear Documentation**: Comprehensive guides for all features and use cases
- **Active Development**: Regular updates and community support

## Ready to Experience the Performance Difference?

Join thousands of developers already building faster real-time applications with Sockudo.

<div class="action-buttons">
  <a href="/guide/getting-started" class="action-button primary">
    🚀 Get Started Now
  </a>
  <a href="/guide/performance-benchmarks" class="action-button secondary">
    📊 View Benchmarks
  </a>
  <a href="https://github.com/sockudo/sockudo" class="action-button secondary">
    ⭐ Star on GitHub
  </a>
</div>

---

<div style="text-align: center; margin: 3rem 0 2rem; padding: 2rem; background: var(--vp-c-bg-soft); border-radius: 8px; border-left: 4px solid var(--vp-c-brand-1);">
  <h3 style="margin-top: 0; color: var(--vp-c-brand-1);">🚀 Ready to Build Faster Real-Time Applications?</h3>
  <p style="margin: 1rem 0; color: var(--vp-c-text-1); font-size: 1.1em;">
    Experience the performance difference with Sockudo's lightning-fast WebSocket server.
  </p>
  <div style="margin-top: 1.5rem;">
    <a href="/guide/getting-started" style="display: inline-block; margin: 0 0.5rem; padding: 0.75rem 1.5rem; background: var(--vp-c-brand-1); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; transition: all 0.2s;">Start Building</a>
    <a href="/integrations/laravel-echo" style="display: inline-block; margin: 0 0.5rem; padding: 0.75rem 1.5rem; background: transparent; color: var(--vp-c-brand-1); text-decoration: none; border-radius: 6px; font-weight: 600; border: 2px solid var(--vp-c-brand-1); transition: all 0.2s;">Laravel Integration</a>
  </div>
</div>

<style>
.action-buttons {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
  justify-content: center;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-block;
  text-align: center;
  min-width: 140px;
}

.action-button.primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.action-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.action-button.primary:hover {
  background: var(--vp-c-brand-2);
}

.action-button.secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 200px;
  }
}

/* Feature cards enhancement */
.VPFeature {
  transition: transform 0.2s, box-shadow 0.2s;
}

.VPFeature:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

/* Code block styling */
.language-bash, .language-javascript, .language-json, .language-php, .language-jsx, .language-yaml {
  background: var(--vp-code-block-bg) !important;
}

/* Performance table styling */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
}

table th, table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

table th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}

table td strong {
  color: var(--vp-c-brand-1);
}

/* Section spacing */
h2 {
  margin-top: 3rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--vp-c-divider-light);
  padding-bottom: 0.5rem;
}

h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--vp-c-brand-1);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .VPHero .name {
    font-size: 2.5rem !important;
  }
  
  .VPHero .text {
    font-size: 1.5rem !important;
  }
  
  table {
    font-size: 0.8rem;
  }
  
  table th, table td {
    padding: 0.5rem;
  }
}
</style>
