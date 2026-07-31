"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useState, type FormEvent } from "react";

import { MediaFileInput } from "@/components/capture/MediaFileInput";
import { MemoryThemePicker } from "@/components/capture/MemoryThemePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label } from "@/components/ui/Input";
import { SaveProgress } from "@/components/ui/SaveProgress";
import { toUserErrorMessage } from "@/lib/errors";
import type { MemoryTheme } from "@/lib/database.types";
import { toDatetimeLocalValueFromIso } from "@/lib/moments/dates";
import { parseMomentLinkUrl } from "@/lib/moments/link";
import {
  plainTextToRichTextDocument,
  type RichTextDocument,
} from "@/lib/moments/rich-text";
import type { MomentDetail } from "@/lib/moments/queries";
import { formatTagInput } from "@/lib/moments/tags";
import { validateMomentBody } from "@/lib/moments/validation";
import { cn } from "@/lib/cn";
import {
  postFormDataWithProgress,
  UploadRequestError,
} from "@/lib/moments/upload-progress";

type EditMomentFormProps = {
  moment: MomentDetail;
  onCancel: () => void;
  onSaved: () => void;
  returnTo?: string;
};

const LazyRichTextEditor = dynamic(
  () =>
    import("@/components/editor/RichTextEditor").then(
      (module) => module.RichTextEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-56 animate-pulse rounded-xl border border-border-strong bg-surface-elevated"
        role="status"
        aria-label="Loading text editor"
      />
    ),
  },
);

export function EditMomentForm({
  moment,
  onCancel,
  onSaved,
  returnTo,
}: EditMomentFormProps) {
  const router = useRouter();
  const [body, setBody] = useState(moment.body);
  const [bodyContent, setBodyContent] = useState<RichTextDocument | null>(
    moment.body_content ?? null,
  );
  const [themes, setThemes] = useState<MemoryTheme[]>(moment.themes);
  const [isFavorite, setIsFavorite] = useState(moment.is_favorite);
  const [linkUrl, setLinkUrl] = useState(moment.link_url ?? "");
  const [preparedMediaFiles, setPreparedMediaFiles] = useState<File[]>([]);
  const [preparedMediaThumbnails, setPreparedMediaThumbnails] = useState<
    (File | null)[]
  >([]);
  const [mediaValid, setMediaValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [timezoneOffset] = useState(() =>
    String(new Date().getTimezoneOffset()),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mediaValid || pending) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const linkInput = parseMomentLinkUrl(linkUrl);
    const bodyError = validateMomentBody(body);

    if (bodyError) {
      setError(bodyError);
      return;
    }

    if (linkInput.error) {
      setError(linkInput.error);
      return;
    }

    formData.set("link_url", linkInput.url ?? "");
    if (linkInput.url) {
      setLinkUrl(linkInput.url);
    }

    formData.delete("media");
    formData.delete("media_thumbnail");
    formData.delete("media_thumbnail_index");
    preparedMediaFiles.forEach((file) => formData.append("media", file));
    preparedMediaThumbnails.forEach((thumbnail, index) => {
      if (thumbnail) {
        formData.append("media_thumbnail_index", String(index));
        formData.append("media_thumbnail", thumbnail);
      }
    });

    setError(null);
    setPending(true);
    setProcessing(false);
    setPercent(0);

    try {
      const result = await postFormDataWithProgress(
        `/api/moments/${moment.id}`,
        formData,
        {
          onProgress: (progress) => {
            setPercent(progress.percent);
          },
          onUploadComplete: () => {
            setProcessing(true);
          },
        },
      );

      setPending(false);
      setProcessing(false);
      setPercent(null);
      onSaved();
      const redirectTo = result.redirectTo ?? `/moments/${moment.id}?updated=1`;
      router.push(
        returnTo
          ? `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}from=${encodeURIComponent(returnTo)}`
          : redirectTo,
      );
      router.refresh();
    } catch (submitError) {
      setPending(false);
      setProcessing(false);
      setPercent(null);
      setError(
        submitError instanceof UploadRequestError
          ? submitError.message
          : toUserErrorMessage(submitError, "Could not update your moment."),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="occurred_at_offset" value={timezoneOffset} />
      <input type="hidden" name="body" value={body} />
      <input
        type="hidden"
        name="body_content"
        value={JSON.stringify(bodyContent ?? plainTextToRichTextDocument(body))}
      />
      <div className="space-y-2">
        <Label htmlFor="edit-body-editor">What happened?</Label>
        <LazyRichTextEditor
          id="edit-body-editor"
          value={{ text: body, content: bodyContent }}
          disabled={pending}
          onChange={(nextValue) => {
            setBody(nextValue.text);
            setBodyContent(nextValue.content);
          }}
        />
      </div>

      <MemoryThemePicker
        selected={themes}
        onChange={setThemes}
        disabled={pending}
      />

      <div className="space-y-2">
        <Label htmlFor="occurred_at">When did it happen?</Label>
        <Input
          id="occurred_at"
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={toDatetimeLocalValueFromIso(moment.occurred_at)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">
          Tags <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input
          id="tags"
          name="tags"
          type="text"
          defaultValue={formatTagInput(moment.tags)}
          placeholder="work, proud moment"
        />
        <FieldHint>Separate tags with commas.</FieldHint>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">
          Location <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input
          id="location"
          name="location"
          type="text"
          defaultValue={moment.location ?? ""}
          placeholder="Central Park, Mom's kitchen"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link_url">
          Link <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input
          id="link_url"
          name="link_url"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="example.com or https://example.com"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Favorites</p>
        <label
          className={cn(
            "inline-flex cursor-pointer items-center rounded-full border p-2 transition",
            isFavorite
              ? "border-accent bg-accent text-white"
              : "border-border-strong bg-surface text-muted hover:border-accent/50 hover:text-accent",
            pending && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="checkbox"
            name="favorite"
            value="1"
            checked={isFavorite}
            disabled={pending}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            onChange={(event) => setIsFavorite(event.target.checked)}
            className="sr-only"
          />
          <Heart
            className={cn("h-4 w-4", isFavorite && "fill-current")}
            aria-hidden
          />
        </label>
      </div>

      <MediaFileInput
        existingMedia={moment.media}
        onValidityChange={setMediaValid}
        onPreparedFilesChange={setPreparedMediaFiles}
        onPreparedThumbnailsChange={setPreparedMediaThumbnails}
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SaveProgress
        active={pending}
        percent={percent}
        processing={processing}
        label={
          processing
            ? "Almost there — keeping your changes…"
            : "Sending your changes…"
        }
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={!mediaValid || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
