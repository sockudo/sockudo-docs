---
title: Sockudo Docs
description: High-performance Pusher protocol server and official JavaScript client.
navigation: false
seo:
  title: Sockudo Documentation
  description: Production docs for sockudo and @sockudo/client. Setup, API, integrations, and advanced features.
ogImage:
  component: Sockudo
  props:
    title: "Sockudo Documentation"
    description: "Drop-in Pusher replacement built in Rust. Own your WebSocket infrastructure with enterprise-grade performance."
---

::u-page-hero
---
orientation: horizontal
---
#title
Production-Ready Realtime Infrastructure

#description
Drop-in Pusher replacement built in Rust. Own your WebSocket infrastructure with enterprise features like delta compression, tag filtering, and multi-region scaling.

#default
  :::div{class="flex items-center justify-center"}
    ::::img{src="/sockudo-logo/sockudo-icon-color.svg" alt="Sockudo Ninja" class="w-80 h-80 hover:scale-110 transition-all duration-300" style="filter: drop-shadow(0 0 40px rgba(121, 56, 211, 0.6)) drop-shadow(0 0 80px rgba(121, 56, 211, 0.4)); animation: pulse-glow 3s ease-in-out infinite;"}
  :::
  
  :::style
  @keyframes pulse-glow {
    0%, 100% {
      filter: drop-shadow(0 0 40px rgba(121, 56, 211, 0.6)) drop-shadow(0 0 80px rgba(121, 56, 211, 0.4));
    }
    50% {
      filter: drop-shadow(0 0 60px rgba(121, 56, 211, 0.8)) drop-shadow(0 0 120px rgba(121, 56, 211, 0.6));
    }
  }
  :::

#links
  :::u-button
  ---
  color: primary
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-rocket
  ---
  Get Started
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/sockudo/sockudo
  variant: outline
  target: _blank
  ---
  Star on GitHub
  :::

  :::u-button
  ---
  color: neutral
  icon: i-lucide-book-open
  size: xl
  to: /getting-started/introduction
  variant: ghost
  ---
  Documentation
  :::
::

::u-page-section
---
align: center
---
#title
Why Sockudo?

#description
Built for teams that need control, performance, and advanced features beyond basic pub/sub.

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  Blazing Fast
  
  #description
  Written in Rust with async I/O. Handle millions of concurrent connections with minimal resource usage. Scales horizontally with Redis, NATS, or Redis Cluster.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-repeat
  ---
  #title
  Drop-in Compatible
  
  #description
  Keep your existing Pusher integrations. Works seamlessly with pusher-js, Laravel Echo, and all official Pusher SDKs. Migrate without changing client code.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sparkles
  ---
  #title
  Advanced Features
  
  #description
  Delta compression with conflation keys reduces bandwidth by 80-95%. Server-side tag filtering sends only relevant messages to clients.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Production Ready
  
  #description
  Built-in rate limiting, origin validation, per-app quotas, health checks, Prometheus metrics, and webhook batching. Deploy with confidence.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-database
  ---
  #title
  Flexible Storage
  
  #description
  Store app configs in memory, MySQL, PostgreSQL, DynamoDB, ScyllaDB, or Redis. Choose what fits your infrastructure.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-code-2
  ---
  #title
  Developer Friendly
  
  #description
  First-class TypeScript client with Filter API, delta reconstruction, and ergonomic subscription management. JSON config with environment variable overrides.
  :::
::

::u-page-section
---
align: center
---
#title
Core Features

#description
Everything you need to build production-grade realtime applications.

#features
  :::u-page-feature
  ---
  icon: i-lucide-layers
  to: /getting-started/introduction
  ---
  #title
  Pusher Protocol Compatible
  
  #description
  Public, private, and presence channels. Client events. HTTP API with signed requests. Works with existing Pusher clients and server libraries.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-diff
  to: /server/delta-compression
  ---
  #title
  Delta Compression
  
  #description
  Send only message differences instead of full payloads. Conflation keys group messages by entity for 80-95% bandwidth savings on high-frequency updates.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-filter
  to: /server/tag-filtering
  ---
  #title
  Tag Filtering
  
  #description
  Server-side message filtering with tags. Clients subscribe with filter expressions and receive only matching messages. Reduce bandwidth and client load.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-gauge
  to: /server/scaling
  ---
  #title
  Horizontal Scaling
  
  #description
  Scale across multiple nodes with Redis, Redis Cluster, or NATS adapters. Cluster health monitoring and automatic dead node detection included.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-lock
  to: /server/security
  ---
  #title
  Security & Rate Limiting
  
  #description
  Origin validation, API authentication, per-app connection limits, and rate limiting for both WebSocket and HTTP traffic. Memory-based or Redis-backed.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-activity
  to: /server/observability
  ---
  #title
  Observability
  
  #description
  Prometheus metrics endpoint with detailed WebSocket, pub/sub, and delta compression stats. Health checks for readiness and liveness probes.
  :::
