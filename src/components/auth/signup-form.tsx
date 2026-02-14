"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <form className="space-y-4" onSubmit={onSubmit}>
      <button
        type="button"
        disabled={isSubmitting || isGoogleSubmitting}
        className="btn btn-outline w-full"
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
      </button>

      <div className="divider my-1 text-xs text-base-content/60">or</div>

      <div>
        <label className="label py-1" htmlFor="name">
          <span className="label-text">Name</span>
        </label>
        <input
          className="input input-bordered w-full"
          id="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="label py-1" htmlFor="email">
          <span className="label-text">Email</span>
        </label>
        <input
          className="input input-bordered w-full"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="label py-1" htmlFor="password">
          <span className="label-text">Password</span>
        </label>
        <input
          className="input input-bordered w-full"
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

      <div>
        <label className="label py-1" htmlFor="confirm-password">
          <span className="label-text">Confirm password</span>
        </label>
        <input
          className="input input-bordered w-full"
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
        <div role="alert" className="alert alert-error py-2 text-sm">
          <span>{error ?? callbackError}</span>
        </div>
      ) : null}

      {success ? (
        <div role="alert" className="alert alert-success py-2 text-sm">
          <span>{success}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || isGoogleSubmitting}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-base-content/70">
        Already have an account?{" "}
        <Link href="/login" className="link link-primary">
          Sign in
        </Link>
      </p>
    </form>
  );
}
