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

test.describe("Fluxo de contratos e otimização", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem("cmx_skip_seed", "true");
      window.sessionStorage?.clear?.();
    });
  });

  test("criar contratos, rodar otimização e ver vencedores", async ({ page }) => {
    await page.goto("/");
    await dismissDonationModal(page);

    await page.locator("#data").fill("2025-01-01");

    await page.getByTestId("select-uf").click();
    await page.getByRole("option", { name: "SP - São Paulo" }).click();

    await page.getByTestId("select-destino").click();
    await page.getByRole("option", { name: "A - Refeição" }).click();

    await page.getByTestId("select-regime").click();
    await page.getByRole("option", { name: "Regime Normal" }).click();

    const rows = page.getByTestId("supplier-row");
    await expect(rows).toHaveCount(0);

    const addButton = page.getByTestId("add-fornecedor");
    await addButton.click();
    await addButton.click();

    await expect(rows).toHaveCount(2);

    const alphaId = await rows.nth(0).getAttribute("data-supplier-id");
    const betaId = await rows.nth(1).getAttribute("data-supplier-id");
    if (!alphaId || !betaId) throw new Error("IDs de fornecedores não encontrados");

    const alphaRow = page.locator(`[data-supplier-id="${alphaId}"]`);
    await alphaRow.getByTestId("supplier-name").fill("Fornecedor Alpha");
    await alphaRow.getByTestId("supplier-tipo").fill("Industrial");
    await alphaRow.getByTestId("supplier-regime").fill("normal");
    const alphaPriceInput = alphaRow.getByTestId("supplier-price");
    await alphaPriceInput.click({ clickCount: 3 });
    await alphaPriceInput.fill("50");
    await alphaRow.getByTestId("supplier-frete").fill("5");

    const betaRow = page.locator(`[data-supplier-id="${betaId}"]`);
    await betaRow.getByTestId("supplier-name").fill("Fornecedor Beta");
    await betaRow.getByTestId("supplier-tipo").fill("Distribuidor");
    await betaRow.getByTestId("supplier-regime").fill("normal");
    await betaRow.getByTestId("supplier-price").fill("80");
    await betaRow.getByTestId("supplier-frete").fill("3");

    await expect(alphaRow.getByTestId("supplier-price")).toHaveValue("50");
    await expect(betaRow.getByTestId("supplier-price")).toHaveValue("80");

    await page.getByRole("button", { name: "Otimizar" }).click();

    const progress = page.getByRole("progressbar");
    await progress.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    await progress.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

    const winnerPrice = page.locator('input[data-testid="supplier-price"][value="50"]');
    await expect(winnerPrice).toHaveCount(1);
    const winnerRow = winnerPrice.locator('xpath=ancestor::*[@data-testid="supplier-row"]');
    await expect(winnerRow).toContainText("1º");
  });
});
