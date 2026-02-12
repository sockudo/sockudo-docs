export default defineAppConfig({
  docus: {
    locale: "en",
  },
  seo: {
    title: "Sockudo Docs",
    titleTemplate: "%s · Sockudo Docs",
    description:
      "Documentation for sockudo server and @sockudo/client, a Pusher-compatible realtime stack.",
  },
  header: {
    logo: {
      light: "/sockudo-logo/sockudo-logo-black.svg",
      dark: "/sockudo-logo/sockudo-logo-white.svg",
      alt: "Sockudo",
    },
  },
  socials: {
    github: "https://github.com/sockudo/sockudo",
    npm: "https://www.npmjs.com/package/@sockudo/client",
    x: "https://x.com/sockudorealtime",
  },
  toc: {
    title: "On This Page",
    bottom: {
      title: "Sockudo",
      links: [
        {
          icon: "i-simple-icons-github",
          label: "sockudo",
          to: "https://github.com/sockudo/sockudo",
          target: "_blank",
        },
        {
          icon: "i-simple-icons-github",
          label: "sockudo-js",
          to: "https://github.com/sockudo/sockudo-js",
          target: "_blank",
        },
        {
          icon: "i-simple-icons-npm",
          label: "@sockudo/client",
          to: "https://www.npmjs.com/package/@sockudo/client",
          target: "_blank",
        },
      ],
    },
  },
  github: false,
  ui: {
    colors: {
      primary: "violet",
      neutral: "slate",
    },
    contentNavigation: {
      slots: {
        linkLeadingIcon: "size-4 mr-1",
      },
      defaultVariants: {
        variant: "link",
      },
    },
    pageLinks: {
      slots: {
        linkLeadingIcon: "size-4",
      },
    },
    pageFeature: {
      slots: {
        root: "border border-gray-200/20 dark:border-gray-800/50 rounded-xl p-6 transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1",
      },
    },
  },
});
