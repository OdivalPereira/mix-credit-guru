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

test.describe("Comparação de cenários", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem("cmx_skip_seed", "true");
      window.sessionStorage?.clear?.();
    });
  });

  test("alternar entre 2025 e 2033 atualiza o resumo", async ({ page }) => {
    await page.goto("/cenarios");
    await dismissDonationModal(page);

    await expect(page.getByRole("heading", { name: "Reforma Tributária - Fase 1" })).toBeVisible();
    await expect(page.getByText("Ano: 2025")).toBeVisible();

    await page.getByTestId("scenario-select").click();
    await page.getByRole("option", { name: /2033 - Longo Prazo/ }).click();

    await expect(page.getByRole("heading", { name: "Cenário de Longo Prazo" })).toBeVisible();
    await expect(page.getByText("Ano: 2033")).toBeVisible();
  });
});
