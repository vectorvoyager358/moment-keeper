import Link from "next/link";

import type { MomentDetail } from "@/lib/moments/queries";
import { memoryThemeLabel } from "@/lib/moments/themes";

import { MomentDate } from "@/components/moments/MomentDate";
import { FavoriteMomentButton } from "@/components/moments/FavoriteMomentButton";
import { MomentLocation } from "@/components/moments/MomentLocation";
import { MomentLink } from "@/components/moments/MomentLink";
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
      <header className="space-y-3 border-b border-border/70 pb-4">
        <MomentDate
          iso={moment.occurred_at}
          className="block font-display text-sm font-medium text-muted"
        />
        {moment.location ? <MomentLocation location={moment.location} /> : null}
        <div className="flex items-center justify-end gap-2">
          <FavoriteMomentButton
            momentId={moment.id}
            initialFavorite={moment.is_favorite}
          />
          <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </header>

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

      {moment.link_url ? <MomentLink url={moment.link_url} /> : null}

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
