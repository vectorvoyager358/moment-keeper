import { formatMomentDate } from "@/lib/moments/dates";
import type { MomentDetail } from "@/lib/moments/queries";

import { MomentMediaDisplay } from "@/components/moments/MomentMediaDisplay";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

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
          className="font-display text-sm font-medium text-muted"
        >
          {formatMomentDate(moment.occurred_at)}
        </time>
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>

      <p className="whitespace-pre-wrap text-lg leading-relaxed text-ink">
        {moment.body}
      </p>

      {moment.media ? <MomentMediaDisplay media={moment.media} /> : null}

      {moment.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {moment.tags.map((tag) => (
            <li key={tag.id}>
              <Tag>{tag.name}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
