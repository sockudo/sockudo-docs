# Sockudo Guide

Welcome to the Sockudo guide! This comprehensive documentation will walk you through everything you need to know to get Sockudo up and running, configure it for your needs, and understand its core features.

Sockudo is a high-performance WebSocket server built in Rust that is compatible with the Pusher protocol. This means you can use existing Pusher client libraries (like Laravel Echo, pusher-js, and others) to connect to Sockudo and build real-time applications.

## What is Sockudo?

Sockudo provides real-time, bidirectional communication between clients and servers using WebSockets. Key features include:

- **Pusher Protocol Compatibility**: Drop-in replacement for Pusher with existing client libraries
- **High Performance**: Built in Rust for speed and efficiency
- **Horizontal Scaling**: Multiple adapters for scaling across instances (Redis, NATS, Redis Cluster)
- **Flexible Storage**: Support for MySQL, PostgreSQL, DynamoDB, and in-memory app management
- **Comprehensive Features**: Rate limiting, webhooks, metrics, SSL/TLS, and more
- **Docker Ready**: Full Docker and Kubernetes support for modern deployments

## Performance Highlights

Sockudo delivers exceptional performance compared to alternatives. In comprehensive benchmarks against Soketi (Node.js-based Pusher server):

- **6.5x faster message latency**: 1.84ms vs 12.01ms average
- **8x faster 95th percentile**: 3ms vs 24ms response times
- **16% higher throughput**: 2,927 vs 2,523 messages/second
- **Efficient resource usage**: Superior performance with lower CPU and memory overhead

Built with Rust's zero-cost abstractions and memory safety, Sockudo handles thousands of concurrent connections while maintaining sub-5ms latency for real-time applications.

**[📊 View Complete Performance Benchmarks](./performance-benchmarks.md)**

## Quick Navigation

### Getting Started
- **[Getting Started](./getting-started.md)**: Install and run your first Sockudo server
- **[Channels](./channels.md)**: Understand public, private, and presence channels
- **[Configuration](./configuration.md)**: Comprehensive configuration guide

### Core Features
- **[Webhooks](./webhooks.md)**: Set up event notifications to your application
- **[Scaling](./scaling.md)**: Scale Sockudo using different adapters and load balancing
- **[Monitoring](./monitoring.md)**: Monitor performance with Prometheus and Grafana

### Performance & Operations
- **[Performance Benchmarks](./performance-benchmarks.md)**: Detailed performance analysis and optimization
- **[Deployment](./deployment.md)**: Production deployment strategies and best practices
- **[Troubleshooting](./troubleshooting.md)**: Diagnose and solve common issues
- **[SSL Configuration](./ssl-configuration.md)**: Secure your connections with SSL/TLS

## Architecture Overview

Sockudo is designed with modularity and scalability in mind:


```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │    Sockudo      │
│  (Browser/App)  │◄──►│   (Nginx/HAProxy│◄──►│   Instances     │
│                 │    │   /K8s Ingress) │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                             ┌────────────────────────┼────────────────────────┐
                             │                        │                        │
                    ┌─────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
                    │    Adapter       │    │   App Manager    │    │     Cache        │
                    │ (Redis/NATS/     │    │ (Memory/MySQL/   │    │ (Memory/Redis)   │
                    │  Local/Cluster)  │    │  Postgres/Dynamo)│    │                  │
                    └──────────────────┘    └──────────────────┘    └──────────────────┘
                             │                        │                        │
                    ┌─────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
                    │     Queue        │    │   Rate Limiter   │    │    Webhooks      │
                    │ (Memory/Redis/   │    │ (Memory/Redis)   │    │  (HTTP/Lambda)   │
                    │   SQS/Cluster)   │    │                  │    │                  │
                    └──────────────────┘    └──────────────────┘    └──────────────────┘
```
### Core Components

- **WebSocket Server**: High-performance WebSocket handling with Pusher protocol compatibility
- **HTTP API**: RESTful API for publishing events and managing channels
- **Adapters**: Pluggable backends for horizontal scaling (Local, Redis, NATS, Redis Cluster)
- **App Manager**: Flexible application management with multiple database backends
- **Metrics & Monitoring**: Built-in Prometheus metrics for observability
- **Rate Limiting**: Configurable rate limiting to protect against abuse

## Why Choose Sockudo?

### Performance First
- **Native Performance**: Rust's zero-cost abstractions deliver optimal performance
- **Memory Safety**: No garbage collection pauses or memory leaks
- **Concurrent by Design**: Built from the ground up for high-concurrency scenarios
- **Proven Benchmarks**: Measurably faster than popular alternatives

### Production Ready
- **Battle Tested**: Comprehensive test suite and production deployment experience
- **Horizontal Scaling**: Built-in support for multiple instances with shared state
- **Monitoring**: Rich metrics and observability out of the box
- **Security**: Rate limiting, SSL/TLS, and authentication support

### Developer Experience
- **Drop-in Replacement**: Compatible with existing Pusher client libraries
- **Flexible Configuration**: Environment variables, JSON config, or hybrid approaches
- **Clear Documentation**: Comprehensive guides for all features and use cases
- **Active Development**: Regular updates and community support

## Getting Started

1. **[Quick Start](./getting-started.md)**: Get Sockudo running in minutes
2. **[Configuration](./configuration.md)**: Configure for your environment
3. **[Performance Benchmarks](./performance-benchmarks.md)**: Understand performance characteristics
4. **[Deployment](./deployment.md)**: Deploy to production

## Support and Community

- **Documentation**: This comprehensive guide covers all features
- **GitHub Issues**: Report bugs and request features
- **Performance**: See our [benchmark results](./performance-benchmarks.md) for performance insights
- **Examples**: Real-world configuration examples throughout the documentation

---

Ready to build fast, reliable real-time applications? Start with our [Getting Started Guide](./getting-started.md) or explore the [Performance Benchmarks](./performance-benchmarks.md) to see what Sockudo can deliver for your use case.