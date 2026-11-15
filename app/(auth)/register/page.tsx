import type { Metadata } from "next";
import { BidderAccount } from "../../components/bidder-account";

export const metadata: Metadata = { title: "Register | New Horizons Auction" };

export default function RegisterPage() {
  return <BidderAccount mode="register" />;
}
