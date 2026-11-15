import type { Metadata } from "next";
import "./globals.css";
import { BidderAuthProvider } from "./components/bidder-auth-provider";
import { SiteHeader } from "./components/site-header";

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
        </BidderAuthProvider>
      </body>
    </html>
  );
}
