"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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

export function CaptureForm({ userId }: CaptureFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );
  const [tags, setTags] = useState("");
  const [themes, setThemes] = useState<MemoryTheme[]>([]);
  const [preparedMediaFile, setPreparedMediaFile] = useState<File | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [mediaValid, setMediaValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

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
        setDraftSaved(true);
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
      setDraftSaved(
        writeCaptureDraft(userId, { body, occurredAt, tags, themes }),
      );
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [body, draftLoaded, occurredAt, pending, tags, themes, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mediaValid || pending) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (preparedMediaFile) {
      formData.set("media", preparedMediaFile);
    }

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
      <div className="space-y-2">
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
                  setDraftSaved(false);
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
            setDraftSaved(false);
          }}
        />
      </div>

      <MemoryThemePicker
        selected={themes}
        disabled={pending}
        onChange={(nextThemes) => {
          setThemes(nextThemes);
          setDraftSaved(false);
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
            setDraftSaved(false);
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
            setDraftSaved(false);
          }}
        />
        <FieldHint>Separate tags with commas.</FieldHint>
      </div>

      {draftSaved ? (
        <p className="text-xs text-muted" role="status">
          Saved on this device for now — photos and voice memos aren&apos;t
          included.
        </p>
      ) : null}

      <MediaFileInput
        onValidityChange={setMediaValid}
        onPreparedFileChange={setPreparedMediaFile}
      />

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
        {pending ? "Keeping…" : "Keep this moment"}
      </Button>
    </form>
  );
}
