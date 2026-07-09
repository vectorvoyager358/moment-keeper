"use client";

import { deleteMoment } from "@/app/moments/[id]/actions";
import { Button } from "@/components/ui/Button";

type DeleteMomentButtonProps = {
  momentId: string;
};

export function DeleteMomentButton({ momentId }: DeleteMomentButtonProps) {
  return (
    <form
      action={deleteMoment.bind(null, momentId)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this moment? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger">
        Delete moment
      </Button>
    </form>
  );
}
