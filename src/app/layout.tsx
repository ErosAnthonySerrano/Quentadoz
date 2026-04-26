import type { Metadata } from "next";
import "./globals.css";
import { PageBackground } from "@/components/ui/PageBackground";

export const metadata: Metadata = {
  title: "Quentadoz",
  description: "Personal budgeting app for multiple salary cutoffs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
