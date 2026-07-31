import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { ProfileNameForm } from "@/components/settings/ProfileNameForm";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import {
  PageContainer,
  PageHeader,
  PageShell,
} from "@/components/ui/PageShell";
import { SavedToast } from "@/components/ui/SavedToast";
import { toUserErrorMessage } from "@/lib/errors";
import { getUserProfile } from "@/lib/profile/queries";
import { ChevronDown, CircleUserRound, LockKeyhole, Mail } from "lucide-react";

type SettingsPageProps = {
  searchParams: Promise<{
    profileSaved?: string | string[];
    setup?: string | string[];
  }>;
};

function getProfileInitials(displayName: string, email: string) {
  const source = displayName.trim() || email.split("@")[0] || "M";
  const words = source.split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

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
  const profileInitials = getProfileInitials(
    profile.displayName,
    profile.email,
  );

  return (
    <PageShell>
      <PageContainer size="lg">
        <PageHeader
          title={needsProfileName ? "Welcome" : "Your account"}
          description={
            needsProfileName
              ? "Choose a name before you start journaling."
              : undefined
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

        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-4 bg-accent-subtle/45 p-5 sm:gap-5 sm:p-7">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent font-display text-xl font-semibold text-white shadow-sm sm:size-16 sm:text-2xl"
              aria-hidden
            >
              {profileInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-semibold text-ink sm:text-2xl">
                {profile.displayName || "Set up your profile"}
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm text-muted">
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{profile.email}</span>
                </p>
                <LogoutButton />
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <section
              aria-labelledby="profile-name-heading"
              className="p-5 sm:p-7"
            >
              <div className="mb-5 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                  <CircleUserRound className="size-5" aria-hidden />
                </span>
                <div>
                  <h2
                    id="profile-name-heading"
                    className="font-display text-lg font-semibold text-ink"
                  >
                    Profile
                  </h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    The name shown on your journal home.
                  </p>
                </div>
              </div>

              <ProfileNameForm
                key={profile.displayName}
                initialDisplayName={profile.displayName}
                setup={needsProfileName}
              />
            </section>

            {needsProfileName ? null : (
              <details className="group">
                <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 p-5 outline-none transition hover:bg-accent-subtle/35 focus-visible:bg-accent-subtle/35 sm:p-7 [&::-webkit-details-marker]:hidden">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                    <LockKeyhole className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold text-ink">
                      Password
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                      Update your sign-in password.
                    </span>
                  </span>
                  <ChevronDown
                    className="size-5 shrink-0 text-muted transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>

                <div className="border-t border-border/60 bg-paper/35 px-5 py-6 sm:px-7">
                  <ChangePasswordForm />
                </div>
              </details>
            )}
          </div>
        </Card>
      </PageContainer>
    </PageShell>
  );
}
