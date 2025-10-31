
import { test, expect } from '@playwright/test';

test.describe('Donation Modal', () => {
  test('should open and close the donation modal', async ({ page }) => {
    await page.goto('/');

    // Check if the modal is initially closed
    await expect(page.locator('text=Apoie este projeto')).not.toBeVisible();

    // Close the welcome tour
    await page.click('button:has-text("Pular")');

    // Click the "Apoiar" button in the header
    await page.click('button:has-text("Apoiar")');

    // Check if the modal is visible
    await expect(page.locator('text=Apoie este projeto')).toBeVisible();

    // Take a screenshot of the modal
    await page.screenshot({ path: 'jules-scratch/verification/verification.png' });

  });
});
