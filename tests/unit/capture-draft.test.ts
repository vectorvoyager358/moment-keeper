import { beforeEach, describe, expect, it } from "vitest";

import {
  type CaptureDraft,
  clearCaptureDraft,
  readCaptureDraft,
  writeCaptureDraft,
} from "@/lib/moments/capture-draft";

const draft: CaptureDraft = {
  body: "A good day",
  occurredAt: "2026-07-09T14:30",
  tags: "personal",
  location: "Back porch",
  themes: ["joy", "connection"],
  isFavorite: false,
};

describe("capture drafts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores drafts separately for each user", () => {
    expect(writeCaptureDraft("user-1", draft)).toBe(true);

    expect(readCaptureDraft("user-1")).toEqual(draft);
    expect(readCaptureDraft("user-2")).toBeNull();
  });

  it("removes drafts with no body or tags", () => {
    writeCaptureDraft("user-1", draft);

    expect(
      writeCaptureDraft("user-1", {
        body: " ",
        occurredAt: draft.occurredAt,
        tags: "",
        location: "",
        themes: [],
        isFavorite: false,
      }),
    ).toBe(false);
    expect(readCaptureDraft("user-1")).toBeNull();
  });

  it("ignores malformed stored drafts", () => {
    localStorage.setItem(
      "moment-keeper:capture-draft:user-1",
      JSON.stringify({ body: 42 }),
    );

    expect(readCaptureDraft("user-1")).toBeNull();
  });

  it("clears a saved draft", () => {
    writeCaptureDraft("user-1", draft);
    clearCaptureDraft("user-1");

    expect(readCaptureDraft("user-1")).toBeNull();
  });
});
