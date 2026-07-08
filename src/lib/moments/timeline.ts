export type TimelineMoment = {
  id: string;
  body: string;
  occurred_at: string;
  tags: { id: string; name: string }[];
  hasMedia: boolean;
};

export type TimelineQueryRow = {
  id: string;
  body: string;
  occurred_at: string;
  moment_tags:
    | {
        tags:
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
      }[]
    | null;
  media_attachments: { id: string }[] | null;
};

export function mapTimelineRow(moment: TimelineQueryRow): TimelineMoment {
  const tags = (moment.moment_tags ?? []).flatMap((link) => {
    if (!link.tags) {
      return [];
    }

    return Array.isArray(link.tags) ? link.tags : [link.tags];
  });

  return {
    id: moment.id,
    body: moment.body,
    occurred_at: moment.occurred_at,
    tags,
    hasMedia: (moment.media_attachments ?? []).length > 0,
  };
}
