import type { Metadata } from "next";
import { BidderAccount } from "../../components/bidder-account";

export const metadata: Metadata = { title: "Reset password | New Horizons Auction" };

export default function ResetPasswordPage() {
  return <BidderAccount mode="reset-password" />;
}
