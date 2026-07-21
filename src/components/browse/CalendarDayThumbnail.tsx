type CalendarDayThumbnailProps = {
  src: string;
};

export function CalendarDayThumbnail({ src }: CalendarDayThumbnailProps) {
  return (
    <>
      {/* Calendar photos use the known-good original so they also work without client JS. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
    </>
  );
}
