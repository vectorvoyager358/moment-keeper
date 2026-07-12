"use client";

import { useActionState } from "react";

import { signup } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldHint, Input, Label } from "@/components/ui/Input";
import { MAX_PROFILE_NAME_LENGTH } from "@/lib/profile/validation";

const initialState = { error: undefined, message: undefined };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <AuthCard
      title="Start your private journal"
      description="A quiet place for the moments you want to keep."
      alternateHref="/login"
      alternateLabel="Already have a journal? Log in"
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Your name</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            maxLength={MAX_PROFILE_NAME_LENGTH}
            placeholder="What should we call you?"
          />
          <FieldHint>
            Required. Up to {MAX_PROFILE_NAME_LENGTH} characters.
          </FieldHint>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.message ? (
          <Alert variant="success">{state.message}</Alert>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating your journal..." : "Create journal"}
        </Button>
      </form>
    </AuthCard>
  );
}
