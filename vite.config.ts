// PrecedentOracle — Vite config
// Lovable wrapper + explicit Nitro Vercel preset so the build output matches
// Vercel's expected .vercel/output/ structure.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
  vite: {
    server: {
      port: 8080,
      strictPort: false,
      host: "127.0.0.1",
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.tanstack/**",
          "**/.output/**",
          "**/dist/**",
          "**/.env*",
          "**/backend/**",
          "**/*.db",
          "**/data/**",
        ],
      },
    },
  },
});
