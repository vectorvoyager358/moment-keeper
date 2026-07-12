"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

type AppSerwistProviderProps = {
  swUrl: string;
  children: React.ReactNode;
};

export function AppSerwistProvider({
  swUrl,
  children,
}: AppSerwistProviderProps) {
  return <SerwistProvider swUrl={swUrl}>{children}</SerwistProvider>;
}
