import Image from "next/image";
import { Suspense } from "react";

import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { publicAssetUrl } from "@/lib/cdn";

export default function SignupPage() {
  return (
    <main className="auth-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="auth-stage mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl items-stretch overflow-hidden rounded-[2rem] lg:grid-cols-[minmax(0,1.05fr)_420px]">
        <section className="auth-visual hidden lg:flex">
          <div className="auth-visual-inner">
            <div>
              <p className="auth-kicker">Build the workspace</p>
              <h1 className="auth-display mt-4">
                Create an account and treat doubts like work instead of loose chat fragments.
              </h1>
              <p className="auth-support mt-5">
                Capture once, tag with intent, and keep the queue visible until each blocker is properly resolved.
              </p>
            </div>

            <div className="auth-visual-stack">
              <div className="auth-visual-note">
                <p className="auth-kicker">What you get</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">One calm control room</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Personal revision, shared rooms, searchable rows, and image-backed discussion in one surface.
                </p>
              </div>
              <div className="auth-visual-list">
                <div className="auth-visual-row">
                  <span className="auth-dot auth-dot-open" />
                  <span>Private room by default</span>
                </div>
                <div className="auth-visual-row">
                  <span className="auth-dot auth-dot-live" />
                  <span>Realtime shared collaboration</span>
                </div>
                <div className="auth-visual-row">
                  <span className="auth-dot auth-dot-clear" />
                  <span>Searchable solved history</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel-wrap">
          <Card className="auth-panel w-full max-w-[26rem] border-white/68 bg-transparent shadow-none">
            <CardHeader className="mb-6 px-0 pt-0">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm">
                  <Image
                    src={publicAssetUrl("/brand-icon.svg")}
                    alt="Doubts App logo"
                    fill
                    className="object-contain p-1"
                    priority
                  />
                </div>
                <div>
                  <p className="auth-kicker">Doubts App</p>
                  <p className="text-sm text-slate-600">Start with one focused workspace.</p>
                </div>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Create your account
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Set up your workspace and start tracking doubts properly.
              </p>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <Suspense fallback={null}>
                <SignupForm />
              </Suspense>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
