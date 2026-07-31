import { ExternalLink, Link2 } from "lucide-react";

import { getMomentLinkHostname } from "@/lib/moments/link";

type MomentLinkProps = {
  url: string;
};

export function MomentLink({ url }: MomentLinkProps) {
  const hostname = getMomentLinkHostname(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open link to ${hostname} in a new tab`}
      className="group/link flex min-w-0 items-center gap-3 rounded-2xl bg-accent-subtle/45 p-3.5 ring-1 ring-border/55 transition hover:bg-accent-subtle hover:ring-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent shadow-sm">
        <Link2 className="h-4.5 w-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">
          {hostname}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">{url}</span>
      </span>
      <ExternalLink
        className="h-4 w-4 shrink-0 text-muted transition group-hover/link:text-accent"
        aria-hidden
      />
    </a>
  );
}
