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

- `/register`: email/password registration with password confirmation.
- `/login`: email/password sign-in and confirmation-email resend.
- `/`: signed-in account email and logout, or links to registration and sign-in.

In the shared Supabase project, enable the Email authentication provider. Keep the project's email-confirmation policy; both confirmation-required and immediate-session registration are supported. Under Authentication → URL Configuration, add `http://localhost:3000/login` to the allowed redirect URLs for local confirmation emails. Use the same host consistently (localhost and 127.0.0.1 have separate sessions). If configuring a separate local Supabase instance, use its URL and publishable key instead.

The existing client in `supabase.ts` is shared by the account screens and future data requests. `useBidderAuth()` exposes `{ user, loading, sessionError }` in client components beneath the root provider. Wait until `loading` is false before using `user`; `user === null` means signed out. The SDK restores browser sessions, refreshes tokens, and synchronizes auth events across tabs. Logout uses `scope: "local"` to end this browser's session while leaving other devices signed in.

The account UI is client-side. It does not establish a server cookie session or authorize server routes. The bidding implementation must enforce ownership in Supabase Row Level Security or verify an access token server-side. See [the bidder identity and deployment handoff](docs/bidder-auth-handoff.md).

### 6. Local verification

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start an isolated dev server on `127.0.0.1:3100` with fictitious Supabase settings and intercepted Auth HTTP responses. They cover confirmation-required and immediate registration, validation, invalid credentials, unconfirmed email, confirmation resend and redirects, session persistence, cross-tab logout, local logout when server revocation fails, network errors, and mobile layout. They do not create real accounts or prove that the shared Supabase project is configured correctly.

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
