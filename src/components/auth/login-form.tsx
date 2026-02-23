"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  clearCachedLoginEmail,
  hasCachedLoginSessionHint,
  readCachedLoginEmail,
  setCachedLoginSessionHint,
  writeCachedLoginEmail,
} from "@/lib/auth/client-cache";
import { getAuthErrorMessage, getOAuthRedirectTo } from "@/lib/auth/oauth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const callbackError = getAuthErrorMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cachedEmail = readCachedLoginEmail();

    if (cachedEmail) {
      setEmail((currentEmail) => currentEmail || cachedEmail);
    }

    if (hasCachedLoginSessionHint()) {
      void router.prefetch("/dashboard");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCachedLoginSessionHint(Boolean(session));
    });

    async function redirectIfAuthenticated() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted && session) {
        setCachedLoginSessionHint(true);
        router.replace("/dashboard");
        return;
      }

      if (isMounted) {
        setCachedLoginSessionHint(false);
      }
    }

    void redirectIfAuthenticated();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (rememberEmail) {
      writeCachedLoginEmail(normalizedEmail);
    } else {
      clearCachedLoginEmail();
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    setCachedLoginSessionHint(true);
    router.replace("/dashboard");
    router.refresh();
  }

  async function onGoogleSignIn() {
    setError(null);
    setIsGoogleSubmitting(true);

    if (rememberEmail) {
      writeCachedLoginEmail(email);
    } else {
      clearCachedLoginEmail();
    }

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
    <motion.form
      className="space-y-4"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.button
        type="button"
        disabled={isSubmitting || isGoogleSubmitting}
        className="btn btn-outline w-full"
        whileTap={{ scale: 0.99 }}
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
      </motion.button>

      <div className="divider my-1 text-xs text-base-content/60">or</div>

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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
        />
      </div>

      <label className="label cursor-pointer justify-start gap-3 py-0">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={rememberEmail}
          onChange={(event) => {
            const checked = event.target.checked;
            setRememberEmail(checked);

            if (!checked) {
              clearCachedLoginEmail();
            }
          }}
        />
        <span className="label-text text-sm">Remember email on this device</span>
      </label>

      <AnimatePresence initial={false}>
        {error || callbackError ? (
          <motion.div
            role="alert"
            className="alert alert-error overflow-hidden py-2 text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span>{error ?? callbackError}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting || isGoogleSubmitting}
        className="btn btn-primary w-full"
        whileTap={{ scale: 0.99 }}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </motion.button>

      <p className="text-center text-sm text-base-content/70">
        New here?{" "}
        <Link href="/signup" className="link link-primary">
          Create an account
        </Link>
      </p>
    </motion.form>
  );
}
