"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";

import { setMomentFavorite } from "@/app/moments/[id]/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type FavoriteMomentButtonProps = {
  momentId: string;
  initialFavorite: boolean;
};

export function FavoriteMomentButton({
  momentId,
  initialFavorite,
}: FavoriteMomentButtonProps) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleFavorite() {
    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    setError(null);

    startTransition(async () => {
      const result = await setMomentFavorite(momentId, nextFavorite);
      if (result.error) {
        setFavorite(!nextFavorite);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        aria-pressed={favorite}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        title={favorite ? "Remove from favorites" : "Add to favorites"}
        onClick={toggleFavorite}
        className={cn("px-2.5", favorite && "text-accent")}
      >
        <Heart
          className={cn("h-4 w-4", favorite && "fill-current")}
          aria-hidden
        />
      </Button>
      {error ? (
        <p className="mt-1 text-right text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
