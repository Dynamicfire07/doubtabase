import Link from "next/link";
import { Space_Grotesk } from "next/font/google";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
});

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-base-200">
      <section className="relative isolate overflow-hidden border-b border-base-300 bg-gradient-to-br from-base-100 via-base-200 to-warning/10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />
        <div className="hero-float pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full bg-info/20 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-warning/25 blur-3xl" />

        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 lg:py-12">
          <header className="hero-fade-up flex items-center justify-between rounded-2xl border border-base-300 bg-base-100/75 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center gap-3">
              <span className="badge badge-outline badge-info">Doubts App</span>
              <span className="hidden text-sm text-base-content/70 sm:inline">
                question capture + collaboration
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              {user ? (
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  Dashboard
                </Link>
              ) : (
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              )}
            </div>
          </header>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="hero-fade-up hero-fade-up-delay-1 space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/60">
                  Built for serious revision
                </p>
                <h1
                  className={`${displayFont.className} text-4xl font-bold leading-tight text-base-content sm:text-5xl lg:text-6xl`}
                >
                  Stop losing doubts in chats, notes, and screenshots.
                </h1>
                <p className="max-w-2xl text-base text-base-content/80 sm:text-lg">
                  Capture every question fast, keep it structured, and solve it
                  inside shared rooms with your friends, mentors, or team.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <>
                    <Link href="/dashboard" className="btn btn-primary btn-lg">
                      Continue to Dashboard
                    </Link>
                    <Link href="/login" className="btn btn-outline btn-lg">
                      Switch account
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup" className="btn btn-primary btn-lg">
                      Create account
                    </Link>
                    <Link href="/login" className="btn btn-outline btn-lg">
                      I already have one
                    </Link>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-base-300 bg-base-100/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-base-content/60">
                    Entry speed
                  </p>
                  <p className="mt-1 text-xl font-semibold">Cmd + Enter rows</p>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-base-content/60">
                    Collaboration
                  </p>
                  <p className="mt-1 text-xl font-semibold">Room-based sync</p>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-base-content/60">
                    Searchability
                  </p>
                  <p className="mt-1 text-xl font-semibold">Filters + tags</p>
                </div>
              </div>
            </div>

            <div className="hero-fade-up hero-fade-up-delay-2">
              <div className="rounded-3xl border border-base-300 bg-base-100/85 p-4 shadow-xl backdrop-blur sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-base-content/80">
                    Live workspace preview
                  </p>
                  <span className="badge badge-success badge-outline">Realtime</span>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-semibold">
                        Why does this NMR peak split here?
                      </p>
                      <span className="badge badge-error badge-outline">hard</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="badge badge-info badge-outline">Chemistry</span>
                      <span className="badge badge-outline">HNMR</span>
                      <span className="badge badge-warning badge-outline">open</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-semibold">
                        Sign mistake in integration by parts
                      </p>
                      <span className="badge badge-warning badge-outline">medium</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="badge badge-info badge-outline">Math</span>
                      <span className="badge badge-outline">Calculus</span>
                      <span className="badge badge-success badge-outline">cleared</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3 text-center">
                    <p className="text-xs text-base-content/60">Rooms</p>
                    <p className="text-lg font-bold">4</p>
                  </div>
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3 text-center">
                    <p className="text-xs text-base-content/60">Open</p>
                    <p className="text-lg font-bold">23</p>
                  </div>
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3 text-center">
                    <p className="text-xs text-base-content/60">Cleared</p>
                    <p className="text-lg font-bold">68</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
