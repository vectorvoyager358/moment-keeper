"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles, Heart } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { MemoryThemePicker } from "@/components/capture/MemoryThemePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label } from "@/components/ui/Input";
import { SaveProgress } from "@/components/ui/SaveProgress";
import { toUserErrorMessage } from "@/lib/errors";
import type { MemoryTheme } from "@/lib/database.types";
import {
  clearCaptureDraft,
  readCaptureDraft,
  writeCaptureDraft,
} from "@/lib/moments/capture-draft";
import { toDatetimeLocalValue } from "@/lib/moments/dates";
import { parseMomentLinkUrl } from "@/lib/moments/link";
import {
  appendParagraphToRichText,
  plainTextToRichTextDocument,
  richTextToPlainText,
  type RichTextDocument,
} from "@/lib/moments/rich-text";
import { validateMomentBody } from "@/lib/moments/validation";
import { cn } from "@/lib/cn";
import {
  postFormDataWithProgress,
  UploadRequestError,
} from "@/lib/moments/upload-progress";

type CaptureFormProps = {
  userId: string;
};

const loadMediaFileInput = () =>
  import("@/components/capture/MediaFileInput").then(
    (module) => module.MediaFileInput,
  );

const LazyMediaFileInput = dynamic(loadMediaFileInput, {
  ssr: false,
  loading: () => (
    <p role="status" className="py-3 text-sm text-muted">
      Getting media tools ready…
    </p>
  ),
});

const loadRichTextEditor = () =>
  import("@/components/editor/RichTextEditor").then(
    (module) => module.RichTextEditor,
  );

const LazyRichTextEditor = dynamic(loadRichTextEditor, {
  ssr: false,
  loading: () => (
    <div
      className="h-56 animate-pulse rounded-xl border border-border-strong bg-surface-elevated"
      role="status"
      aria-label="Loading text editor"
    />
  ),
});

const CAPTURE_PROMPTS = [
  "What made you smile?",
  "What felt worth remembering?",
  "Who made this moment meaningful?",
] as const;

function draftUsesAddMore(draft: {
  tags: string;
  location: string;
  linkUrl: string;
  themes: MemoryTheme[];
  isFavorite: boolean;
}): boolean {
  return (
    draft.tags.trim().length > 0 ||
    draft.location.trim().length > 0 ||
    draft.linkUrl.trim().length > 0 ||
    draft.themes.length > 0 ||
    draft.isFavorite
  );
}

