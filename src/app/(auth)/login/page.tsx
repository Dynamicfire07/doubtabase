import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { publicAssetUrl } from "@/lib/cdn";
export default function LoginPage() {
  return (
    <main className="auth-shell landing-root min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="landing-card hidden rounded-[30px] p-8 lg:block">
          <div className="space-y-6">
            <span className="landing-pill">Return to focus</span>
            <h1 className="text-pretty text-5xl font-semibold tracking-tight text-slate-950">
              Sign in and get straight back to the doubt list.
            </h1>
            <p className="max-w-lg text-base leading-8 text-slate-700">
              Personal rooms for quiet revision. Shared rooms when a problem needs active
              discussion. The interface should feel intentional, not like a recycled admin
              template.
            </p>
            <div className="grid gap-3">
              <div className="feature-tile rounded-[22px] p-4">
                <p className="db-kicker">Fast capture</p>
                <p className="mt-2 text-sm text-slate-700">
                  Add, edit, and clear doubts without digging through clutter.
                </p>
              </div>
              <div className="feature-tile rounded-[22px] p-4">
                <p className="db-kicker">Live rooms</p>
                <p className="mt-2 text-sm text-slate-700">
                  Shared spaces stay synced for everyone in the room.
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
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
