import type { Metadata } from "next";
import { BidderAccount } from "../../components/bidder-account";

export const metadata: Metadata = { title: "Sign in | New Horizons Auction" };

export default function LoginPage() {
  return <BidderAccount mode="login" />;
}
