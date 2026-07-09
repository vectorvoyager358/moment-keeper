"use client";

import { useActionState } from "react";

import { requestPasswordReset } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth/AuthCard";

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
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {state.message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Sending link..." : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
