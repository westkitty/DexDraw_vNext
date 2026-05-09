import { defineConfig } from "vitest/config";

// PGlite initialises an in-process Postgres from scratch for each test's
// temporary data directory. Cold-start on a loaded machine can take 25-35 s.
// Run server test files sequentially so multiple PGlite instances do not
// starve each other and trip timeouts unrelated to assertion failures.
export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 40_000,
  },
});
