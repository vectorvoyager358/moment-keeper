import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRandomMomentId } = vi.hoisted(() => ({
  getRandomMomentId: vi.fn(),
}));

vi.mock("@/lib/moments/queries", () => ({ getRandomMomentId }));

import { GET } from "@/app/timeline/surprise/route";

describe("surprise route", () => {
  beforeEach(() => {
    getRandomMomentId.mockReset();
  });

  it("redirects to a random moment", async () => {
    getRandomMomentId.mockResolvedValue("moment-1");

    const response = await GET(
      new Request("https://moment-keeper.test/timeline/surprise"),
    );

    expect(response.headers.get("location")).toBe(
      "https://moment-keeper.test/moments/moment-1",
    );
  });

  it("returns to the timeline when there are no moments", async () => {
    getRandomMomentId.mockResolvedValue(null);

    const response = await GET(
      new Request("https://moment-keeper.test/timeline/surprise"),
    );

    expect(response.headers.get("location")).toBe(
      "https://moment-keeper.test/timeline?surprise=empty",
    );
  });
});
