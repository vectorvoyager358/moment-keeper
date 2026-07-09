"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/Input";
import { SaveProgress } from "@/components/ui/SaveProgress";
import { toUserErrorMessage } from "@/lib/errors";
import { toDatetimeLocalValue } from "@/lib/moments/dates";
import {
  postFormDataWithProgress,
  UploadRequestError,
} from "@/lib/moments/upload-progress";

export function CaptureForm() {
  const router = useRouter();
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );
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
        <Textarea
          id="body"
          name="body"
          required
          rows={5}
          placeholder="Someone complimented my presentation today..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occurred_at">When did it happen?</Label>
        <Input
          id="occurred_at"
          name="occurred_at"
          type="datetime-local"
          required
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
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
        />
        <FieldHint>Separate tags with commas.</FieldHint>
      </div>

      <MediaFileInput onValidityChange={setMediaValid} />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SaveProgress
        active={pending}
        percent={percent}
        processing={processing}
        label={
          processing ? "Upload complete — saving on server…" : "Uploading…"
        }
      />

      <Button
        type="submit"
        disabled={!mediaValid || pending}
        className="w-full py-2.5"
      >
        {pending ? (processing ? "Saving..." : "Uploading...") : "Save moment"}
      </Button>
    </form>
  );
}
