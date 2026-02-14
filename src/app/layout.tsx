import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

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
        className={`${geistSans.variable} flex min-h-screen flex-col bg-base-200 font-sans text-base-content antialiased`}
      >
        <div className="flex-1">{children}</div>
        <footer className="border-t border-base-300 bg-base-100/80 px-6 py-4 text-center text-sm text-base-content/70">
          Made by Shaurya Jain
        </footer>
        {process.env.NODE_ENV === "production" ? <Analytics /> : null}
      </body>
    </html>
  );
}
