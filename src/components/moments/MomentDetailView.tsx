import Link from "next/link";

import type { MomentDetail } from "@/lib/moments/queries";
import { memoryThemeLabel } from "@/lib/moments/themes";

import { MomentDate } from "@/components/moments/MomentDate";
import { MomentMediaDisplay } from "@/components/moments/MomentMediaDisplay";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

type MomentDetailViewProps = {
  moment: MomentDetail;
  onEdit: () => void;
};

export function MomentDetailView({ moment, onEdit }: MomentDetailViewProps) {
  const visualMedia = moment.media.filter(
    (media) => media.media_type === "photo" || media.media_type === "video",
  );
  const audioMedia = moment.media.filter(
    (media) => media.media_type === "audio",
  );

  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <MomentDate
          iso={moment.occurred_at}
          className="font-display text-sm font-medium text-muted"
        />
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>

      {visualMedia.length > 0 ? (
        <div
          className={visualMedia.length > 1 ? "grid gap-3 sm:grid-cols-2" : ""}
        >
          {visualMedia.map((media) => (
            <MomentMediaDisplay key={media.id} media={media} />
          ))}
        </div>
      ) : null}

      <p className="whitespace-pre-wrap font-display text-xl leading-8 text-ink">
        {moment.body}
      </p>

      {audioMedia.length > 0 ? (
        <div className="space-y-3">
          {audioMedia.map((media) => (
            <MomentMediaDisplay key={media.id} media={media} />
          ))}
        </div>
      ) : null}

      {moment.themes.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Memory themes">
          {moment.themes.map((theme) => (
            <li key={theme}>
              <Link
                href={`/timeline?theme=${theme}`}
                className="inline-flex rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {memoryThemeLabel(theme)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {moment.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {moment.tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/timeline?tag=${encodeURIComponent(tag.id)}`}
                aria-label={`See moments tagged ${tag.name}`}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Tag className="hover:bg-accent-subtle hover:text-accent">
                  {tag.name}
                </Tag>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
