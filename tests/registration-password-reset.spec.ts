import { expect, test, type Page, type Request } from "@playwright/test";

const user = {
  id: "a1111111-1111-4111-8111-111111111111",
  aud: "authenticated", role: "authenticated", email: "bidder@example.com",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {}, created_at: "2026-11-19T12:00:00Z",
};
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`;
const session = { access_token: token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, user };
const password = "Local-bidder-123!";

async function mockAuth(page: Page) {
  const requests: Request[] = [];
  const mock = { error: "", immediateSession: false };
  await page.context().route("https://bidder-auth-test.supabase.co/**", async (route) => {
    const request = route.request();
    requests.push(request);
    const path = new URL(request.url()).pathname;
    if (mock.error && request.method() !== "GET") {
      return route.fulfill({ status: 400, headers: { "x-supabase-api-version": "2024-01-01", "access-control-expose-headers": "X-Supabase-Api-Version" }, json: { code: mock.error, msg: mock.error } });
    }
    if (path.endsWith("/signup")) return route.fulfill({ json: mock.immediateSession ? session : user });
    if (path.endsWith("/token")) return route.fulfill({ json: session });
    if (path.endsWith("/user")) return route.fulfill({ json: user });
    if (path.endsWith("/recover")) return route.fulfill({ json: {} });
    throw new Error(`Unexpected Auth request: ${request.method()} ${path}`);
  });
  return { requests, mock };
}

async function fillRegistration(page: Page) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("  Alex Bidder  ");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
}

for (const withPhone of [false, true]) {
  test(`registration saves name ${withPhone ? "and phone" : "without requiring phone"}`, async ({ page }) => {
    const { requests, mock } = await mockAuth(page);
    mock.immediateSession = withPhone;
    await fillRegistration(page);
    if (withPhone) await page.getByLabel("Phone number (optional)").fill("  +1 (202) 555-0123  ");
    await page.getByRole("button", { name: "Create bidder account" }).click();
    await expect(page).toHaveURL("/");
    const request = requests.find((r) => new URL(r.url()).pathname.endsWith("/signup"))!;
    expect(request.postDataJSON().data).toEqual({ full_name: "Alex Bidder", ...(withPhone ? { phone: "+1 (202) 555-0123" } : {}) });
    expect(new URL(request.url()).searchParams.get("redirect_to")).toBe("http://127.0.0.1:3100/login");
    if (withPhone) await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    else await expect(page.getByRole("status")).toContainText("Check your inbox");
  });
}

test("registration requires a name and matching passwords before calling Auth", async ({ page }) => {
  const { requests } = await mockAuth(page);
  await fillRegistration(page);
  await page.getByLabel("Full name").fill("");
  await page.getByRole("button", { name: "Create bidder account" }).click();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await page.getByLabel("Full name").fill("   ");
  await page.getByRole("button", { name: "Create bidder account" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("Please enter your name");
  await page.getByLabel("Full name").fill("Alex Bidder");
  await page.getByLabel("Confirm password").fill("different-password");
  await page.getByRole("button", { name: "Create bidder account" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("passwords don’t match");
  expect(requests).toHaveLength(0);
});

test("forgot password sends a recovery email without needing a password", async ({ page }) => {
  const { requests } = await mockAuth(page);
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
  await page.getByLabel("Email address").fill(user.email);
  await expect(page.getByLabel("Password", { exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account uses this email");
  const request = requests.find((r) => new URL(r.url()).pathname.endsWith("/recover"))!;
  expect(request.postDataJSON().email).toBe(user.email);
  expect(new URL(request.url()).searchParams.get("redirect_to")).toBe("http://127.0.0.1:3100/reset-password");
});

test("recovery email errors allow retry", async ({ page }) => {
  const { mock } = await mockAuth(page);
  mock.error = "over_email_send_rate_limit";
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("Too many emails requested");
  mock.error = "";
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("reset link has been sent");
});

test("recovery link stays on reset page, validates, handles errors, and updates password", async ({ page }) => {
  const { requests, mock } = await mockAuth(page);
  await page.goto(`/reset-password#access_token=${token}&refresh_token=test-refresh&expires_in=3600&token_type=bearer&type=recovery`);
  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await expect(page).toHaveURL((url) => url.pathname === "/reset-password" && !url.hash);
  await page.reload();
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("does-not-match");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("passwords don’t match");
  expect(requests.filter((r) => r.method() === "PUT")).toHaveLength(0);
  await page.getByLabel("Confirm password").fill(password);
  mock.error = "same_password";
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator(".account-card").getByRole("alert")).toContainText("different from your current password");
  mock.error = "";
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("status")).toContainText("Your password has been updated");
  expect(requests.filter((r) => r.method() === "PUT").at(-1)!.postDataJSON()).toMatchObject({ password });
});

for (const hash of ["", "#error=access_denied&error_code=otp_expired&error_description=Email+link+expired"]) {
  test(`reset page rejects ${hash ? "expired" : "missing"} recovery links`, async ({ page }) => {
    const { requests } = await mockAuth(page);
    await page.goto(`/reset-password${hash}`);
    await expect(page.locator(".account-card").getByRole("alert")).toContainText("missing, invalid, or expired");
    await expect(page.getByRole("button", { name: "Update password" })).toHaveCount(0);
    await page.getByRole("link", { name: "Request a new reset link" }).click();
    await expect(page).toHaveURL("/forgot-password");
    expect(requests).toHaveLength(0);
  });
}

test("sign-in still opens the catalog", async ({ page }) => {
  await mockAuth(page);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("registration and recovery fit mobile screens", async ({ page }) => {
  await mockAuth(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/register", "/forgot-password", "/reset-password"]) {
    await page.goto(path);
    await expect(page.locator(".account-card h1")).not.toHaveText("A moment, please.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
