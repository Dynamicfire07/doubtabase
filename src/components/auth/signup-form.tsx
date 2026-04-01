"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, getOAuthRedirectTo } from "@/lib/auth/oauth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const callbackError = getAuthErrorMessage(searchParams.get("error"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function redirectIfAuthenticated() {
      const adminSessionResponse = await fetch("/api/auth/admin-session", {
        cache: "no-store",
      });

      if (adminSessionResponse.ok) {
        const adminSession = (await adminSessionResponse.json()) as {
          authenticated?: boolean;
        };

        if (isMounted && adminSession.authenticated) {
          router.replace("/dashboard");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted && session) {
        router.replace("/dashboard");
      }
    }

    void redirectIfAuthenticated();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
          : undefined;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSuccess("Account created. Verify your email, then sign in.");
    setPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }

  async function onGoogleSignIn() {
    setError(null);
    setSuccess(null);
    setIsGoogleSubmitting(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectTo("/dashboard"),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <form className="auth-form space-y-4" onSubmit={onSubmit}>
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || isGoogleSubmitting}
        className="w-full justify-center gap-3 rounded-full border-white/70 bg-white/88 py-6"
        onClick={() => {
          void onGoogleSignIn();
        }}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.805 10.023H12.21v4.088h5.502c-.237 1.318-.988 2.438-2.104 3.19v2.65h3.404c1.995-1.838 3.149-4.545 3.149-7.785 0-.716-.064-1.404-.356-2.143Z"
            fill="#4285F4"
          />
          <path
            d="M12.21 22c2.7 0 4.962-.895 6.615-2.049l-3.404-2.65c-.945.64-2.15 1.022-3.211 1.022-2.464 0-4.55-1.663-5.294-3.9H3.402v2.734A9.988 9.988 0 0 0 12.21 22Z"
            fill="#34A853"
          />
          <path
            d="M6.916 14.423a6.01 6.01 0 0 1 0-3.846V7.843H3.402a9.988 9.988 0 0 0 0 8.314l3.514-2.734Z"
            fill="#FBBC05"
          />
          <path
            d="M12.21 6.677c1.47 0 2.789.506 3.828 1.499l2.872-2.872C17.168 3.68 14.91 2.8 12.21 2.8a9.988 9.988 0 0 0-8.808 5.043l3.514 2.734c.744-2.237 2.83-3.9 5.294-3.9Z"
            fill="#EA4335"
          />
        </svg>
        {isGoogleSubmitting ? "Redirecting..." : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <div className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter password"
        />
      </div>

      {error || callbackError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error ?? callbackError}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="border-emerald-200 bg-emerald-50/90 text-emerald-800">
          <CheckCircle2 className="size-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting || isGoogleSubmitting}
        className="w-full rounded-full py-6"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sky-700 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
