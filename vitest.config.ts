import { defineConfig } from "vitest/config";
import path from "node:path";

const testDb =
  process.env.TEST_DATABASE_URL ??
  "postgresql://what2eat:what2eat@localhost:5435/what2eat_test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDb,
      TEST_DATABASE_URL: testDb,
      SESSION_SECRET: "test-session-secret-32chars-minimum",
      FEATURE_EMAIL: "false",
      PUBLIC_BASE_URL: "http://localhost:3020",
      APP_URL: "http://localhost:3020",
      PLACES_AGENT_BASE_URL: "http://agent.test",
      PLACES_AGENT_CALLER_KEY: "pa_test_contract_key",
    },
    coverage: {
      provider: "v8",
      include: [
        "src/auth/**/*.ts",
        "src/core/crypto.ts",
        "src/core/locales.ts",
        "src/chat/**/*.ts",
        "app/api/auth/**/*.ts",
        "app/api/profile/**/*.ts",
        "app/api/locale/**/*.ts",
        "app/api/chat/**/*.ts",
        "app/api/history/**/*.ts",
      ],
      exclude: ["**/*.test.ts"],
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
