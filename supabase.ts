import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// One client keeps authentication and future bid requests in sync.
// An unconfigured checkout still renders, with sign-in disabled.
export const supabase =
  url && publishableKey ? createClient(url, publishableKey) : null;
