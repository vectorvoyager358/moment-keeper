"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useState, type FormEvent } from "react";

import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { MemoryThemePicker } from "@/components/capture/MemoryThemePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/Input";
import { SaveProgress } from "@/components/ui/SaveProgress";
import { toUserErrorMessage } from "@/lib/errors";
import type { MemoryTheme } from "@/lib/database.types";
import { toDatetimeLocalValueFromIso } from "@/lib/moments/dates";
import type { MomentDetail } from "@/lib/moments/queries";
import { formatTagInput } from "@/lib/moments/tags";
import { cn } from "@/lib/cn";
import {
  postFormDataWithProgress,
  UploadRequestError,
} from "@/lib/moments/upload-progress";

type EditMomentFormProps = {
  moment: MomentDetail;
  onCancel: () => void;
};

export function EditMomentForm({ moment, onCancel }: EditMomentFormProps) {
  const router = useRouter();
  const [themes, setThemes] = useState<MemoryTheme[]>(moment.themes);
  const [isFavorite, setIsFavorite] = useState(moment.is_favorite);
  const [preparedMediaFiles, setPreparedMediaFiles] = useState<File[]>([]);
  const [mediaValid, setMediaValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

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
      const result = await postFormDataWithProgress(
        `/api/moments/${moment.id}`,
        formData,
        {
          onProgress: (progress) => {
            setPercent(progress.percent);
          },
          onUploadComplete: () => {
            setProcessing(true);
          },
        },
      );

      router.push(result.redirectTo ?? `/moments/${moment.id}`);
      router.refresh();
    } catch (submitError) {
      setPending(false);
      setProcessing(false);
      setPercent(null);
      setError(
        submitError instanceof UploadRequestError
          ? submitError.message
          : toUserErrorMessage(submitError, "Could not update your moment."),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="body">What happened?</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={6}
          defaultValue={moment.body}
        />
      </div>

      <MemoryThemePicker
        selected={themes}
        onChange={setThemes}
        disabled={pending}
      />

      <div className="space-y-2">
        <Label htmlFor="occurred_at">When did it happen?</Label>
        <Input
          id="occurred_at"
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={toDatetimeLocalValueFromIso(moment.occurred_at)}
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
          defaultValue={formatTagInput(moment.tags)}
          placeholder="work, proud moment"
        />
        <FieldHint>Separate tags with commas.</FieldHint>
      </div>

      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
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
          aria-label="Keep close"
          onChange={(event) => setIsFavorite(event.target.checked)}
          className="sr-only"
        />
        <Heart
          className={cn("h-3.5 w-3.5", isFavorite && "fill-current")}
          aria-hidden
        />
        {isFavorite ? null : <span aria-hidden="true">Keep close</span>}
      </label>

      <MediaFileInput
        existingMedia={moment.media}
        onValidityChange={setMediaValid}
        onPreparedFilesChange={setPreparedMediaFiles}
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SaveProgress
        active={pending}
        percent={percent}
        processing={processing}
        label={
          processing
            ? "Almost there — keeping your changes…"
            : "Sending your changes…"
        }
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={!mediaValid || pending}>
          {pending ? "Keeping…" : "Keep changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
