import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside React Server Components; tests run in plain Node.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: { include: ["test/**/*.test.ts"], environment: "node" },
});
