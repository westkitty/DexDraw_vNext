import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 3,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    // Pre-set the gateway "entered" flag so existing tests skip the gateway.
    // gateway.spec.ts overrides this with an empty storageState to test the gateway.
    storageState: "tests/e2e/.auth/entered.json",
  },
  webServer: {
    command: "bash scripts/start-dev-servers.sh",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
