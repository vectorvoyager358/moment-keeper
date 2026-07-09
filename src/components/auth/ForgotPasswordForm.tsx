"use client";

import { useActionState } from "react";

import { requestPasswordReset } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState = { error: undefined, message: undefined };

type ForgotPasswordFormProps = {
  initialError?: string;
};

export function ForgotPasswordForm({ initialError }: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  const error = state.error ?? initialError;

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send a reset link if an account exists."
      alternateHref="/login"
      alternateLabel="Back to log in"
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {state.message ? (
          <Alert variant="success">{state.message}</Alert>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
