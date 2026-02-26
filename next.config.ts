import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Content Security Policy
// ---------------------------------------------------------------------------
// The backend API is called directly from the browser (no BFF proxy), so its
// origin must be explicitly allowed in connect-src.  NEXT_PUBLIC_API_URL is
// read at server startup from .env.local / the deployment environment.
//
// NOTE: 'unsafe-inline' in script-src is required by Next.js App Router's
// inline hydration bootstrap.  'unsafe-eval' has been removed — Next.js 13+
// App Router does not need it in production.  To harden further, replace
// 'unsafe-inline' with a middleware-generated nonce (see Next.js CSP docs).
// ---------------------------------------------------------------------------
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob: https://www.google-analytics.com;
  connect-src 'self'
    ${apiOrigin}
    https://www.google-analytics.com
    https://analytics.google.com
    https://region1.google-analytics.com
    https://*.ingest.sentry.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
`
  .replace(/\n/g, " ")
  .trim();

const securityHeaders = [
  // Prevent the app from being embedded in an iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Enforce HTTPS for 2 years; include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Send full URL only for same-origin; only origin for cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features the app does not need
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // Apply to every route
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

// ---------------------------------------------------------------------------
// Sentry
// ---------------------------------------------------------------------------
// withSentryConfig instruments the build with source-map uploading and
// automatic route tracing.  It is a no-op at runtime when NEXT_PUBLIC_SENTRY_DSN
// is empty — guarded by the `if (dsn)` blocks in sentry.*.config.ts.
//
// For source-map uploads add SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT
// to your CI environment.  Without them the upload is silently skipped and all
// runtime error-capture features still work.
// ---------------------------------------------------------------------------
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress "auth token missing" warnings in envs where upload isn't needed
  silent: true,

  // Upload a wider set of source maps for better stack traces in Sentry
  widenClientFileUpload: true,

  // Keep internal Sentry source maps out of the shipped bundle
  hideSourceMaps: true,

  // Tree-shake the Sentry debug logger from production bundles
  disableLogger: true,
});
