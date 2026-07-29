import { MAX_MOMENT_BODY_LENGTH } from "@/lib/moments/validation";

export const MAX_RICH_TEXT_JSON_LENGTH = 100_000;

const MAX_RICH_TEXT_DEPTH = 12;
const MAX_RICH_TEXT_NODES = 2_000;

const CONTAINER_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
]);
const LEAF_NODE_TYPES = new Set(["text", "hardBreak"]);
const MARK_TYPES = new Set(["bold", "italic", "underline", "link"]);

export type RichTextMark = {
  type: "bold" | "italic" | "underline" | "link";
  attrs?: {
    href?: string;
  };
};

export type RichTextNode = {
  type:
    | "doc"
    | "paragraph"
    | "heading"
    | "bulletList"
    | "orderedList"
    | "listItem"
    | "blockquote"
    | "text"
    | "hardBreak";
  attrs?: {
    level?: 2 | 3;
    start?: number;
  };
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
};

export type RichTextDocument = RichTextNode & {
  type: "doc";
};

export type RichTextValue = {
  text: string;
  content: RichTextDocument;
};

type NormalizeContext = {
  nodeCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeRichTextLinkUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeMark(value: unknown): RichTextMark | null {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null;
  }

  if (!MARK_TYPES.has(value.type)) {
    return null;
  }

  if (value.type !== "link") {
    return { type: value.type as "bold" | "italic" | "underline" };
  }

  const href =
    isRecord(value.attrs) && typeof value.attrs.href === "string"
      ? normalizeRichTextLinkUrl(value.attrs.href)
      : null;

  return href ? { type: "link", attrs: { href } } : null;
}

function normalizeNode(
  value: unknown,
  context: NormalizeContext,
  depth: number,
): RichTextNode | null {
  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    depth > MAX_RICH_TEXT_DEPTH ||
    context.nodeCount >= MAX_RICH_TEXT_NODES
  ) {
    return null;
  }

  const type = value.type;
  if (!CONTAINER_NODE_TYPES.has(type) && !LEAF_NODE_TYPES.has(type)) {
    return null;
  }

  context.nodeCount += 1;

  if (type === "text") {
    if (typeof value.text !== "string") {
      return null;
    }

    const marks = Array.isArray(value.marks)
      ? value.marks
          .map(normalizeMark)
          .filter((mark): mark is RichTextMark => mark !== null)
      : [];

    return {
      type: "text",
      text: value.text,
      ...(marks.length > 0 ? { marks } : {}),
    };
  }

  if (type === "hardBreak") {
    return { type: "hardBreak" };
  }

  const content: RichTextNode[] = [];
  if (Array.isArray(value.content)) {
    for (const child of value.content) {
      const normalizedChild = normalizeNode(child, context, depth + 1);
      if (!normalizedChild) {
        return null;
      }
      content.push(normalizedChild);
    }
  }

  const node: RichTextNode = {
    type: type as RichTextNode["type"],
    ...(content.length > 0 ? { content } : {}),
  };

  if (type === "heading") {
    const rawLevel = isRecord(value.attrs) ? value.attrs.level : null;
    node.attrs = { level: rawLevel === 3 ? 3 : 2 };
  }

  if (type === "orderedList") {
    const rawStart = isRecord(value.attrs) ? value.attrs.start : null;
    if (
      typeof rawStart === "number" &&
      Number.isInteger(rawStart) &&
      rawStart > 1 &&
      rawStart <= 100_000
    ) {
      node.attrs = { start: rawStart };
    }
  }

  return node;
}

export function normalizeRichTextDocument(
  value: unknown,
): RichTextDocument | null {
  const context: NormalizeContext = { nodeCount: 0 };
  const document = normalizeNode(value, context, 0);

  return document?.type === "doc" ? (document as RichTextDocument) : null;
}

export function plainTextToRichTextDocument(text: string): RichTextDocument {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}

function inlineText(node: RichTextNode): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  return (node.content ?? []).map(inlineText).join("");
}

function blockText(node: RichTextNode): string {
  if (node.type === "text" || node.type === "hardBreak") {
    return inlineText(node);
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? []).map(blockText).join("\n");
  }

  if (node.type === "listItem") {
    return (node.content ?? []).map(blockText).join("\n");
  }

  return (node.content ?? []).map(inlineText).join("");
}

export function richTextToPlainText(document: RichTextDocument): string {
  return (document.content ?? [])
    .map(blockText)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function appendParagraphToRichText(
  document: RichTextDocument,
  text: string,
): RichTextDocument {
  const normalized =
    normalizeRichTextDocument(document) ?? plainTextToRichTextDocument("");
  const content = [...(normalized.content ?? [])];

  if (
    content.length === 1 &&
    content[0]?.type === "paragraph" &&
    !content[0].content?.length
  ) {
    content.length = 0;
  }

  content.push({
    type: "paragraph",
    content: [{ type: "text", text }],
  });
  content.push({ type: "paragraph" });

  return { type: "doc", content };
}

export function parseRichTextFormData(formData: FormData):
  | {
      error: null;
      body: string;
      content: RichTextDocument | null;
    }
  | {
      error: string;
      body: "";
      content: null;
    } {
  const fallbackBody = String(formData.get("body") ?? "").trim();
  const serialized = String(formData.get("body_content") ?? "").trim();

  if (!serialized) {
    return { error: null, body: fallbackBody, content: null };
  }

  if (serialized.length > MAX_RICH_TEXT_JSON_LENGTH) {
    return {
      error: "Moment formatting is too large.",
      body: "",
      content: null,
    };
  }

  try {
    const document = normalizeRichTextDocument(JSON.parse(serialized));
    if (!document) {
      throw new Error("Invalid rich text document.");
    }

    const body = richTextToPlainText(document).trim();
    if (body.length > MAX_MOMENT_BODY_LENGTH) {
      return {
        error: `Moment text must be ${MAX_MOMENT_BODY_LENGTH} characters or fewer.`,
        body: "",
        content: null,
      };
    }

    return { error: null, body, content: document };
  } catch {
    return {
      error: "Moment formatting could not be read. Please try again.",
      body: "",
      content: null,
    };
  }
}
