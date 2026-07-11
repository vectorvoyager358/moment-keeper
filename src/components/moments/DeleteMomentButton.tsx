"use client";

import { useRef, useState } from "react";

import { deleteMoment } from "@/app/moments/[id]/actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type DeleteMomentButtonProps = {
  momentId: string;
};

export function DeleteMomentButton({ momentId }: DeleteMomentButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={deleteMoment.bind(null, momentId)}>
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          Delete moment
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        title="Remove this moment?"
        description="It will leave your journal for good, including any photos or voice memos kept with it."
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
