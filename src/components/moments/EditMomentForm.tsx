"use client";

import { useActionState } from "react";

import { updateMoment } from "@/app/moments/[id]/actions";
import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { toDatetimeLocalValueFromIso } from "@/lib/moments/dates";
import type { MomentDetail } from "@/lib/moments/queries";
import { formatTagInput } from "@/lib/moments/tags";

const initialState = { error: undefined };

type EditMomentFormProps = {
  moment: MomentDetail;
  onCancel: () => void;
};

export function EditMomentForm({ moment, onCancel }: EditMomentFormProps) {
  const updateAction = updateMoment.bind(null, moment.id);
  const [state, formAction] = useActionState(updateAction, initialState);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-5"
    >
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
      />

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <SubmitButton
          label="Save changes"
          pendingLabel="Saving..."
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
