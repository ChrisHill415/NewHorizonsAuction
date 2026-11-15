"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/supabase";

export type AuthNotice = { kind: "success" | "error"; text: string };

type BidderAuth = {
  user: User | null;
  loading: boolean;
  sessionError: string | null;
  notice: AuthNotice | null;
  setNotice: (notice: AuthNotice | null) => void;
  loggingOut: boolean;
  logout: () => Promise<void>;
};

const BidderAuthContext = createContext<BidderAuth | null>(null);

export function BidderAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        if (event === "SIGNED_OUT") setNotice(null);
        setUser(session?.user ?? null);
        if (session) setSessionError(null);
        setLoading(false);
      },
    );

    // Surface errors from expired/invalid confirmation links as well.
    void supabase.auth.initialize().then(({ error }) => {
      if (!active || !error) return;
      setSessionError("We couldn’t restore your session or verify that link. Please sign in again. If your email confirmation link expired, request a new one below.");
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setSessionError("We couldn’t connect to sign-in. Check your connection and try again.");
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase || loggingOut) return;
    setLoggingOut(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        const { data } = await supabase.auth.getSession();
        setNotice({ kind: "error", text: data.session
          ? "We couldn’t sign you out. Please try again."
          : "You’re signed out of this browser, but we couldn’t finish signing out with the server." });
      }
    } catch {
      setNotice({ kind: "error", text: "We couldn’t finish signing you out. Check your connection and try again." });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <BidderAuthContext.Provider value={{ user, loading, sessionError, notice, setNotice, loggingOut, logout }}>
      {children}
    </BidderAuthContext.Provider>
  );
}

/** user.id is the Supabase Auth UUID; database policies must enforce ownership. */
export function useBidderAuth() {
  const context = useContext(BidderAuthContext);
  if (!context) throw new Error("useBidderAuth requires BidderAuthProvider");
  return context;
}
