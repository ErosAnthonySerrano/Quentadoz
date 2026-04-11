import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
