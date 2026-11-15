import type { Metadata } from "next";
import "./globals.css";
import { BidderAuthProvider } from "./components/bidder-auth-provider";
import { SiteHeader } from "./components/site-header";
import { AuthFeedback } from "./components/auth-feedback";

export const metadata: Metadata = {
  title: "New Horizons Auction",
  description: "Browse the New Horizons auction catalog. Register or sign in to your bidder account.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <BidderAuthProvider>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <SiteHeader />
          <AuthFeedback />
          <div id="main-content">{children}</div>
        </BidderAuthProvider>
      </body>
    </html>
  );
}
