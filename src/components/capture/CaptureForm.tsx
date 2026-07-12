"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles, Heart } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { MemoryThemePicker } from "@/components/capture/MemoryThemePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/Input";
import { SaveProgress } from "@/components/ui/SaveProgress";
import { toUserErrorMessage } from "@/lib/errors";
import type { MemoryTheme } from "@/lib/database.types";
import {
  clearCaptureDraft,
  readCaptureDraft,
  writeCaptureDraft,
} from "@/lib/moments/capture-draft";
import { toDatetimeLocalValue } from "@/lib/moments/dates";
import { cn } from "@/lib/cn";
import {
  postFormDataWithProgress,
  UploadRequestError,
} from "@/lib/moments/upload-progress";

type CaptureFormProps = {
  userId: string;
};

const CAPTURE_PROMPTS = [
  "What made you smile?",
  "What felt worth remembering?",
  "Who made this moment meaningful?",
] as const;

function draftUsesAddMore(draft: {
  tags: string;
  themes: MemoryTheme[];
  isFavorite: boolean;
}): boolean {
  return (
    draft.tags.trim().length > 0 || draft.themes.length > 0 || draft.isFavorite
  );
}

export function CaptureForm({ userId }: CaptureFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );
  const [tags, setTags] = useState("");
  const [themes, setThemes] = useState<MemoryTheme[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [preparedMediaFiles, setPreparedMediaFiles] = useState<File[]>([]);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
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
        setOccurredAt(draft.occurredAt);
        setTags(draft.tags);
        setThemes(draft.themes);
        setIsFavorite(draft.isFavorite);
        if (draftUsesAddMore(draft)) {
          setAddMoreOpen(true);
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
        occurredAt,
        tags,
        themes,
        isFavorite,
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    body,
    draftLoaded,
    isFavorite,
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mediaValid || pending) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    formData.delete("media");
    preparedMediaFiles.forEach((file) => formData.append("media", file));

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
      <div className="mb-8 space-y-3">
        <Label htmlFor="body">What happened?</Label>
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
                  setBody((current) =>
                    current.trim()
                      ? `${current.trimEnd()}\n\n${prompt}\n\n`
                      : `${prompt}\n\n`,
                  );
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          id="body"
          name="body"
          required
          rows={7}
          placeholder="Write a few words about this moment…"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
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
          onClick={() => setAddMoreOpen((open) => !open)}
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

          <MediaFileInput
            onValidityChange={setMediaValid}
            onPreparedFilesChange={handlePreparedFilesChange}
          />
        </div>
      </div>
    </form>
  );
}
