// PrecedentOracle — local-dev safe Vite config
// Uses Lovable's @lovable.dev/vite-tanstack-config wrapper but defaults to a
// fixed port and disables file watching of .env to prevent restart loops when
// iCloud or other background processes touch project files.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      port: 8080,
      strictPort: false,
      host: "127.0.0.1",
      // Watch tighter — ignore cache, output, and node_modules
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.tanstack/**",
          "**/.output/**",
          "**/dist/**",
          "**/.env*",                     // Don't restart on .env edits
          "**/backend/**",                // Backend isn't part of frontend
          "**/*.db",
          "**/data/**",
        ],
      },
    },
  },
});