export function CaptureForm({ userId }: CaptureFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [bodyContent, setBodyContent] = useState<RichTextDocument | null>(null);
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [themes, setThemes] = useState<MemoryTheme[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [preparedMediaFiles, setPreparedMediaFiles] = useState<File[]>([]);
  const [preparedMediaThumbnails, setPreparedMediaThumbnails] = useState<
    (File | null)[]
  >([]);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [mediaToolsLoaded, setMediaToolsLoaded] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [mediaValid, setMediaValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [timezoneOffset] = useState(() =>
    String(new Date().getTimezoneOffset()),
  );

  useEffect(() => {
    const draft = readCaptureDraft(userId);
    let active = true;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      if (draft) {
        setBody(draft.body);
        setBodyContent(draft.bodyContent);
        setOccurredAt(draft.occurredAt);
        setTags(draft.tags);
        setLocation(draft.location ?? "");
        setLinkUrl(draft.linkUrl ?? "");
        setThemes(draft.themes);
        setIsFavorite(draft.isFavorite);
        if (draftUsesAddMore(draft)) {
          setAddMoreOpen(true);
          setMediaToolsLoaded(true);
        }
      }

      setDraftLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!draftLoaded || pending) {
      return;
    }

    const timeout = window.setTimeout(() => {
      writeCaptureDraft(userId, {
        body,
        bodyContent,
        occurredAt,
        tags,
        location,
        linkUrl,
        themes,
        isFavorite,
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    body,
    bodyContent,
    draftLoaded,
    isFavorite,
    location,
    linkUrl,
    occurredAt,
    pending,
    tags,
    themes,
    userId,
  ]);

  function handlePreparedFilesChange(files: File[]) {
    setPreparedMediaFiles(files);
    if (files.length > 0) {
      setAddMoreOpen(true);
    }
  }

  function handleAddMoreToggle() {
    if (!addMoreOpen) {
      setMediaToolsLoaded(true);
    }

    setAddMoreOpen(!addMoreOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mediaValid || pending) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const linkInput = parseMomentLinkUrl(linkUrl);
    const bodyError = validateMomentBody(body);

    if (bodyError) {
      setError(bodyError);
      return;
    }

    if (linkInput.error) {
      setError(linkInput.error);
      return;
    }

    formData.set("link_url", linkInput.url ?? "");
    if (linkInput.url) {
      setLinkUrl(linkInput.url);
    }

    formData.delete("media");
    formData.delete("media_thumbnail");
    formData.delete("media_thumbnail_index");
    preparedMediaFiles.forEach((file) => formData.append("media", file));
    preparedMediaThumbnails.forEach((thumbnail, index) => {
      if (thumbnail) {
        formData.append("media_thumbnail_index", String(index));
        formData.append("media_thumbnail", thumbnail);
      }
    });

    setError(null);
    setPending(true);
    setProcessing(false);
    setPercent(0);

    try {
      const result = await postFormDataWithProgress("/api/moments", formData, {
        onProgress: (progress) => {
          setPercent(progress.percent);
        },
        onUploadComplete: () => {
          setProcessing(true);
        },
      });

      clearCaptureDraft(userId);
      router.push(result.redirectTo ?? "/timeline?saved=1");
      router.refresh();
    } catch (submitError) {
      setPending(false);
      setProcessing(false);
      setPercent(null);
      setError(
        submitError instanceof UploadRequestError
          ? submitError.message
          : toUserErrorMessage(submitError, "Could not save your moment."),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="occurred_at_offset" value={timezoneOffset} />
      <input type="hidden" name="body" value={body} />
      <input
        type="hidden"
        name="body_content"
        value={JSON.stringify(bodyContent ?? plainTextToRichTextDocument(body))}
      />
      <div className="mb-8 space-y-3">
        <Label htmlFor="body-editor">What happened?</Label>
        <div className="rounded-2xl bg-accent-subtle/60 p-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-accent uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Need a starting point?
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {CAPTURE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="shrink-0 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-sm text-ink transition hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                onClick={() => {
                  const nextContent = appendParagraphToRichText(
                    bodyContent ?? plainTextToRichTextDocument(body),
                    prompt,
                  );
                  setBodyContent(nextContent);
                  setBody(richTextToPlainText(nextContent));
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
        <LazyRichTextEditor
          id="body-editor"
          value={{ text: body, content: bodyContent }}
          placeholder="Write a few words about this moment…"
          disabled={pending}
          onChange={(nextValue) => {
            setBody(nextValue.text);
            setBodyContent(nextValue.content);
          }}
        />
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SaveProgress
        active={pending}
        percent={percent}
        processing={processing}
        label={
          processing
            ? "Almost there — keeping your moment…"
            : "Sending your moment…"
        }
      />

      <Button
        type="submit"
        disabled={!mediaValid || pending}
        className="w-full py-2.5"
      >
        {pending ? "Capturing…" : "Capture this moment"}
      </Button>

      <div className="space-y-4">
        <button
          type="button"
          aria-expanded={addMoreOpen}
          disabled={pending}
          onPointerEnter={() => void loadMediaFileInput()}
          onFocus={() => void loadMediaFileInput()}
          onClick={handleAddMoreToggle}
          className="flex w-full items-center justify-between rounded-2xl border border-border-strong bg-surface px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
        >
          <span>Add more</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted transition",
              addMoreOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <div hidden={!addMoreOpen} className="space-y-5">
          <MemoryThemePicker
            selected={themes}
            disabled={pending}
            onChange={(nextThemes) => {
              setThemes(nextThemes);
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="occurred_at">When did it happen?</Label>
            <Input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              required
              value={occurredAt}
              onChange={(event) => {
                setOccurredAt(event.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags <span className="font-normal text-muted">(optional)</span>
            </Label>
            <Input
              id="tags"
              name="tags"
              type="text"
              placeholder="work, proud moment"
              value={tags}
              onChange={(event) => {
                setTags(event.target.value);
              }}
            />
            <FieldHint>Separate tags with commas.</FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              Location{" "}
              <span className="font-normal text-muted">(optional)</span>
            </Label>
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="Central Park, Mom's kitchen"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_url">
              Link <span className="font-normal text-muted">(optional)</span>
            </Label>
            <Input
              id="link_url"
              name="link_url"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="example.com or https://example.com"
              value={linkUrl}
              onChange={(event) => {
                setLinkUrl(event.target.value);
              }}
            />
            <FieldHint>Attach one webpage to this moment.</FieldHint>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Favorites</p>
            <label
              className={cn(
                "inline-flex cursor-pointer items-center rounded-full border p-2 transition",
                isFavorite
                  ? "border-accent bg-accent text-white"
                  : "border-border-strong bg-surface text-muted hover:border-accent/50 hover:text-accent",
                pending && "pointer-events-none opacity-60",
              )}
            >
              <input
                type="checkbox"
                name="favorite"
                value="1"
                checked={isFavorite}
                disabled={pending}
                aria-label={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
                onChange={(event) => {
                  setIsFavorite(event.target.checked);
                }}
                className="sr-only"
              />
              <Heart
                className={cn("h-4 w-4", isFavorite && "fill-current")}
                aria-hidden
              />
            </label>
          </div>

          {mediaToolsLoaded ? (
            <LazyMediaFileInput
              onValidityChange={setMediaValid}
              onPreparedFilesChange={handlePreparedFilesChange}
              onPreparedThumbnailsChange={setPreparedMediaThumbnails}
            />
          ) : null}
        </div>
      </div>
    </form>
  );
}
