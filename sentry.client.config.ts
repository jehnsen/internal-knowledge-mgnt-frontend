import * as Sentry from "@sentry/nextjs";

// Guard: do nothing when no DSN is provided (dev / unconfigured envs)
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Capture a fraction of transactions for performance monitoring.
    // 100 % in dev so you see traces immediately; 20 % in production.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Always replay the session leading up to an error.
    // In production, also sample 10 % of error-free sessions.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

    integrations: [
      Sentry.replayIntegration({
        // Mask all text and block all media in replays to protect PII
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
