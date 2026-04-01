import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { publicAssetUrl } from "@/lib/cdn";

export default function LoginPage() {
  return (
    <main className="auth-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="auth-stage mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl items-stretch overflow-hidden rounded-[2rem] lg:grid-cols-[minmax(0,1.05fr)_420px]">
        <section className="auth-visual hidden lg:flex">
          <div className="auth-visual-inner">
            <div>
              <p className="auth-kicker">Back to the queue</p>
              <h1 className="auth-display mt-4">
                Sign in and get straight back to the doubts that still need work.
              </h1>
              <p className="auth-support mt-5">
                Personal rooms for quiet revision. Shared rooms for problems that need active discussion. The UI stays calm so the queue stays readable.
              </p>
            </div>

            <div className="auth-visual-stack">
              <div className="auth-visual-note">
                <p className="auth-kicker">Current room</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">IB Physics HL</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  23 visible doubts, 7 still open, 3 collaborators active right now.
                </p>
              </div>
              <div className="auth-visual-list">
                <div className="auth-visual-row">
                  <span className="auth-dot auth-dot-open" />
                  <span>Electrostatics field derivation</span>
                </div>
                <div className="auth-visual-row">
                  <span className="auth-dot auth-dot-live" />
                  <span>NMR splitting pattern check</span>
                </div>
                <div className="auth-visual-row">
                  <span className="auth-dot auth-dot-clear" />
                  <span>Integration by parts edge case</span>
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
                  <p className="text-sm text-slate-600">Structured revision, not message chaos.</p>
                </div>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in to return to your dashboard.
              </p>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
