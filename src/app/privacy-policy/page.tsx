import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Doubts App",
  description: "Privacy policy for the Question Timer Chrome extension.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-12">
      <article className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold text-base-content">Privacy Policy for Question Timer</h1>
        <p className="mt-2 text-sm text-base-content/70">Last updated: February 27, 2026</p>

        <p className="mt-6 leading-7 text-base-content/90">
          Question Timer is a Chrome extension for tracking time spent on questions. This extension is
          designed to keep your data on your own device.
        </p>

        <section className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-base-content">Information We Collect</h2>
          <p className="leading-7 text-base-content/90">
            Question Timer does not collect personal information and does not send your data to
            external servers.
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-base-content">How Data Is Stored</h2>
          <p className="leading-7 text-base-content/90">
            Timing session data (question labels, elapsed times, and session state) is stored locally
            using <code className="rounded bg-base-200 px-1 py-0.5">chrome.storage.local</code> on your
            device.
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-base-content">Data Sharing and Selling</h2>
          <ul className="list-inside list-disc space-y-1 leading-7 text-base-content/90">
            <li>We do not sell your data.</li>
            <li>We do not share your data with third parties.</li>
            <li>We do not use analytics or advertising trackers.</li>
          </ul>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-base-content">Permissions</h2>
          <p className="leading-7 text-base-content/90">
            The extension requests the <code className="rounded bg-base-200 px-1 py-0.5">storage</code>
            {" "}permission only, so it can save and restore your timer state locally.
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-base-content">Data Deletion</h2>
          <p className="leading-7 text-base-content/90">
            You can clear saved session data from the extension UI using &quot;Clear Session&quot;, or remove
            the extension from Chrome to delete its local storage.
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-base-content">Changes to This Policy</h2>
          <p className="leading-7 text-base-content/90">
            If this privacy policy changes, the updated version will be posted at this URL with an
            updated &quot;Last updated&quot; date.
          </p>
        </section>

        <p className="mt-8 text-sm text-base-content/70">
          Back to <Link href="/" className="underline underline-offset-2">Doubts App</Link>.
        </p>
      </article>
    </main>
  );
}
