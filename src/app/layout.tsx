import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { MainTenantDocumentTitleGuard } from "@/components/branding/main-tenant-document-title-guard";
import { TooltipProvider } from "@/components/ui/tooltip";
import { mainTenantDocumentTitleStorageKey } from "@/lib/main-tenant-document-title";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Italic-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  description: "Cube Core management console",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Script id="main-tenant-title" strategy="beforeInteractive">
          {`try { const tenantName = localStorage.getItem("${mainTenantDocumentTitleStorageKey}"); if (tenantName) document.title = tenantName; } catch {}`}
        </Script>
        <MainTenantDocumentTitleGuard />
        <AppApolloProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AppApolloProvider>
      </body>
    </html>
  );
}
