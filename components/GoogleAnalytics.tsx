import Script from "next/script";

// GA measurement IDs look like "G-XXXXXXXXXX" or legacy "UA-XXXXX-X".
// We validate the format to prevent an accidental mis-config from injecting
// an arbitrary string into a <script> tag.
const GA_ID_RE = /^[A-Z]{1,3}-[A-Z0-9]{4,}/i;

export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;

  // Return nothing when GA is not configured
  if (!id || !GA_ID_RE.test(id)) return null;

  return (
    <>
      {/* Load the gtag.js library */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />

      {/* Initialise the data layer */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}
