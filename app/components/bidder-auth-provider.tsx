"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/supabase";

type BidderAuth = {
  user: User | null;
  loading: boolean;
  sessionError: string | null;
};

const BidderAuthContext = createContext<BidderAuth | null>(null);

export function BidderAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
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

  return (
    <BidderAuthContext.Provider value={{ user, loading, sessionError }}>
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
