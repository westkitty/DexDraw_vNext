import { defineConfig } from "vitest/config";

// PGlite initialises an in-process Postgres from scratch for each test's
// temporary data directory. Cold-start on a loaded machine can take 25-35 s.
// The global timeout covers that without requiring per-test overrides.
export default defineConfig({
  test: {
    testTimeout: 40_000,
  },
});
