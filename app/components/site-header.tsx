"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuctionWordmark } from "./auction-wordmark";
import { useBidderAuth } from "./bidder-auth-provider";

export function SiteHeader() {
  const { user, loading } = useBidderAuth();
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="New Horizons Auction home">
          <AuctionWordmark />
        </Link>
        <nav aria-label="Account navigation">
          {loading ? <span className="nav-status">Checking session…</span> : user ? (
            <Link href="/" className="nav-link">My account</Link>
          ) : (
            <><Link href="/login" className="nav-link" aria-current={pathname === "/login" ? "page" : undefined}>Sign in</Link><Link href="/register" className="nav-link" aria-current={pathname === "/register" ? "page" : undefined}>Register</Link></>
          )}
        </nav>
      </div>
    </header>
  );
}
