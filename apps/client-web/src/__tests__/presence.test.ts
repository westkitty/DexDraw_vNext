import { describe, expect, it, vi } from "vitest";
import { mergePresence } from "../lib/presence";

describe("mergePresence", () => {
  it("replaces prior presence for the same client and prunes stale entries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-04T00:00:04.500Z"));

    const result = mergePresence(
      [
        {
          clientId: "one",
          displayName: "Owner",
          x: 10,
          y: 10,
          type: "presence.cursor",
          sentAt: "2026-05-04T00:00:01.000Z",
        },
        {
          clientId: "two",
          displayName: "Guest",
          x: 20,
          y: 20,
          type: "presence.cursor",
          sentAt: "2026-05-03T23:59:59.000Z",
        },
      ],
      {
        clientId: "one",
        displayName: "Owner",
        x: 30,
        y: 30,
        type: "presence.laser",
        sentAt: "2026-05-04T00:00:04.500Z",
      },
    );

    expect(result).toEqual([
      {
        clientId: "one",
        displayName: "Owner",
        x: 30,
        y: 30,
        type: "presence.laser",
        sentAt: "2026-05-04T00:00:04.500Z",
      },
    ]);
  });
});
