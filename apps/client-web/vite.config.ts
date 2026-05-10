import react from "@vitejs/plugin-react";
import { createLogger, defineConfig } from "vite";

// Suppress Vite WS proxy teardown noise. When Playwright kills the server-api while
// WebSocket proxy sockets are still open, http-proxy emits ECONNREFUSED / EPIPE /
// ECONNRESET errors. Vite logs them via logger.error as "[vite] ws proxy error: ...".
// Filtering here keeps verification output clean. Real test failures are still reported
// by Playwright's own pass/fail output and are unaffected by this filter.
const logger = createLogger();
const origError = logger.error.bind(logger);
logger.error = (msg, options) => {
  if (
    /ws proxy (socket )?error/i.test(msg) &&
    /ECONNREFUSED|EPIPE|ECONNRESET/i.test(msg)
  ) {
    return;
  }
  origError(msg, options);
};

const API_TARGET = "http://127.0.0.1:4000";
const WS_TARGET = "ws://127.0.0.1:4000";

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": API_TARGET,
      "/ws": {
        target: WS_TARGET,
        ws: true,
      },
    },
  },
});
