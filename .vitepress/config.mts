import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Sockudo Documentation",
  titleTemplate: ":title | Sockudo - High-Performance WebSocket Server",
  description:
    "Complete documentation for Sockudo, a high-performance Rust WebSocket server with Pusher compatibility. Build real-time applications with sub-5ms latency.",

  // Enhanced meta tags
  head: [
    [
      "script",
      {
        src: "https://cdn.databuddy.cc/databuddy.js",
        "data-client-id": "5aFTKbNqr8XkSznh3u3F3",
        "data-enable-batching": "true",
        crossorigin: "anonymous",
        async: "true", // boolean attributes should be strings
      },
    ],
    // Existing favicon
    ["link", { rel: "icon", href: "/favicon.ico" }],

    // SEO meta tags
    [
      "meta",
      {
        name: "keywords",
        content:
          "websocket server, pusher alternative, real-time messaging, rust websocket, high performance websocket, laravel echo, pusher compatible",
      },
    ],
    ["meta", { name: "author", content: "sockudo" }],
    ["meta", { name: "robots", content: "index, follow" }],

    // Open Graph
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Sockudo Documentation" }],
    [
      "meta",
      {
        property: "og:title",
        content: "Sockudo - High-Performance WebSocket Server Documentation",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Complete documentation for Sockudo, a high-performance Rust WebSocket server with Pusher compatibility.",
      },
    ],
    ["meta", { property: "og:url", content: "https://sockudo.app" }],

    // Twitter Card
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:site", content: "@sockudorealtime" }],
    [
      "meta",
      {
        name: "twitter:title",
        content: "Sockudo WebSocket Server Documentation",
      },
    ],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "High-performance Rust WebSocket server with Pusher compatibility. 6.5x faster than alternatives.",
      },
    ],

    // Structured data for software
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Sockudo",
        description:
          "High-performance WebSocket server built in Rust with Pusher protocol compatibility",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Linux, macOS, Windows",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Organization",
          name: "Sockudo",
          url: "https://github.com/sockudo",
        },
        url: "https://sockudo.app",
        sameAs: [
          "https://github.com/sockudo/sockudo",
          "https://twitter.com/sockudorealtime",
        ],
      }),
    ],
    sockudosockudosockudo,
  ],

  // SEO enhancements
  base: "/",
  lang: "en-US",
  lastUpdated: true,
  cleanUrls: true,

  // Generate sitemap
  sitemap: {
    hostname: "https://sockudo.app",
  },

  themeConfig: {
    logo: "/logo.svg",

    // Enhanced navigation with SEO-friendly text
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/guide/getting-started" },
      { text: "Documentation", link: "/guide/" },
      { text: "API Reference", link: "/api/" },
      { text: "Performance", link: "/guide/performance-benchmarks" },
      { text: "Integrations", link: "/integrations/" },
      {
        text: "Resources",
        items: [
          {
            text: "GitHub Repository",
            link: "https://github.com/sockudo/sockudo",
          },
          { text: "Discord Community", link: "https://discord.gg/MRhmYg68RY" },
          { text: "Twitter Updates", link: "https://x.com/sockudorealtime" },
        ],
      },
    ],

    // Your existing sidebar structure (keeping what works)
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          collapsed: false,
          items: [
            { text: "Introduction", link: "/guide/" },
            { text: "Quick Start Guide", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Configuration",
          collapsed: false,
          items: [
            { text: "Configuration Overview", link: "/guide/configuration" },
            {
              text: "Server Options",
              link: "/guide/configuration/server-options",
            },
            { text: "Adapter Setup", link: "/guide/configuration/adapter" },
            { text: "App Manager", link: "/guide/configuration/app-manager" },
            { text: "Cache Configuration", link: "/guide/configuration/cache" },
            { text: "Queue Setup", link: "/guide/configuration/queue" },
            {
              text: "Metrics & Monitoring",
              link: "/guide/configuration/metrics",
            },
            {
              text: "Rate Limiting",
              link: "/guide/configuration/rate-limiter",
            },
            { text: "SSL/TLS Setup", link: "/guide/configuration/ssl" },
          ],
        },
        {
          text: "Advanced Usage",
          collapsed: false,
          items: [
            { text: "Production Deployment", link: "/guide/deployment" },
            { text: "Performance Monitoring", link: "/guide/monitoring" },
            { text: "SSL Configuration", link: "/guide/ssl-configuration" },
            {
              text: "Performance Benchmarks",
              link: "/guide/performance-benchmarks",
            },
          ],
        },
      ],
      "/concepts/": [
        {
          text: "Core Concepts",
          collapsed: false,
          items: [
            { text: "Architecture Overview", link: "/concepts/architecture" },
            {
              text: "Pusher Compatibility",
              link: "/concepts/pusher-compatibility",
            },
            { text: "Security Model", link: "/concepts/security" },
            { text: "Scaling Strategies", link: "/concepts/scaling" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Documentation",
          collapsed: false,
          items: [
            { text: "API Overview", link: "/api/" },
            { text: "HTTP API Reference", link: "/api/http-api" },
            { text: "WebSocket API", link: "/api/websocket-api" },
            { text: "Event Triggering", link: "/api/http-api/trigger-events" },
            { text: "Batch Events", link: "/api/http-api/batch-events" },
            { text: "Channel Information", link: "/api/http-api/channel-info" },
            { text: "User Management", link: "/api/http-api/user-management" },
          ],
        },
      ],
      "/integrations/": [
        {
          text: "Client Integrations",
          collapsed: false,
          items: [
            { text: "Integration Guide", link: "/integrations/" },
            { text: "Laravel Echo Setup", link: "/integrations/laravel-echo" },
            { text: "PusherJS Integration", link: "/integrations/pusher-js" },
            {
              text: "Mobile & Other Clients",
              link: "/integrations/other-clients",
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/sockudo/sockudo" },
      { icon: "discord", link: "https://discord.gg/MRhmYg68RY" },
      { icon: "x", link: "https://x.com/sockudorealtime" },
    ],

    editLink: {
      pattern: "https://github.com/sockudo/sockudo/edit/main/docs/:path",
      text: "Improve this page on GitHub",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: `Copyright © 2025-${new Date().getFullYear()} Sockudo & Contributors`,
    },

    search: {
      provider: "local",
    },
  },

  // Enhanced markdown processing
});
