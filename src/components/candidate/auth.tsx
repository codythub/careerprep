"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import { clearToken, getToken, getTokenExpiry, onTokenChange } from "@/lib/laravel/token";
import type { Candidate } from "@/lib/laravel/types";
import { Alert } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/site/logo";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "error"; message: string }
  | { status: "authenticated"; token: string; user: Candidate };

type AuthContextValue = {
  state: AuthState;
  /** Clear the stale token and send the candidate to sign in, then back here. */
  handleUnauthorized: () => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useReturnPath() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * Candidate session, resolved in the browser: the Laravel bearer token is read from client
 * storage and validated with GET /auth/user. No cookies, no server session.
 */
export function CandidateAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const returnPath = useReturnPath();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const resolve = useCallback(async () => {
    const token = getToken();
    if (!token) return setState({ status: "anonymous" });
    try {
      const user = await api.user(token);
      setState({ status: "authenticated", token, user });
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        clearToken();
        router.replace(`/login?expired=1&callbackUrl=${encodeURIComponent(returnPath)}`);
        return setState({ status: "anonymous" });
      }
      setState({ status: "error", message: err instanceof ApiError ? err.message : "We couldn't load your account." });
    }
  }, [router, returnPath]);

  useEffect(() => {
    // Resolve the session after mount (client-only token storage).
    const t = setTimeout(() => void resolve(), 0);
    const off = onTokenChange(() => void resolve());
    return () => {
      clearTimeout(t);
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve once per mount; token changes re-resolve via the listener
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    router.replace(`/login?expired=1&callbackUrl=${encodeURIComponent(returnPath)}`);
  }, [router, returnPath]);

  // Sign out proactively when the token reaches its expires_at (same outcome as a 401).
  const authenticated = state.status === "authenticated";
  useEffect(() => {
    const expiry = authenticated ? getTokenExpiry() : null;
    if (expiry === null) return;
    const t = setTimeout(handleUnauthorized, Math.min(Math.max(0, expiry - Date.now()), 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [authenticated, handleUnauthorized]);

  const signOut = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // Token may already be invalid; clearing it locally is what signs the user out here.
      }
    }
    clearToken();
    router.replace("/login?signedOut=1");
  }, [router]);

  return (
    <AuthContext.Provider value={{ state, handleUnauthorized, refreshUser: resolve, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useCandidateAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCandidateAuth must be used inside CandidateAuthProvider");
  return ctx;
}

/** Protected-route guard: renders children only for a signed-in candidate. */
export function RequireCandidate({ children }: { children: (auth: { token: string; user: Candidate }) => ReactNode }) {
  const { state, refreshUser } = useCandidateAuth();
  const router = useRouter();
  const returnPath = useReturnPath();

  useEffect(() => {
    if (state.status === "anonymous") router.replace(`/login?callbackUrl=${encodeURIComponent(returnPath)}`);
  }, [state.status, router, returnPath]);

  if (state.status === "authenticated") return <>{children({ token: state.token, user: state.user })}</>;
  if (state.status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md">
          <Alert
            tone="error"
            title="We couldn't load your account"
            action={
              <Button variant="outline" size="sm" onClick={() => void refreshUser()}>
                Try again
              </Button>
            }
          >
            {state.message}
          </Alert>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface" aria-busy="true">
      <LogoMark className="size-10" />
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
      <span className="sr-only" role="status">
        Loading your account…
      </span>
    </div>
  );
}

type ApiState<T> = { loading: boolean; data: T | null; error: string | null; status: number | null };

/**
 * Load data from Laravel with the candidate's token. 401 → sign in again (and come back);
 * other failures surface as an error message for the page to display.
 */
export function useApi<T>(fetcher: (token: string) => Promise<T>, deps: unknown[] = []) {
  const { state, handleUnauthorized } = useCandidateAuth();
  const token = state.status === "authenticated" ? state.token : null;
  const [result, setResult] = useState<ApiState<T>>({ loading: true, data: null, error: null, status: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetcher(token).then(
      (data) => !cancelled && setResult({ loading: false, data, error: null, status: 200 }),
      (err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.isUnauthorized) return handleUnauthorized();
        const status = err instanceof ApiError ? err.status : 0;
        const error =
          err instanceof ApiError ? (status === 403 ? "You don't have access to this." : err.message) : "Something went wrong. Please try again.";
        setResult({ loading: false, data: null, error, status });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass explicit deps
  }, [token, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...result, reload };
}

/** Redirect signed-in candidates away from guest-only pages (login/register). */
export function useRedirectIfSignedIn(to = "/dashboard") {
  const router = useRouter();
  useEffect(() => {
    if (getToken()) router.replace(to);
  }, [router, to]);
}
