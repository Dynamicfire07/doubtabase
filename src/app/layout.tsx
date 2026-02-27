import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";

import { getCdnPreconnectOrigins, publicAssetUrl } from "@/lib/cdn";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doubts App",
  description:
    "Capture, filter, and clear doubts with plain-text notes and image attachments.",
  icons: {
    icon: publicAssetUrl("/brand-icon.svg"),
    shortcut: publicAssetUrl("/brand-icon.svg"),
    apple: publicAssetUrl("/brand-icon.svg"),
  },
};

const cdnPreconnectOrigins = getCdnPreconnectOrigins();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        {cdnPreconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="" />
        ))}
      </head>
      <body
        className={`${geistSans.variable} flex min-h-screen flex-col bg-base-200 font-sans text-base-content antialiased`}
      >
        <div className="flex-1">{children}</div>
        <footer className="border-t border-base-300 bg-base-100/80 px-6 py-4 text-center text-sm text-base-content/70">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>Made by Shaurya Jain</span>
            <span aria-hidden="true">•</span>
            <Link
              href="/privacy-policy"
              className="underline underline-offset-2 hover:text-base-content"
            >
              Privacy Policy
            </Link>
          </div>
        </footer>
        {process.env.NODE_ENV === "production" ? <Analytics /> : null}
      </body>
    </html>
  );
}
