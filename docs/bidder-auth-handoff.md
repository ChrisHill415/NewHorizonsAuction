# Bidder account handoff

## Scope and status

The bidder implementation is on `feature/bidder_registration` for review, with the website running on localhost. `main` remains unchanged. Local Supabase connection settings belong in the Git-ignored `.env.local`; only the project URL and publishable key are required. No Supabase dashboard settings, database changes, or production deployment are included. No bid table exists in this checkout.

## Nov. 14 identity proposal

Use the Supabase Auth user's UUID (`user.id`, corresponding to `auth.users.id`) as the stable bidder identifier. Email is for display and login; it can change and must not be the bid ownership key. Do not generate a second bidder ID in the browser.

Client components can read the shared auth context:

```tsx
"use client";
import { useBidderAuth } from "@/app/components/bidder-auth-provider";

// Inside a component:
const { user, loading } = useBidderAuth();
// Wait for loading === false; user?.id is the current bidder UUID.
```

When the bidding owner adds the bid table, agree on `bidder_id uuid not null references auth.users(id)` (or map their existing owner field to this same UUID). Give it a database default of `auth.uid()` so a browser insert can omit the owner field. Enable Row Level Security and require `auth.uid() = bidder_id` in the INSERT policy's WITH CHECK clause for the `authenticated` role. Prevent bidders from changing the owner. Any RPC or server endpoint must likewise derive and verify the identity rather than trust a submitted bidder ID. Use the existing `supabase` export for browser data calls; it is nullable when configuration is missing. Never use a privileged key in browser code.

This is a proposal ready for team review, not a recorded team agreement. Bid amount rules, auction timing, bid visibility, and deletion behavior belong to the bidding/schema owner and still need to be enforced there. This change does not create a broad bid-read or update policy.

Source: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Vercel fork sync proposal (for later)

The configured origin is `ChrisHill415/NewHorizonsAuction`, default branch `main`. GitHub reports it is not itself a fork. The Vercel deployment fork and shared website URL have not been supplied, so no fork relationship or deployment setting is assumed.

Proposed process for team agreement:

1. Use the team's confirmed shared repository `main` as the source of truth. Feature changes go through review there.
2. The owner of the Vercel-connected fork syncs its `main` from the shared repository after each merged PR and before demos. Use GitHub's Sync fork → Update branch when it applies. Resolve divergence through a reviewed merge; do not force-push or maintain independent application edits on the deployment fork's `main`.
3. Vercel deploys the connected fork's `main`. Record the shared merge SHA, the fork SHA, the successful deployment, and its URL so demo code can be traced to the reviewed source. If the fork has merge commits, verify that it contains the shared merge SHA rather than assuming the SHAs are identical.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the intended Vercel environments before building. Use the same shared Supabase project as the team. These public variables are embedded at build time, so redeploy after changing them.
5. Add the exact shared website `/login` URL to Supabase's allowed redirects and set the intended production Site URL. Only allow preview origins the team actually needs. Keep secrets and service-role keys out of client variables and Git.

Choose and record the shared repo, deployment fork, production URL, sync owner, and backup owner before activating this workflow. Publishing the feature branch does not merge it into `main` or configure the Vercel project.

## Nov. 18 demonstration checklist

Run locally first. Repeat against the agreed shared deployment when deployment work is authorized.

1. Configure the intended Supabase URL/publishable key and allow the site's exact `/login` redirect. Enable Email auth. Use a test email whose inbox the presenter can access.
2. Register the test bidder at `/register`. A password mismatch should show an error. If confirmation is enabled, verify the email and follow its link back to `/login`; the page should show the signed-in account. If confirmation is disabled, registration should sign in immediately.
3. Log out, sign in with the test email/password, and confirm the correct account email is shown. Refresh and navigate home; the account should remain signed in.
4. Enter an incorrect password and confirm a clear error appears. If needed, resend a confirmation email using the control on `/login`.
5. Open another tab on the same origin. Log out in one tab; both should show the signed-out UI. Refresh and verify the session stays signed out.
6. In Supabase Authentication → Users, record the test user's UUID for the bidding owner. When bids exist, verify their `bidder_id` matches this UUID and a second account cannot insert a bid using it.

The automated tests intercept Auth responses. Real email delivery, project settings, Row Level Security, and the shared-site demo require this live check and are not claimed as completed locally.
