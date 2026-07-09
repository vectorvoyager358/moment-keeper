"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { SaveProgress } from "@/components/ui/SaveProgress";
import { toUserErrorMessage } from "@/lib/errors";
import { toDatetimeLocalValueFromIso } from "@/lib/moments/dates";
import type { MomentDetail } from "@/lib/moments/queries";
import { formatTagInput } from "@/lib/moments/tags";
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
        <label
          htmlFor="body"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          What happened?
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          defaultValue={moment.body}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="occurred_at"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          When did it happen?
        </label>
        <input
          id="occurred_at"
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={toDatetimeLocalValueFromIso(moment.occurred_at)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="tags"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Tags <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          defaultValue={formatTagInput(moment.tags)}
          placeholder="work, proud moment"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      <MediaFileInput
        currentFilename={moment.media?.original_filename}
        showRemove={Boolean(moment.media)}
        onValidityChange={setMediaValid}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <SaveProgress
        active={pending}
        percent={percent}
        processing={processing}
        label={
          processing ? "Upload complete — saving on server…" : "Uploading…"
        }
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!mediaValid || pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending
            ? processing
              ? "Saving..."
              : "Uploading..."
            : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
