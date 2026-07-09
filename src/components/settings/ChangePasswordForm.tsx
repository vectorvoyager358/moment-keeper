"use client";

import { useActionState } from "react";

import { changePassword } from "@/app/auth/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState = { error: undefined, message: undefined };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.message ? <Alert variant="success">{state.message}</Alert> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
}
