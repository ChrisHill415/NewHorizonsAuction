import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BidderAuthProvider } from "./components/bidder-auth-provider";
import { SiteHeader } from "./components/site-header";
import { AuctionWordmark } from "./components/auction-wordmark";

export const metadata: Metadata = {
  title: "New Horizons Auction",
  description: "Join the New Horizons community auction. Register or sign in to your bidder account.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <BidderAuthProvider>
          <a href="#main-content" className="skip-link">Skip to account</a>
          <SiteHeader />
          <main id="main-content">
            <div className="page-heading">
              <p>My account</p>
              <span>A COMMUNITY OF GENEROSITY. A CAUSE THAT MATTERS.</span>
            </div>
            <div className="account-main">
              <aside className="auction-intro" aria-label="Our auction community">
                <div className="auction-photo" aria-hidden="true" />
                <div className="intro-content">
                  <span className="eyebrow">THE NEW HORIZONS AUCTION</span>
                  <h2>A tradition of giving.<br />A brighter tomorrow.</h2>
                  <p>Join a community that turns a love of horses into hope for children.</p>
                  <div className="intro-rule" />
                  <span className="intro-note">A little generosity goes a long way.</span>
                </div>
              </aside>
              {children}
            </div>
          </main>
          <footer className="site-footer" id="our-purpose">
            <div className="footer-content">
              <div className="footer-brand"><AuctionWordmark /><span>Good people. Lasting impact.</span></div>
              <div className="footer-mission"><h2>Why we bid</h2><p>Supporting New Horizons and its work helping children and families. Every donor and bidder is part of something bigger.</p></div>
              <div className="footer-start"><h2>Be part of the good</h2><p>One community. One shared purpose.</p><Link href="/register">Create your bidder account <span aria-hidden="true">→</span></Link></div>
            </div>
            <div className="footer-bottom"><span>New Horizons Auction</span><span>Made for our community.</span></div>
          </footer>
        </BidderAuthProvider>
      </body>
    </html>
  );
}
