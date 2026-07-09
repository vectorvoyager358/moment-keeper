import { logout } from "@/app/auth/actions";
import { AppNav } from "@/components/AppNav";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <AppNav current="settings" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>

        <section className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Signed in as
            </p>
            <p className="mt-1 text-zinc-900 dark:text-zinc-50">
              {user?.email}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Log out
            </button>
          </form>
        </section>

        <section className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Change password
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Update the password you use to sign in.
            </p>
          </div>

          <ChangePasswordForm />
        </section>
      </main>
    </div>
  );
}
