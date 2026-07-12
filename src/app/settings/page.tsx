import { logout } from "@/app/auth/actions";
import { AppNav } from "@/components/AppNav";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { ProfileNameForm } from "@/components/settings/ProfileNameForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { toUserErrorMessage } from "@/lib/errors";
import { getUserProfile } from "@/lib/profile/queries";

type SettingsPageProps = {
  searchParams: Promise<{
    profileSaved?: string | string[];
    setup?: string | string[];
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const rawParams = await searchParams;
  const showProfileSavedToast = rawParams.profileSaved === "1";
  let profile;

  try {
    profile = await getUserProfile();
  } catch (error) {
    throw new Error(toUserErrorMessage(error, "Could not load your profile."));
  }

  if (!profile) {
    throw new Error("You must be signed in to view settings.");
  }

  const needsProfileName = !profile.hasDisplayName;

  return (
    <PageShell>
      <AppNav current="settings" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title={needsProfileName ? "Welcome" : "Your account"}
          description={
            needsProfileName
              ? "Choose a name before you start journaling."
              : "Sign-in details for your private journal. Your moments are private to you."
          }
        />

        <SavedToast
          initialVisible={showProfileSavedToast}
          message="Profile name saved."
          queryParam="profileSaved"
          autoDismissMs={3000}
        />

        {needsProfileName ? (
          <Alert className="mb-6">
            A profile name is required to use Moment Keeper.
          </Alert>
        ) : null}

        <Card padding="lg" className="space-y-4">
          <CardHeader>
            <CardTitle>Profile name</CardTitle>
          </CardHeader>

          <ProfileNameForm
            key={profile.displayName}
            initialDisplayName={profile.displayName}
            setup={needsProfileName}
          />
        </Card>

        <Card padding="lg" className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-muted">
              You&apos;re signed in as
            </p>
            <p className="mt-1 font-display text-lg text-ink">
              {profile.displayName || profile.email}
            </p>
            {profile.displayName ? (
              <p className="mt-1 text-sm text-muted">{profile.email}</p>
            ) : null}
          </div>

          <form action={logout}>
            <Button type="submit" variant="secondary">
              Log out
            </Button>
          </form>
        </Card>

        {needsProfileName ? null : (
          <Card padding="lg" className="mt-6 space-y-4">
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Choose a new password for signing in.
              </CardDescription>
            </CardHeader>

            <ChangePasswordForm />
          </Card>
        )}
      </main>
    </PageShell>
  );
}
