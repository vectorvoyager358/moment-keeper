import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Moment Keeper — A home for life's moments",
  description:
    "Save meaningful memories in a warm, private journal. Capture quickly, revisit often.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/timeline");
  }

  return <LandingPage />;
}
