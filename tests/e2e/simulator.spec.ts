import { test, expect } from "@playwright/test";
test("complete a round without leaking its answer", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /FIVE SECONDS/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /START SIMULATION/ }).click();
  await expect(
    page.getByRole("button", { name: /LOCK MY DECISION/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("img", { name: /Tactical football pitch/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/lapulga-play-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByText(/^(FIXTURE ANSWER|REAL MESSI)$/)).toHaveCount(0);
  await page.getByRole("button", { name: /01 PASS/ }).click();
  await page.getByRole("button", { name: "LOCK MY DECISION" }).click();
  await expect(page.getByText(/^(FIXTURE ANSWER|REAL MESSI)$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "NEXT MOMENT" })).toBeVisible();
  await page
    .getByRole("link", { name: "SESSION RESULTS", exact: true })
    .click();
  await expect(page.getByText("MOMENTS PLAYED", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("target selection, next moment, methodology and responsive layout", async ({
  page,
}) => {
  await page.goto("/play");
  await page.getByRole("button", { name: /04 SHOOT/ }).click();
  await page.getByLabel(/TARGET ZONE/).selectOption("FINAL CENTRE");
  await page.getByRole("button", { name: "LOCK MY DECISION" }).click();
  await expect(page.getByText(/^(FIXTURE ANSWER|REAL MESSI)$/)).toBeVisible();
  await page.screenshot({
    path: `/tmp/lapulga-reveal-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "NEXT MOMENT" }).click();
  await expect(
    page.getByRole("button", { name: "LOCK MY DECISION" }),
  ).toBeDisabled();
  await expect(page.getByText(/^(FIXTURE ANSWER|REAL MESSI)$/)).toHaveCount(0);
  await expect(page.getByText(/1 COMPLETED/)).toBeVisible();
  await page.getByRole("link", { name: "THE METHOD", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /AN EXPERIMENT/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("game menu artwork fits the viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-art .sticker")).toHaveAttribute(
    "data-state",
    "loaded",
  );
  await expect(
    page.getByRole("img", {
      name: "Lionel Messi · Barcelona 2018/19",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/lapulga-home-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("link", { name: /START SIMULATION/ }),
  ).toBeVisible();
});

test("missing sticker sheet retains the fallback", async ({ page }) => {
  await page.route("**/stickers/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".hero-art .sticker")).toHaveAttribute(
    "data-state",
    "failed",
  );
  await expect(page.locator(".hero-art .sticker strong")).toHaveText("10");
});

test("three requested eras load their own seasons", async ({ page }) => {
  await page.goto("/play");
  for (const label of [
    "Argentina · 2022",
    "Barcelona · 2018/19",
    "Barcelona · 2010–12",
  ]) {
    const button = page.getByRole("button", {
      name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "LOCK MY DECISION" }),
    ).toBeDisabled();
    await expect(page.locator(".match-panel>.small-label")).toHaveText(
      label.startsWith("Argentina")
        ? /2022/
        : label.includes("2018")
          ? /2018\/(?:20)?19/
          : /201[01]\/(?:20)?1[12]/,
    );
  }
  await page.screenshot({
    path: `/tmp/lapulga-eras-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("target control stays aligned and reduced motion is respected", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-art .sticker")).toHaveAttribute(
    "data-state",
    "loaded",
  );
  expect(
    await page
      .locator(".hero-art .sticker")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.getByRole("link", { name: /START SIMULATION/ }).click();
  const select = page.getByLabel(/TARGET ZONE/);
  await select.focus();
  await expect(select).toBeFocused();
  await select.selectOption("FINAL CENTRE");
  await expect(select).toHaveValue("FINAL CENTRE");
  const field = await select.boundingBox();
  const chevron = await page.locator(".select-field .icon").boundingBox();
  expect(field).not.toBeNull();
  expect(chevron).not.toBeNull();
  expect(chevron!.x).toBeGreaterThan(field!.x);
  expect(chevron!.x + chevron!.width).toBeLessThan(field!.x + field!.width);
  expect(
    Math.abs(chevron!.y + chevron!.height / 2 - field!.y - field!.height / 2),
  ).toBeLessThan(1);
  await expect(
    page.getByRole("link", { name: "PLAY", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
