"use client";

import { Button } from "@/components/ui/Button";

export function OfflineReloadButton() {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        window.location.reload();
      }}
    >
      Try again
    </Button>
  );
}
