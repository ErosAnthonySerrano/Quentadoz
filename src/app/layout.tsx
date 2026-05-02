import type { Metadata } from "next";
import "./globals.css";
import { PageBackground } from "@/components/ui/PageBackground";

export const metadata: Metadata = {
  title: "Quentadoz",
  description: "Personal budgeting app for multiple salary cutoffs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quentadoz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quentadoz" />
        <meta name="theme-color" content="#2a6e4e" />
        <script
          dangerouslySetInnerHTML={{
            __html: `const t=localStorage.getItem('quentadoz-theme')||'light';document.documentElement.setAttribute('data-theme',t);`,
          }}
        />
      </head>
      <body>
        <PageBackground />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
