"use client";

import { deleteMoment } from "@/app/moments/[id]/actions";

type DeleteMomentButtonProps = {
  momentId: string;
};

export function DeleteMomentButton({ momentId }: DeleteMomentButtonProps) {
  return (
    <form
      action={deleteMoment.bind(null, momentId)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this moment? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
      >
        Delete moment
      </button>
    </form>
  );
}
