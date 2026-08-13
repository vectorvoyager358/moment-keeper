"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { deleteMoment } from "@/app/moments/[id]/actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type DeleteMomentButtonProps = {
  momentId: string;
  className?: string;
};

export function DeleteMomentButton({
  momentId,
  className,
}: DeleteMomentButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={deleteMoment.bind(null, momentId)}>
        <Button
          type="button"
          variant="danger"
          size="sm"
          aria-label="Delete moment"
          title="Delete moment"
          className={`h-11 w-11 rounded-full px-0 ${className ?? ""}`}
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        title="Remove this moment?"
        description="It will leave your journal. You’ll have 10 seconds to undo."
        confirmLabel="Delete moment"
        cancelLabel="Keep it"
        confirmVariant="danger"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
