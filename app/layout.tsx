import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceUnavailableBanner } from "@/components/ServiceUnavailableBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Internal Knowledge Management",
  description: "Your team's central hub for knowledge sharing and collaboration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Loads only when NEXT_PUBLIC_GA_ID is set */}
        <GoogleAnalytics />
        {/* Outer boundary: catches crashes in ThemeProvider / AuthProvider itself */}
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {/* Top banner: shown when the backend is unreachable at startup */}
              <ServiceUnavailableBanner />
              <Navigation />
              {/* Inner boundary: a page crash keeps the nav bar alive */}
              <ErrorBoundary>
                <main className="min-h-screen">
                  {children}
                </main>
              </ErrorBoundary>
              <Toaster
                position="top-right"
                richColors
                closeButton
                expand={false}
              />
              {/* Fixed-bottom banner — rendered outside the page error boundary
                  so it stays visible even if the main content crashes */}
              <OfflineBanner />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
