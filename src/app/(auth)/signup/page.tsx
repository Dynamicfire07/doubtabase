import Image from "next/image";
import { Suspense } from "react";

import { SignupForm } from "@/components/auth/signup-form";
import { publicAssetUrl } from "@/lib/cdn";
export default function SignupPage() {
  return (
    <main className="auth-shell landing-root min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="landing-card hidden rounded-[30px] p-8 lg:block">
          <div className="space-y-6">
            <span className="landing-pill">Structured revision</span>
            <h1 className="text-pretty text-5xl font-semibold tracking-tight text-slate-950">
              Build a workspace that treats doubts like work, not chat debris.
            </h1>
            <p className="max-w-lg text-base leading-8 text-slate-700">
              Capture the problem once, tag it properly, and keep it visible until it is
              genuinely resolved.
            </p>
            <div className="grid gap-3">
              <div className="feature-tile rounded-[22px] p-4">
                <p className="db-kicker">Private + shared</p>
                <p className="mt-2 text-sm text-slate-700">
                  Work alone when needed, then move into a shared room without losing structure.
                </p>
              </div>
              <div className="feature-tile rounded-[22px] p-4">
                <p className="db-kicker">Image support</p>
                <p className="mt-2 text-sm text-slate-700">
                  Attach screenshots and handwritten steps where text is not enough.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="auth-panel mx-auto w-full max-w-md rounded-[30px] p-6 sm:p-7">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/70 bg-white shadow-sm">
                <Image
                  src={publicAssetUrl("/brand-icon.svg")}
                  alt="Doubts App logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <span className="landing-pill">Doubts App</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Set up your workspace and start tracking doubts properly.
            </p>
          </div>

          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
