"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [email, setEmail] = useState(() => readCachedLoginEmail() ?? "");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (hasCachedLoginSessionHint()) {
      void router.prefetch("/dashboard");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCachedLoginSessionHint(Boolean(session));
    });

    async function redirectIfAuthenticated() {
      const adminSessionResponse = await fetch("/api/auth/admin-session", {
        cache: "no-store",
      });

      if (adminSessionResponse.ok) {
        const adminSession = (await adminSessionResponse.json()) as {
          authenticated?: boolean;
        };

        if (isMounted && adminSession.authenticated) {
          setCachedLoginSessionHint(true);
          router.replace("/dashboard");
          return;
        }
      }

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

    const adminLoginResponse = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    });

    if (adminLoginResponse.ok) {
      setCachedLoginSessionHint(true);
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    if (adminLoginResponse.status === 503) {
      const payload = (await adminLoginResponse.json()) as { error?: string };
      setError(payload.error ?? "Local admin login is not ready yet.");
      setIsSubmitting(false);
      return;
    }

    if (adminLoginResponse.status !== 401 && adminLoginResponse.status !== 404) {
      const payload = (await adminLoginResponse.json()) as { error?: string };
      setError(payload.error ?? "Admin login is unavailable right now.");
      setIsSubmitting(false);
      return;
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
      className="auth-form space-y-4"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/72 px-3.5 py-3 text-sm text-slate-600">
        <Checkbox
          checked={rememberEmail}
          className="mt-0.5"
          onCheckedChange={(checked) => {
            const shouldRemember = checked === true;
            setRememberEmail(shouldRemember);

            if (!shouldRemember) {
              clearCachedLoginEmail();
            }
          }}
        />
        <span>Remember email on this device</span>
      </label>

      <AnimatePresence initial={false}>
        {error || callbackError ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive" className="overflow-hidden">
              <AlertCircle className="size-4" />
              <AlertDescription>{error ?? callbackError}</AlertDescription>
            </Alert>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={isSubmitting || isGoogleSubmitting}
        className="w-full rounded-full py-6"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="font-medium text-sky-700 underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </motion.form>
  );
}
