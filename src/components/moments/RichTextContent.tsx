import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  normalizeRichTextDocument,
  normalizeRichTextLinkUrl,
  type RichTextMark,
  type RichTextNode,
} from "@/lib/moments/rich-text";

type RichTextContentProps = {
  body: string;
  content?: unknown;
  className?: string;
};

function renderMarkedText(
  text: string,
  marks: RichTextMark[] = [],
  key: string,
): ReactNode {
  return marks.reduce<ReactNode>((child, mark, index) => {
    const markKey = `${key}-mark-${index}`;

    if (mark.type === "bold") {
      return <strong key={markKey}>{child}</strong>;
    }

    if (mark.type === "italic") {
      return <em key={markKey}>{child}</em>;
    }

    if (mark.type === "underline") {
      return <u key={markKey}>{child}</u>;
    }

    const href = normalizeRichTextLinkUrl(mark.attrs?.href ?? "");
    if (!href) {
      return child;
    }

    return (
      <a key={markKey} href={href} target="_blank" rel="noopener noreferrer">
        {child}
      </a>
    );
  }, text);
}

function renderChildren(node: RichTextNode, key: string): ReactNode[] {
  return (node.content ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`),
  );
}

function renderNode(node: RichTextNode, key: string): ReactNode {
  if (node.type === "text") {
    return renderMarkedText(node.text ?? "", node.marks, key);
  }

  if (node.type === "hardBreak") {
    return <br key={key} />;
  }

  if (node.type === "paragraph") {
    return <p key={key}>{renderChildren(node, key)}</p>;
  }

  if (node.type === "heading") {
    return node.attrs?.level === 3 ? (
      <h3 key={key}>{renderChildren(node, key)}</h3>
    ) : (
      <h2 key={key}>{renderChildren(node, key)}</h2>
    );
  }

  if (node.type === "bulletList") {
    return <ul key={key}>{renderChildren(node, key)}</ul>;
  }

  if (node.type === "orderedList") {
    return (
      <ol key={key} start={node.attrs?.start}>
        {renderChildren(node, key)}
      </ol>
    );
  }

  if (node.type === "listItem") {
    return <li key={key}>{renderChildren(node, key)}</li>;
  }

  if (node.type === "blockquote") {
    return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
  }

  return null;
}

export function RichTextContent({
  body,
  content,
  className,
}: RichTextContentProps) {
  const document = normalizeRichTextDocument(content);

  if (!document) {
    return (
      <p
        className={cn(
          "max-w-[42rem] whitespace-pre-wrap text-[1.0625rem] leading-7 tracking-[-0.01em] text-ink/90 sm:text-lg sm:leading-8",
          className,
        )}
      >
        {body}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "max-w-[42rem] text-[1.0625rem] leading-7 tracking-[-0.01em] text-ink/90 sm:text-lg sm:leading-8",
        "[&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:decoration-accent/40 [&_a]:underline-offset-4 hover:[&_a]:decoration-accent",
        "[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-accent/50 [&_blockquote]:pl-5 [&_blockquote]:text-ink/75",
        "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-ink sm:[&_h2]:text-3xl",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:text-ink sm:[&_h3]:text-2xl",
        "[&_li]:my-1.5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7",
        className,
      )}
    >
      {(document.content ?? []).map((node, index) =>
        renderNode(node, `rich-text-${index}`),
      )}
    </div>
  );
}
