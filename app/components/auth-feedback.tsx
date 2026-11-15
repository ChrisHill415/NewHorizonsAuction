"use client";

import { useBidderAuth } from "./bidder-auth-provider";

export function AuthFeedback() {
  const { notice, setNotice } = useBidderAuth();
  if (!notice) return null;
  return (
    <div className="auth-feedback">
      <p className={`notice notice-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>
      <button className="text-button" type="button" onClick={() => setNotice(null)} aria-label="Dismiss account message">Dismiss</button>
    </div>
  );
}
