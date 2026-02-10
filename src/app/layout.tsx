import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doubts App",
  description:
    "Capture, filter, and clear doubts with plain-text notes and image attachments.",
  icons: {
    icon: "/brand-icon.svg",
    shortcut: "/brand-icon.svg",
    apple: "/brand-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-base-200 font-sans text-base-content antialiased`}
      >
        <div className="flex-1">{children}</div>
        <footer className="border-t border-base-300 bg-base-100/80 px-6 py-4 text-center text-sm text-base-content/70">
          <a
            href="https://doubtabase.sbs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
          >
            <span className="text-base-content/70">made with</span>
            <Image
              src="/brand-icon.svg"
              alt="doubtabase logo"
              width={16}
              height={16}
              className="rounded-sm"
            />
            doubtabase
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
