"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";

type MediaDownloadButtonProps = {
  src: string;
  filename: string;
  appearance?: "inline" | "overlay";
  className?: string;
};

function triggerDownload(href: string, filename: string, openInNewTab = false) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";

  if (openInNewTab) {
    anchor.target = "_blank";
  }

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function MediaDownloadButton({
  src,
  filename,
  appearance = "inline",
  className,
}: MediaDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) {
      return;
    }

    setDownloading(true);
    let objectUrl: string | null = null;

    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error("Download failed.");
      }

      objectUrl = URL.createObjectURL(await response.blob());
      triggerDownload(objectUrl, filename);
    } catch {
      triggerDownload(src, filename, true);
    } finally {
      if (objectUrl) {
        const objectUrlToRevoke = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrlToRevoke), 0);
      }
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={
        downloading ? `Downloading ${filename}` : `Download ${filename}`
      }
      title={downloading ? "Downloading…" : "Download"}
      disabled={downloading}
      onClick={() => void handleDownload()}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-70",
        appearance === "overlay"
          ? "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/60"
          : "text-muted hover:bg-surface hover:text-accent focus-visible:ring-accent/40",
        className,
      )}
    >
      {downloading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
