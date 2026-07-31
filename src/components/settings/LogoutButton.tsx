"use client";

import { LogOut } from "lucide-react";
import { useRef, useState } from "react";

import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function LogoutButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={logout}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Log out"
          title="Log out"
          className="size-10 shrink-0 rounded-full px-0 text-muted"
          onClick={() => setOpen(true)}
        >
          <LogOut className="size-5" aria-hidden />
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        title="Log out?"
        description="You’ll need to sign in again to return to your journal."
        confirmLabel="Log out"
        cancelLabel="Stay here"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
