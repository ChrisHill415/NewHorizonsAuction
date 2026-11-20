"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase";
import { useBidderAuth } from "./bidder-auth-provider";

type Mode = "login" | "register" | "forgot-password" | "reset-password";
type Notice = { kind: "success" | "error"; text: string };

function authError(error: { code?: string; status?: number }, fallback: string) {
  if (error.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  switch (error.code) {
    case "invalid_credentials": return "That email and password don’t match. Please try again.";
    case "email_not_confirmed": return "Please confirm your email before signing in. Check your inbox, or resend your confirmation below.";
    case "user_already_exists":
    case "email_exists": return "An account already uses this email. Please sign in instead.";
    case "weak_password": return "Your password doesn’t meet the account security requirements. Try a longer password with uppercase and lowercase letters, numbers, and symbols.";
    case "signup_disabled": return "Registration is currently unavailable. Please try again later.";
    case "email_address_invalid": return "Please enter a valid email address.";
    case "over_email_send_rate_limit": return "Too many emails requested. Please wait a few minutes before trying again.";
    case "same_password": return "Choose a password different from your current password.";
    case "session_not_found":
    case "refresh_token_not_found": return "Your password reset link has expired. Please request a new link.";
    default: return fallback;
  }
}

export function BidderAccount({ mode }: { mode: Mode }) {
  const { user, loading, sessionError, setNotice: setAuthNotice } = useBidderAuth();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const registering = mode === "register";
  const requestingReset = mode === "forgot-password";
  const resetting = mode === "reset-password";
  const passwordFlow = requestingReset || resetting;
  const invalidReset = resetting && (!user || Boolean(sessionError));

  // Includes restored sessions and returning email-confirmation links.
  useEffect(() => {
    if (!loading && user && !passwordFlow) router.replace("/");
  }, [loading, user, router, passwordFlow]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || pending || invalidReset) return;
    setNotice(null);
    setAuthNotice(null);
    if (registering && !name.trim()) {
      setNotice({ kind: "error", text: "Please enter your name." });
      return;
    }
    if ((registering || resetting) && password !== confirmation) {
      setNotice({ kind: "error", text: "Your passwords don’t match. Please enter the same password in both fields." });
      return;
    }
    setPending(true);
    try {
      if (requestingReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setNotice(error
          ? { kind: "error", text: authError(error, "We couldn’t send a reset link. Check your connection and try again.") }
          : { kind: "success", text: "If an account uses this email, a password reset link has been sent. Check your inbox and spam folder." });
        return;
      }
      if (resetting) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setNotice({ kind: "error", text: authError(error, "We couldn’t update your password. Your link may have expired; request a new one and try again.") });
          return;
        }
        setPassword("");
        setConfirmation("");
        setAuthNotice({ kind: "success", text: "Your password has been updated. You’re signed in." });
        router.replace("/");
        return;
      }
      const credentials = { email: email.trim(), password };
      const { data, error } = registering
        ? await supabase.auth.signUp({ ...credentials, options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) },
        } })
        : await supabase.auth.signInWithPassword(credentials);
      if (error) {
        setNotice({ kind: "error", text: authError(error, "We couldn’t complete your request. Check your connection and try again.") });
        return;
      }
      setEmail("");
      setPassword("");
      setConfirmation("");
      setName("");
      setPhone("");
      if (registering) {
        setAuthNotice({ kind: "success", text: data.session
          ? "Your bidder account is ready. You’re signed in."
          : "Check your inbox for an email confirmation link before signing in to bid. You can browse the catalog while you wait. If you already have an account, sign in instead." });
      }
      router.replace("/");
    } catch {
      setNotice({ kind: "error", text: "We couldn’t connect. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  async function resendConfirmation() {
    if (!supabase || pending) return;
    setPending(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/login` } });
      setNotice(error
        ? { kind: "error", text: authError(error, "We couldn’t send a confirmation email. Check the email address and try again.") }
        : { kind: "success", text: "If this account needs confirmation, a new link has been sent. Check your inbox and spam folder." });
    } catch {
      setNotice({ kind: "error", text: "We couldn’t connect. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  const visibleNotice = notice ?? (invalidReset && !loading
    ? { kind: "error", text: "This password reset link is missing, invalid, or expired. Request a new link to reset your password." }
    : sessionError ? { kind: "error", text: sessionError } : null);
  if (user && !passwordFlow) return <p className="muted" role="status">Opening the catalog…</p>;
  return (
    <section className="account-card" aria-labelledby="account-title" aria-busy={loading || pending}>
      <p className="eyebrow">WELCOME TO THE COMMUNITY</p>
      <h1 id="account-title">{loading ? "A moment, please." : registering ? "Register" : requestingReset ? "Forgot password?" : resetting ? "Reset password" : "Sign in"}</h1>
      <p className="card-intro">{registering ? "Create your account to join the New Horizons bidding community." : requestingReset ? "Enter your account email and we’ll send you a password reset link." : resetting ? "Choose a new password for your bidder account." : "Sign in to your New Horizons bidder account."}</p>
      {visibleNotice && <p className={`notice notice-${visibleNotice.kind}`} role={visibleNotice.kind === "error" ? "alert" : "status"}>{visibleNotice.text}</p>}
      {!supabase && <p className="notice notice-error" role="alert">Account sign-in isn’t available yet. Please try again later.</p>}
      {loading ? <p className="muted" role="status">Checking your sign-in status…</p> : (
        <>
          {!invalidReset && <form onSubmit={submit}>
            <fieldset disabled={pending || !supabase}>
              {registering && <>
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" type="text" autoComplete="name" required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} />
                <label htmlFor="phone">Phone number (optional)</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} />
              </>}
              {!resetting && <>
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </>}
              {!requestingReset && <>
                <label htmlFor="password">{resetting ? "New password" : "Password"}</label>
                <input id="password" name="password" type="password" autoComplete={registering || resetting ? "new-password" : "current-password"} minLength={registering || resetting ? 8 : undefined} required aria-describedby={registering || resetting ? "password-hint" : undefined} value={password} onChange={(event) => setPassword(event.target.value)} />
                {(registering || resetting) && <><p id="password-hint" className="field-hint">Use at least 8 characters.</p><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></>}
              </>}
              <button type="submit" className="button button-full">{pending ? "Please wait…" : registering ? "Create bidder account" : requestingReset ? "Send reset link" : resetting ? "Update password" : "Sign in"}<span aria-hidden="true">↗</span></button>
            </fieldset>
          </form>}
          {mode === "login" && <p className="form-switch"><Link href="/forgot-password">Forgot password?</Link></p>}
          {resetting && <p className="form-switch"><Link href="/forgot-password">Request a new reset link</Link></p>}
          <p className="form-switch">{passwordFlow ? "Remember your password?" : registering ? "Already have an account?" : "New to the auction?"} <Link href={registering || passwordFlow ? "/login" : "/register"}>{registering || passwordFlow ? "Sign in" : "Create an account"}</Link></p>
          {mode === "login" && <div className="confirmation-help"><p>Still need to confirm your email? Enter your email above.</p><button type="button" className="text-button" onClick={resendConfirmation} disabled={pending || !supabase || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}>Resend confirmation email</button></div>}
        </>
      )}
      <p className="card-footnote">A community coming together, one bid at a time.</p>
    </section>
  );
}
