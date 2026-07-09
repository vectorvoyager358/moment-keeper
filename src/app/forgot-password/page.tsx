import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const initialError =
    params.error === "invalid_link"
      ? "That reset link is invalid or has expired. Request a new one."
      : undefined;

  return <ForgotPasswordForm initialError={initialError} />;
}
