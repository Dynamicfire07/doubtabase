import Image from "next/image";
import { Suspense } from "react";

import { SignupForm } from "@/components/auth/signup-form";
import { publicAssetUrl } from "@/lib/cdn";
export default function SignupPage() {

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="mb-2">
            <div className="mb-2 flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-base-300 bg-base-200">
                <Image
                  src={publicAssetUrl("/brand-icon.svg")}
                  alt="Doubts App logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold">Create your account</h1>
            </div>
            <p className="mt-1 text-sm text-base-content/70">
              Sign up to start tracking and collaborating on doubts.
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
