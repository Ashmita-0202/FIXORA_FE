import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // The dev proxy target lives in .env so it can differ per developer machine.
  // Kept out of the bundle — only VITE_-prefixed vars reach client code, and this
  // one deliberately does not carry that prefix.
  const env = loadEnv(mode, rootDir, "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:5211";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
      strictPort: false,
      proxy: {
        // Proxied rather than called cross-origin on purpose: the backend's CORS
        // policy only allows http://localhost:3000, so a direct browser call from
        // the Vite dev port would be blocked. The proxy keeps everything same-origin.
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            charts: ["recharts"],
          },
        },
      },
    },
  };
});