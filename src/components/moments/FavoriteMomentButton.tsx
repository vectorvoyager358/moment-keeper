"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";

import { setMomentFavorite } from "@/app/moments/[id]/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type FavoriteMomentButtonProps = {
  momentId: string;
  initialFavorite: boolean;
  appearance?: "default" | "overlay";
};

export function FavoriteMomentButton({
  momentId,
  initialFavorite,
  appearance = "default",
}: FavoriteMomentButtonProps) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [animateFavorite, setAnimateFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleFavorite() {
    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    setAnimateFavorite(nextFavorite);
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
        className={cn(
          "h-11 w-11 rounded-full px-0",
          appearance === "overlay" &&
            "!border-white/20 !bg-ink/50 shadow-lg backdrop-blur-md hover:!bg-ink/65",
          appearance === "overlay" && !favorite && "!text-white",
          favorite && "!text-[#ed4956]",
        )}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          {animateFavorite ? (
            <span className="favorite-heart-burst" aria-hidden />
          ) : null}
          <Heart
            className={cn(
              "relative z-10 h-5 w-5 transition-[color,transform] duration-200",
              favorite &&
                "fill-current drop-shadow-[0_2px_6px_rgba(237,73,86,0.4)]",
              animateFavorite && "animate-heart-pop",
            )}
            onAnimationEnd={() => setAnimateFavorite(false)}
            aria-hidden
          />
        </span>
      </Button>
      {error ? (
        <p className="mt-1 text-right text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
