"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  plainTextToRichTextDocument,
  richTextToPlainText,
  type RichTextDocument,
  type RichTextValue,
} from "@/lib/moments/rich-text";
import { MAX_MOMENT_BODY_LENGTH } from "@/lib/moments/validation";

type RichTextEditorProps = {
  id: string;
  value: {
    text: string;
    content: RichTextDocument | null;
  };
  onChange: (value: RichTextValue) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "bg-accent text-white shadow-sm"
          : "hover:bg-accent-subtle hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Write a few words about this moment…",
  className,
}: RichTextEditorProps) {
  const initialContent =
    value.content ?? plainTextToRichTextDocument(value.text);
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3] },
        horizontalRule: false,
        link: {
          autolink: false,
          linkOnPaste: false,
          openOnClick: false,
        },
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-required": "true",
        class:
          "min-h-40 px-4 py-3.5 text-base leading-7 text-ink outline-none sm:text-[0.9375rem]",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const content = updatedEditor.getJSON() as RichTextDocument;
      onChange({
        content,
        text: richTextToPlainText(content),
      });
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent =
      value.content ?? plainTextToRichTextDocument(value.text);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(nextContent)) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value.content, value.text]);

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      underline: currentEditor?.isActive("underline") ?? false,
      heading: currentEditor?.isActive("heading", { level: 2 }) ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
      blockquote: currentEditor?.isActive("blockquote") ?? false,
      canUndo: currentEditor?.can().undo() ?? false,
      canRedo: currentEditor?.can().redo() ?? false,
    }),
  });

  const editorDisabled = disabled || !editor;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border-strong bg-surface-elevated transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20",
        disabled && "opacity-60",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex gap-1 overflow-x-auto border-b border-border/80 bg-surface px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ToolbarButton
          label="Bold"
          active={toolbarState?.bold}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleBold().run();
          }}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={toolbarState?.italic}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleItalic().run();
          }}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={toolbarState?.underline}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleUnderline().run();
          }}
        >
          <Underline className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={toolbarState?.heading}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleHeading({ level: 2 }).run();
          }}
        >
          <Heading2 className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Bulleted list"
          active={toolbarState?.bulletList}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleBulletList().run();
          }}
        >
          <List className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={toolbarState?.orderedList}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleOrderedList().run();
          }}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={toolbarState?.blockquote}
          disabled={editorDisabled}
          onClick={() => {
            editor?.chain().focus().toggleBlockquote().run();
          }}
        >
          <Quote className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <span
          className="mx-1 h-7 w-px shrink-0 self-center bg-border"
          aria-hidden
        />
        <ToolbarButton
          label="Undo"
          disabled={editorDisabled || !toolbarState?.canUndo}
          onClick={() => {
            editor?.chain().focus().undo().run();
          }}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={editorDisabled || !toolbarState?.canRedo}
          onClick={() => {
            editor?.chain().focus().redo().run();
          }}
        >
          <Redo2 className="h-4 w-4" aria-hidden />
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className={cn(
          "[&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_.is-editor-empty:first-child::before]:float-left [&_.tiptap_.is-editor-empty:first-child::before]:h-0 [&_.tiptap_.is-editor-empty:first-child::before]:text-muted/70 [&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_blockquote]:my-3 [&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-accent/50 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_h2]:my-3 [&_.tiptap_h2]:font-display [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-semibold [&_.tiptap_h3]:my-3 [&_.tiptap_h3]:font-display [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-semibold [&_.tiptap_li]:my-1 [&_.tiptap_ol]:my-3 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_p]:my-2 [&_.tiptap_u]:underline [&_.tiptap_ul]:my-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6",
          "[&_.tiptap_a]:cursor-pointer [&_.tiptap_a]:font-medium [&_.tiptap_a]:text-accent [&_.tiptap_a]:underline [&_.tiptap_a]:underline-offset-2",
        )}
      />

      <div className="flex justify-end border-t border-border/70 px-3 py-1.5 text-xs text-muted">
        {value.text.length.toLocaleString()} /{" "}
        {MAX_MOMENT_BODY_LENGTH.toLocaleString()}
      </div>
    </div>
  );
}
