import { normalizeTagName } from "@/lib/moments/validation";

/** Split comma-separated tag input and dedupe case-insensitively. */
export function parseTagInput(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of raw.split(",")) {
    const name = normalizeTagName(part);
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(name);
  }

  return tags;
}

export function formatTagInput(tags: { name: string }[]): string {
  return tags.map((tag) => tag.name).join(", ");
}
