"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState = { error: undefined, message: undefined };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <AuthCard
      title="Welcome back to your journal"
      description="Log in to revisit your moments."
      alternateHref="/signup"
      alternateLabel="Need a journal? Create one"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-muted underline-offset-4 transition hover:text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>

        {state.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state.message ? (
          <Alert variant="success">{state.message}</Alert>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in..." : "Log in to your journal"}
        </Button>
      </form>
    </AuthCard>
  );
}
