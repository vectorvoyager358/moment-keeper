import type { Metadata, Viewport } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";

import { AnalyticsProvider } from "@/components/AnalyticsProvider";

import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const forceLightThemeCss = `
  :root,
  html {
    color-scheme: light only !important;
    --paper: #faf6f0 !important;
    --surface: #fffdf9 !important;
    --surface-elevated: #ffffff !important;
    --ink: #2a2118 !important;
    --muted: #6b5e50 !important;
    --accent: #b8792e !important;
    --accent-hover: #9a6324 !important;
    --accent-subtle: #f3ebe0 !important;
    --border: #e8dfd3 !important;
    --border-strong: #d4c8b8 !important;
    --tag: #ebe3d6 !important;
    --tag-text: #5c4a38 !important;
    --danger: #b53d3d !important;
    --danger-subtle: #fce8e8 !important;
    --success: #2d6a4f !important;
    --success-subtle: #e8f5ee !important;
  }

  html,
  body {
    background-color: #faf6f0 !important;
    color: #2a2118 !important;
  }
`;

export const metadata: Metadata = {
  title: "Moment Keeper",
  description: "A home for life's moments",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${lora.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <style dangerouslySetInnerHTML={{ __html: forceLightThemeCss }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper pb-[env(safe-area-inset-bottom)] text-ink">
        {children}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
