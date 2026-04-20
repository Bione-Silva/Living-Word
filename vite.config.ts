import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const BUILD_ID = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we register manually via useRegisterSW
      devOptions: {
        enabled: false,
      },
      workbox: {
        // Take control as soon as the new SW is activated
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Bump cacheId to invalidate old brand assets across installed browsers/PWAs
        cacheId: "lw-v5-new-logo",
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/blog\//, /\.\w+$/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Always check the network first for HTML / app shell
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "lw-html-v4",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Manifest must always be revalidated
            urlPattern: ({ url }) => url.pathname === "/manifest.json" || url.pathname === "/manifest.webmanifest",
            handler: "NetworkFirst",
            options: {
              cacheName: "lw-manifest-v4",
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // App icons should always reflect the latest brand
            urlPattern: ({ url }) => /\/(icon-\d+|apple-touch-icon|favicon|livingword-icon)\.png$/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "lw-icons-v4",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png"],
      manifest: {
        id: "/?source=pwa",
        name: "Living Word",
        short_name: "Living Word",
        description: "Plataforma cristã trilíngue para pastores e líderes evangélicos.",
        start_url: "/dashboard?source=pwa",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        background_color: "#6D28D9",
        theme_color: "#6D28D9",
        orientation: "portrait-primary",
        lang: "pt-BR",
        categories: ["productivity", "education", "lifestyle"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-tooltip", "@radix-ui/react-tabs"],
          charts: ["recharts"],
        },
      },
    },
  },
}));
