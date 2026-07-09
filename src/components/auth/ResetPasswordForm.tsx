"use client";

import { useActionState } from "react";

import { updatePassword } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState = { error: undefined, message: undefined };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <AuthCard
      title="Choose a new password"
      description="Enter a new password for your account."
      alternateHref="/login"
      alternateLabel="Back to log in"
    >
      <form action={formAction} className="space-y-4">
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
          <Label htmlFor="confirmPassword">Confirm password</Label>
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

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
