import { formatMomentDate } from "@/lib/moments/dates";
import type { MomentDetail } from "@/lib/moments/queries";

import { MomentMediaDisplay } from "@/components/moments/MomentMediaDisplay";

type MomentDetailViewProps = {
  moment: MomentDetail;
  onEdit: () => void;
};

export function MomentDetailView({ moment, onEdit }: MomentDetailViewProps) {
  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <time
          dateTime={moment.occurred_at}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          {formatMomentDate(moment.occurred_at)}
        </time>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Edit
        </button>
      </div>

      <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-900 dark:text-zinc-50">
        {moment.body}
      </p>

      {moment.media ? <MomentMediaDisplay media={moment.media} /> : null}

      {moment.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {moment.tags.map((tag) => (
            <li
              key={tag.id}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {tag.name}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
