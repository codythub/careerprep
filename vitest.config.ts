import path from "node:path";
import { defineConfig } from "vitest/config";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:54330/careerprep_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside the React server runtime; it's a no-op for tests.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    // Test files share one database, so run them one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DB_URL,
      DIRECT_URL: TEST_DB_URL,
      AUTH_SECRET: "test-secret-for-vitest-only",
      PAYSTACK_SECRET_KEY: "sk_test_vitest_secret",
      STORAGE_DRIVER: "local",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      RESEND_API_KEY: "",
      ADMIN_ALERT_EMAIL: "",
    },
  },
});
