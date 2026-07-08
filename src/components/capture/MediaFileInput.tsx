type MediaFileInputProps = {
  id?: string;
  currentFilename?: string | null;
  showRemove?: boolean;
};

export function MediaFileInput({
  id = "media",
  currentFilename,
  showRemove = false,
}: MediaFileInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Photo, video, or audio{" "}
        <span className="font-normal text-zinc-500">(optional)</span>
      </label>

      {currentFilename ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Current file: <span className="font-medium">{currentFilename}</span>
        </p>
      ) : null}

      <input
        id={id}
        name="media"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
        className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
      />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Max 10 MB photos, 50 MB video, 25 MB audio.
      </p>

      {showRemove && currentFilename ? (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="remove_media"
            className="rounded border-zinc-300 dark:border-zinc-700"
          />
          Remove current attachment
        </label>
      ) : null}
    </div>
  );
}
