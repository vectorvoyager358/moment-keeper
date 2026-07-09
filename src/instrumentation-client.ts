import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Keep privacy high for a personal memory app.
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    beforeSend(event) {
      const msg = event.exception?.values?.[0]?.value ?? "";
      // Drop errors from browser extensions (e.g. password managers on iOS Safari)
      // that call runtime.sendMessage() after the login page has navigated away.
      if (msg.includes("runtime.sendMessage") || msg.includes("Tab not found")) {
        return null;
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
