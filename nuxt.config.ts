export default defineNuxtConfig({
  site: {
    url: "https://sockudo.io",
  },

  app: {
    head: {
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      meta: [{ name: "theme-color", content: "#646cff" }],
      script: [
        {
          src: "https://cdn.databuddy.cc/databuddy.js",
          "data-client-id": "5aFTKbNqr8XkSznh3u3F3",
          "data-track-hash-changes": "true",
          "data-track-attributes": "true",
          "data-track-outgoing-links": "true",
          "data-track-interactions": "true",
          "data-track-scroll-depth": "true",
          "data-track-web-vitals": "true",
          "data-track-errors": "true",
          crossorigin: "anonymous",
          async: true,
        },
      ],
    },
  },
});
