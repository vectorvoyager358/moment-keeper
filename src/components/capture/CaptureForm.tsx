"use client";

import { useActionState, useState } from "react";

import { createMoment } from "@/app/capture/actions";
import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { toDatetimeLocalValue } from "@/lib/moments/dates";

const initialState = { error: undefined };

export function CaptureForm() {
  const [state, formAction] = useActionState(createMoment, initialState);
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );

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
          rows={5}
          placeholder="Someone complimented my presentation today..."
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
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
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
          placeholder="work, proud moment"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Separate tags with commas.
        </p>
      </div>

      <MediaFileInput />

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <SubmitButton
        label="Save moment"
        pendingLabel="Saving..."
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      />
    </form>
  );
}
