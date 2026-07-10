import { describe, expect, it } from "vitest";

import {
  parseMemoryThemeFormData,
  parseResurfacingParams,
} from "@/lib/moments/themes";

describe("parseMemoryThemeFormData", () => {
  it("accepts and deduplicates up to three themes", () => {
    const formData = new FormData();
    formData.append("theme", "joy");
    formData.append("theme", "achievement");
    formData.append("theme", "joy");

    expect(parseMemoryThemeFormData(formData)).toEqual({
      themes: ["joy", "achievement"],
      error: null,
    });
  });

  it("rejects invalid or excessive themes", () => {
    const invalid = new FormData();
    invalid.append("theme", "unknown");
    expect(parseMemoryThemeFormData(invalid).error).toBe(
      "Choose valid memory themes.",
    );

    const excessive = new FormData();
    ["joy", "achievement", "growth", "calm"].forEach((theme) =>
      excessive.append("theme", theme),
    );
    expect(parseMemoryThemeFormData(excessive).error).toBe(
      "Choose up to 3 memory themes.",
    );
  });
});

describe("parseResurfacingParams", () => {
  it("keeps valid themes and an optional media filter", () => {
    expect(
      parseResurfacingParams({
        theme: ["joy", "invalid", "growth", "joy"],
        media: "video",
      }),
    ).toEqual({
      themes: ["joy", "growth"],
      mediaType: "video",
    });
  });
});
