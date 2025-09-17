import { test, expect, type Page } from "@playwright/test";

async function dismissDonationModal(page: Page) {
  const dialog = page.getByRole("dialog", { name: /apoie este projeto/i });
  try {
    await dialog.waitFor({ state: "visible", timeout: 2000 });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  } catch {
    // modal não apareceu
  }
}

test.describe("Importação de regras effective-dated", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem("cmx_skip_seed", "true");
      window.sessionStorage?.clear?.();
    });
  });

  test("importar arquivo JSON popula tabela com vigências", async ({ page }) => {
    await page.goto("/regras");
    await dismissDonationModal(page);

    await page.setInputFiles('[data-testid="regras-import-input"]', "tests/fixtures/rules-effective.json");

    const rows = page.getByTestId("regras-row");
    await expect(rows).toHaveCount(2);

    const firstRow = rows.first();
    await expect(firstRow.locator('input').first()).toHaveValue("1234.56.78");
    const dateInputs = firstRow.locator('input[type="date"]');
    await expect(dateInputs.nth(0)).toHaveValue("2025-01-01");
    await expect(dateInputs.nth(1)).toHaveValue("2025-12-31");

    const secondRow = rows.nth(1);
    await expect(secondRow.locator('input').first()).toHaveValue("8765.43.21");
    const secondDates = secondRow.locator('input[type="date"]');
    await expect(secondDates.nth(0)).toHaveValue("2030-06-01");
    await expect(secondDates.nth(1)).toHaveValue("2030-12-31");
  });
});
