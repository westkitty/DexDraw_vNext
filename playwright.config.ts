import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 3,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    // The gateway is mandatory on fresh loads; tests explicitly click through it.
    // Keep the storage file harmless for older test harness compatibility.
    storageState: "tests/e2e/.auth/entered.json",
  },
  webServer: {
    command: "bash scripts/start-dev-servers.sh",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
