import { logout } from "@/app/auth/actions";
import { AppNav } from "@/components/AppNav";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageShell>
      <AppNav current="settings" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="Your account"
          description="Sign-in details for your private journal."
        />

        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted">
              You&apos;re signed in as
            </p>
            <p className="mt-1 text-ink">{user?.email}</p>
          </div>

          <form action={logout}>
            <Button type="submit" variant="secondary">
              Log out
            </Button>
          </form>
        </Card>

        <Card padding="lg" className="mt-6 space-y-4">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Choose a new password for signing in.
            </CardDescription>
          </CardHeader>

          <ChangePasswordForm />
        </Card>
      </main>
    </PageShell>
  );
}
