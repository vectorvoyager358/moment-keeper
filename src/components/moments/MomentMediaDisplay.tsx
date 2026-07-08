import type { MomentMedia } from "@/lib/moments/detail";

type MomentMediaDisplayProps = {
  media: MomentMedia;
};

export function MomentMediaDisplay({ media }: MomentMediaDisplayProps) {
  if (media.media_type === "photo") {
    return (
      // Signed Supabase URLs are short-lived; next/image is not used here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.signedUrl}
        alt={media.original_filename ?? "Moment attachment"}
        className="max-h-96 w-full rounded-xl object-contain"
      />
    );
  }

  if (media.media_type === "video") {
    return (
      <video controls src={media.signedUrl} className="w-full rounded-xl">
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <audio controls src={media.signedUrl} className="w-full">
      Your browser does not support audio playback.
    </audio>
  );
}
