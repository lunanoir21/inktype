import { expect, test, type Page } from "@playwright/test";

const TEXT = "The quick brown fox jumps over the lazy dog.\n\nPack my box with five dozen liquor jugs.";

async function createText(page: Page, body = TEXT) {
  await page.goto("/custom");
  await page.getByTestId("custom-body").fill(body);
  await page.getByTestId("custom-start").click();
  await expect(page.getByTestId("typing-text")).toBeVisible();
}

/** Characters as rendered on the page (paragraph breaks shown as ↵). */
async function pageText(page: Page): Promise<string> {
  return page.$$eval("[data-testid=typing-text] span[data-state]", (els) =>
    els.map((e) => e.textContent ?? "").join(""),
  );
}

async function typeAll(page: Page, text: string) {
  for (const ch of text) {
    if (ch === "↵") await page.keyboard.press("Enter");
    else await page.keyboard.type(ch);
  }
}

test("types a custom text to the end and records the page", async ({ page }) => {
  await createText(page);
  const text = await pageText(page);
  expect(text).toContain("↵");
  await typeAll(page, text);
  await expect(page.getByTestId("page-toast")).toContainText("Page 1");
  await expect(page.getByText("The End")).toBeVisible();

  await page.goto("/stats");
  await expect(page.getByText("Pages typed")).toBeVisible();
  await expect(page.getByRole("link", { name: /The quick brown fox/ })).toBeVisible();
});

test("block mode keeps the cursor on a mistake until it is fixed", async ({ page }) => {
  await createText(page);
  await page.keyboard.type("Tx");
  const second = page.locator("[data-testid=typing-text] span[data-state]").nth(1);
  await expect(second).toHaveAttribute("data-state", "incorrect");
  await page.keyboard.type("he");
  await expect(second).toHaveAttribute("data-state", "correct");
  await expect(page.getByTestId("live-stats")).toContainText("1err");
});

test("Esc pauses, Tab restarts the page", async ({ page }) => {
  await createText(page);
  await page.keyboard.type("The q");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("typing-hint")).toContainText("Paused");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("typing-hint")).toBeHidden();
  await page.keyboard.press("Tab");
  await expect(page.locator("[data-testid=typing-text] span[data-state=correct]")).toHaveCount(0);
});

test("resumes mid-page after a reload", async ({ page }) => {
  await createText(page);
  await page.keyboard.type("The quick");
  // Progress is flushed when the page is hidden/unloaded.
  await page.reload();
  await expect(page.getByTestId("typing-text")).toBeVisible();
  await expect(page.locator("[data-testid=typing-text] span[data-state=correct]")).toHaveCount(9);
});

test("settings drawer changes the theme and look", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("open-settings").click();
  const drawer = page.getByTestId("settings-drawer");
  await expect(drawer).toBeVisible();
  await drawer.locator("summary", { hasText: /^Themes/ }).click();
  await drawer.getByRole("button", { name: /^Paper/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");

  await page.getByTestId("open-settings").click();
  await drawer.getByRole("button", { name: /Terminal/ }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "terminal");
});

test("skip punctuation types punctuation automatically", async ({ page }) => {
  await createText(page, "Hi, you.");
  await page.getByTestId("open-settings").click();
  const drawer = page.getByTestId("settings-drawer");
  await drawer.locator("summary", { hasText: /^Functionality/ }).click();
  await drawer.getByText("Skip punctuation").click();
  await drawer.getByRole("button", { name: "Close settings" }).click();
  await page.getByTestId("typing-viewport").click();
  await page.keyboard.type("Hi you");
  await expect(page.getByText("The End")).toBeVisible();
});
