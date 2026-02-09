import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="mb-2">
            <h1 className="text-2xl font-bold">Doubts App</h1>
            <p className="mt-1 text-sm text-base-content/70">
              Sign in with your authorized account to continue.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
