// vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { readdirSync } from "fs";
import { join } from "path";

// Install Node globals for server-side execution
installGlobals({ nativeFetch: true });

if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL || process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost").hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT ?? "8002"),
    clientPort: parseInt(process.env.PORT ?? "443"), // Dynamic port with fallback
  };
}

// Debug route discovery
const routesDir = join(process.cwd(), "app/routes");
const routeFiles = readdirSync(routesDir, { recursive: true, encoding: "utf-8" })
  .filter((file) => typeof file === "string" && (file.endsWith(".ts") || file.endsWith(".tsx")))
  .map((file) => (file as string).replace(/\\/g, "/"));
console.log("Manually discovered routes (app/routes):", routeFiles);

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: { preflightContinue: true },
    port: Number(process.env.PORT ?? 3000), // Updated to use nullish coalescing for type safety
    hmr: hmrConfig,
    fs: { allow: ["app", "node_modules"] }, // Consider narrowing if security is a concern
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*", "entry.server.tsx"], // Exclude dotfiles and server entry
      appDirectory: "app",
      serverBuildFile: "index.js",
      serverModuleFormat: "esm",
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
        v3_routeConfig: false,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    target: "esnext",
    assetsInlineLimit: 4096, // Inline small assets up to 4KB, adjust as needed
    ssr: true,
    ssrEmitAssets: true,
  },
  ssr: {
    noExternal: [
      "@shopify/shopify-app-remix",
      "@shopify/shopify-app-session-storage-prisma",
      "@shopify/polaris",
      "isbot",
      "firebase-admin",
      "@google-cloud/firestore",
      "node:stream",
      "node:crypto",
      "node:fs",
      "node:fs/promises",
      "node:os",
      "node:path",
      "node:util",
    ],
    external: ["app/shopify.server", "app/db.server"],
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
    esbuildOptions: {
      mainFields: ["module", "main"],
      target: "es2022", // Added to align with build.target and improve compatibility
      supported: {
        importMeta: true,
      },
    },
  },
});