import { expect, test, type Page, type Request } from "@playwright/test";

const user = {
  id: "a1111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "bidder@example.com",
  email_confirmed_at: "2026-11-14T12:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: "2026-11-14T12:00:00Z",
};
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`;
const session = { access_token: token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, user };

async function mockAuth(page: Page) {
  const requests: Request[] = [];
  const mock = { signupSession: false, loginError: "", logoutError: false, networkError: false, delayToken: false };
  await page.context().route("https://bidder-auth-test.supabase.co/**", async (route) => {
    const request = route.request();
    requests.push(request);
    const url = new URL(request.url());
    if (mock.networkError) return route.abort("failed");
    const failure = (code: string, status = 400) => route.fulfill({ status, headers: { "x-supabase-api-version": "2024-01-01", "access-control-expose-headers": "X-Supabase-Api-Version" }, json: { code, msg: code } });
    if (url.pathname.endsWith("/token")) {
      if (mock.delayToken) await new Promise((resolve) => setTimeout(resolve, 300));
      if (mock.loginError) return failure(mock.loginError);
      return route.fulfill({ json: session });
    }
    if (url.pathname.endsWith("/signup")) return route.fulfill({ json: mock.signupSession ? session : user });
    if (url.pathname.endsWith("/logout")) return mock.logoutError ? failure("unexpected_failure", 500) : route.fulfill({ status: 204 });
    if (url.pathname.endsWith("/user")) return route.fulfill({ json: user });
    if (url.pathname.endsWith("/resend")) return route.fulfill({ json: {} });
    throw new Error(`Unexpected Auth request: ${request.method()} ${url.pathname}`);
  });
  return { mock, requests };
}

async function enterCredentials(page: Page) {
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("Local-bidder-123!");
}

async function signIn(page: Page) {
  await page.goto("/login");
  await enterCredentials(page);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
}

test("sign-in persists across navigation and reload, and logout updates another tab", async ({ page }) => {
  const { mock, requests } = await mockAuth(page);
  mock.delayToken = true;
  await page.goto("/login");
  await enterCredentials(page);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Please wait…" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("You’re signed in");
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "My account" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.reload();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  const otherTab = await page.context().newPage();
  await otherTab.goto("/login");
  await expect(otherTab.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("status")).toContainText("You’ve been signed out");
  await expect(otherTab.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  expect(new URL(requests.find((r) => r.url().includes("/logout"))!.url()).searchParams.get("scope")).toBe("local");
  await page.reload();
  await expect(page.getByRole("link", { name: "Create bidder account" })).toBeVisible();
});

test("registration checks matching passwords and explains email confirmation", async ({ page }) => {
  const { requests } = await mockAuth(page);
  await page.goto("/register");
  await enterCredentials(page);
  await page.getByLabel("Confirm password").fill("different-password");
  await page.getByRole("button", { name: "Create bidder account" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("passwords don’t match");
  expect(requests).toHaveLength(0);
  await page.getByLabel("Confirm password").fill("Local-bidder-123!");
  await page.getByRole("button", { name: "Create bidder account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  await expect(page.getByRole("button", { name: "Log out" })).not.toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  const request = requests.find((r) => r.url().includes("/signup"))!;
  expect(request.postDataJSON().email).toBe(user.email);
  expect(new URL(request.url()).searchParams.get("redirect_to")).toBe("http://127.0.0.1:3100/login");
});

test("registration supports projects with email confirmation disabled", async ({ page }) => {
  const { mock } = await mockAuth(page);
  mock.signupSession = true;
  await page.goto("/register");
  await enterCredentials(page);
  await page.getByLabel("Confirm password").fill("Local-bidder-123!");
  await page.getByRole("button", { name: "Create bidder account" }).click();
  await expect(page.getByRole("status")).toContainText("Your bidder account is ready");
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

for (const [code, message] of [
  ["invalid_credentials", "email and password don’t match"],
  ["email_not_confirmed", "Please confirm your email"],
]) {
  test(`sign-in explains ${code} and allows retry`, async ({ page }) => {
    const { mock } = await mockAuth(page);
    mock.loginError = code;
    await page.goto("/login");
    await enterCredentials(page);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator(".account-card").getByRole("alert")).toContainText(message);
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    mock.loginError = "";
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });
}

test("logout clears this browser even when server revocation fails", async ({ page }) => {
  const { mock } = await mockAuth(page);
  await signIn(page);
  mock.logoutError = true;
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("signed out of this browser");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});

test("confirmation email can be resent without claiming the account exists", async ({ page }) => {
  const { requests } = await mockAuth(page);
  await page.goto("/login");
  const resend = page.getByRole("button", { name: "Resend confirmation email" });
  await expect(resend).toBeDisabled();
  await page.getByLabel("Email address").fill(user.email);
  await resend.click();
  await expect(page.getByRole("status")).toContainText("If this account needs confirmation");
  expect(requests.find((r) => r.url().includes("/resend"))!.postDataJSON().type).toBe("signup");
});

test("network failure gives a retryable error", async ({ page }) => {
  const { mock } = await mockAuth(page);
  await page.goto("/login");
  mock.networkError = true;
  await enterCredentials(page);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("Check your connection");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
});

test("an expired confirmation link explains recovery", async ({ page }) => {
  await mockAuth(page);
  await page.goto("/login#error=access_denied&error_code=otp_expired&error_description=Email+link+expired");
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("confirmation link expired");
});

test("a valid confirmation link restores the bidder and removes URL tokens", async ({ page }) => {
  await mockAuth(page);
  await page.goto(`/login#access_token=${token}&refresh_token=test-refresh&expires_in=3600&token_type=bearer&type=signup`);
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe("");
});

test("mobile registration fits the viewport and keeps labels available", async ({ page }) => {
  await mockAuth(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/register");
  await expect(page.getByLabel("Confirm password")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
