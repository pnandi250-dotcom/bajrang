import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { TZ: "Asia/Kolkata" },
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/store.ts"],
      reporter: ["text", "json-summary"],
      thresholds: { lines: 90, statements: 90, branches: 80, functions: 80 },
    },
    // Path aliases for test environment
    alias: {
      "@/*": "./src/*",
      "@lib/*": "./src/lib/*",
    },
  },
});