::

::u-page-section
---
align: center
---
#title
Get Started in Minutes

#description
Three ways to run Sockudo, from Docker compose to production clusters.

#features
  :::u-page-feature
  ---
  icon: i-simple-icons-docker
  to: /getting-started/installation#option-1-docker-fastest
  ---
  #title
  Docker Compose
  
  #description
  Clone the repo and run `docker compose up`. Perfect for local development and testing. Health checks and metrics included.
  :::

  :::u-page-feature
  ---
  icon: i-simple-icons-rust
  to: /getting-started/installation#option-2-cargo-binstall-precompiled-binary
  ---
  #title
  Precompiled Binary
  
  #description
  Install with `cargo binstall sockudo` for instant setup. Choose feature flags for Redis, MySQL, NATS, and more. No compilation required.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-code
  to: /getting-started/installation#option-3-build-from-source
  ---
  #title
  Build from Source
  
  #description
  Compile with custom features using Cargo. Full control over dependencies. Supports all backends and integrations.
  :::
::

::u-page-section
---
align: center
---
#title
Official JavaScript Client

#description
`@sockudo/client` extends Pusher's API with advanced features while maintaining full compatibility.

#features
  :::u-page-feature
  ---
  icon: i-lucide-filter
  to: /client/official-client-features#tag-filtering-subscribe-api
  ---
  #title
  Filter API
  
  #description
  Subscribe with server-side filters using a fluent API. Supports equality, comparison, set membership, pattern matching, and complex AND/OR combinations.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-package
  to: /client/official-client-features#delta-compression-global-enable
  ---
  #title
  Delta Reconstruction
  
  #description
  Automatic delta decoding with cache management. Track bandwidth savings with stats hooks. Per-subscription delta negotiation and error handling.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-plug
  to: /integrations/laravel-echo
  ---
  #title
  Framework Integration
  
  #description
  Works with Laravel Echo, React, Vue, Svelte, and vanilla JavaScript. Custom connector for Echo with full feature support.
  :::
::

::u-page-section
---
align: center
---
#title
Integrations & Ecosystem

#description
Connect Sockudo with your existing tools and frameworks.

#features
  :::u-page-feature
  ---
  icon: i-simple-icons-laravel
  to: /integrations/laravel-echo
  ---
  #title
  Laravel Echo
  
  #description
  Drop-in replacement for Pusher with Laravel Broadcasting. Use `@sockudo/client` connector for advanced features or standard pusher-js for basic pub/sub.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-radio-tower
  to: /integrations/pusher-js
  ---
  #title
  Pusher-JS
  
  #description
  Standard pusher-js works out of the box. No code changes needed. Point `wsHost` to your Sockudo server and you're ready.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-webhook
  to: /integrations/backend-sdks
  ---
  #title
  Backend SDKs
  
  #description
  Use official Pusher server libraries in PHP, Node.js, Python, Ruby, Go, and .NET. Configure endpoint URL and credentials, then publish events.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-container
  to: /server/scaling
  ---
  #title
  Redis & NATS
  
  #description
  Horizontal scaling with Redis, Redis Cluster, or NATS adapters. Shared pub/sub for multi-node deployments with cluster health monitoring.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-database
  to: /server/app-managers
  ---
  #title
  Database Support
  
  #description
  Store application configs in MySQL, PostgreSQL, DynamoDB, ScyllaDB, or Redis. In-memory mode for development.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-cloud
  to: /server/queue
  ---
  #title
  Queue & Webhooks
  
  #description
  Process webhooks asynchronously with Redis queues or AWS SQS. Automatic batching and retry logic included.
  :::
::

::u-page-section
---
align: center
---
#title
Ready to Get Started?

#description
Install Sockudo, connect your first client, and start building realtime features in under 5 minutes.

#links
  :::u-button
  ---
  color: primary
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-rocket
  ---
  Quick Start
  :::

  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/introduction
  variant: outline
  trailing-icon: i-lucide-book-open
  ---
  Read Introduction
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/sockudo/sockudo
  variant: ghost
  target: _blank
  ---
  View on GitHub
  :::
::
