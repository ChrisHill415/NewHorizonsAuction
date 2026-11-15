import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    env: {
      // Deliberately fictitious. All Auth HTTP calls are intercepted by tests.
      NEXT_PUBLIC_SUPABASE_URL: "https://bidder-auth-test.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
