import type { Metadata } from "next";
import { BidderAccount } from "../../components/bidder-account";

export const metadata: Metadata = { title: "Forgot password | New Horizons Auction" };

export default function ForgotPasswordPage() {
  return <BidderAccount mode="forgot-password" />;
}
