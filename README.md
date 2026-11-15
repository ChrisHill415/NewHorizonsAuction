# Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/ChrisHill415/NewHorizonsAuction.git
cd NewHorizonsAuction
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Copy `.env.example` to `.env.local` in the root of the project and fill in the shared Supabase project's values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Located in Supabase when you go to project and click connect in top left.

Use the publishable key, never a service-role or secret key. Without these values the site renders with account forms disabled. Restart the dev server after changing them.


### 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 5. Bidder accounts

- `/register`: email/password registration with password confirmation, then return to the catalog. If email confirmation is required, the catalog shows an inbox reminder while the bidder remains signed out.
- `/login`: email/password sign-in and confirmation-email resend. Successful sign-in, restored sessions on account pages, and valid confirmation links open the catalog.
- `/`: the team’s sample catalog from `main`, available to browse while signed out. Catalog is always available in the header; signed-in bidders also see Log out at the top right.

The account layout lives in `app/(auth)/layout.tsx`, so it only wraps `/login` and `/register`. Account form CSS is scoped to `.account-card` to preserve the catalog’s styling. The catalog currently uses the team’s sample rows, not live bidding data.

In the shared Supabase project, enable the Email authentication provider. Keep the project's email-confirmation policy; both confirmation-required and immediate-session registration are supported. Under Authentication → URL Configuration, add `http://localhost:3000/login` to the allowed redirect URLs for local confirmation emails. Use the same host consistently (localhost and 127.0.0.1 have separate sessions). If configuring a separate local Supabase instance, use its URL and publishable key instead.

The existing client in `supabase.ts` is shared by the account screens and future data requests. `useBidderAuth()` exposes `{ user, loading, sessionError, notice, setNotice, loggingOut, logout }` in client components beneath the root provider. Wait until `loading` is false before using `user`; `user === null` means signed out. The SDK restores browser sessions, refreshes tokens, and synchronizes auth events across tabs. Logout uses `scope: "local"` to end this browser's session while leaving other devices signed in.

The account UI is client-side. It does not establish a server cookie session or authorize server routes. The bidding implementation must enforce ownership in Supabase Row Level Security or verify an access token server-side. See [the bidder identity and deployment handoff](docs/bidder-auth-handoff.md).

### 6. Local verification

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start an isolated dev server on `127.0.0.1:3100` with fictitious Supabase settings and intercepted Auth HTTP responses. They cover confirmation-required and immediate registration, validation, invalid credentials, unconfirmed email, confirmation resend and redirects, session persistence, cross-tab logout, local logout when server revocation fails, network errors, catalog redirects, catalog item preservation, and mobile layout. They do not create real accounts or prove that the shared Supabase project is configured correctly.

### 7. Before starting new work

Keep current feature work on its branch. For a new task, after saving or committing existing changes, update your local `main` branch:

```bash
git checkout main
git pull origin main
```

Then create a new branch:

```bash
git checkout -b feature/your-feature-name
```
