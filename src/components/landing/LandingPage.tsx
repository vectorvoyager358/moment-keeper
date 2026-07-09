import { BookOpen, Camera, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";

const highlights = [
  {
    icon: Camera,
    title: "Capture in seconds",
    description: "A few words, a photo, or a voice note — save what mattered without a daily journaling ritual.",
  },
  {
    icon: Sparkles,
    title: "Revisit what lasts",
    description: "Browse your timeline or see memories resurface on the same date in past years.",
  },
  {
    icon: Lock,
    title: "Private by default",
    description: "Your moments stay yours. Sign in to access your personal archive.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-full bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="inline-flex items-center gap-2.5 text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-subtle text-accent">
            <BookOpen className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Moment Keeper
          </span>
        </div>
        <Link
          href="/login"
          className={buttonClassName({ variant: "ghost", size: "sm" })}
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-8">
        <section className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-wide text-accent uppercase">
            A home for life&apos;s moments
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Keep the moments that matter — without the pressure of a daily diary.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Moment Keeper is a warm, private place to save meaningful memories
            when they happen and find them again when you need them.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={buttonClassName({ size: "md" })}>
              Get started free
            </Link>
            <Link
              href="/login"
              className={buttonClassName({ variant: "secondary", size: "md" })}
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-card"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
