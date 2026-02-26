// Next.js App Router instrumentation hook — auto-discovered at the project root.
// Dynamically imports the runtime-specific Sentry config so the Node.js SDK
// is never bundled into the edge runtime and vice-versa.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
