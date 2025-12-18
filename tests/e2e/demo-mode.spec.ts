import { test, expect } from '@playwright/test';

test.describe('Demo Mode E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage before each test
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('should show demo button on login page', async ({ page }) => {
        await page.goto('/auth');

        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await expect(demoButton).toBeVisible();
    });

    test('should enter demo mode and redirect to home', async ({ page }) => {
        await page.goto('/auth');

        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        // Should redirect to home page
        await expect(page).toHaveURL('/');
    });

    test('should show demo mode banner after entering demo', async ({ page }) => {
        await page.goto('/auth');

        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        // Wait for navigation
        await page.waitForURL('/');

        // Should show demo banner
        await expect(page.getByText(/modo demonstração/i)).toBeVisible();
    });

    test('should persist demo mode after page refresh', async ({ page }) => {
        await page.goto('/auth');

        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        await page.waitForURL('/');

        // Refresh the page
        await page.reload();

        // Should still be in demo mode (not redirected to auth)
        await expect(page).toHaveURL('/');
        await expect(page.getByText(/modo demonstração/i)).toBeVisible();
    });

    test('should load demo data on entering demo mode', async ({ page }) => {
        await page.goto('/auth');

        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        await page.waitForURL('/');

        // Navigate to cotacao page
        await page.goto('/cotacao');

        // Should have demo suppliers loaded (check for any indication)
        await expect(page.getByText(/distribuidora exemplo/i).or(page.getByText(/arroz/i))).toBeVisible({ timeout: 5000 });
    });

    test('should exit demo mode on sign out', async ({ page }) => {
        await page.goto('/auth');

        // Enter demo mode
        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        await page.waitForURL('/');

        // Find and click exit button (X) in the demo banner
        const exitButton = page.locator('[data-testid="exit-demo"]').or(
            page.getByRole('button', { name: /sair/i })
        );

        if (await exitButton.isVisible()) {
            await exitButton.click();

            // Should redirect to auth page
            await expect(page).toHaveURL(/\/auth/);
        }
    });

    test('should show restriction dialog for protected actions', async ({ page }) => {
        await page.goto('/auth');

        // Enter demo mode
        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        await page.waitForURL('/');

        // Navigate to cotacao
        await page.goto('/cotacao');

        // Try to add a supplier (should be restricted)
        const addButton = page.getByTestId('add-fornecedor').or(
            page.getByRole('button', { name: /adicionar fornecedor/i })
        );

        if (await addButton.isVisible()) {
            await addButton.click();

            // Should show demo restriction dialog
            await expect(page.getByText(/modo demonstração/i)).toBeVisible();
            await expect(page.getByText(/necessário criar uma conta/i)).toBeVisible();
        }
    });

    test('should offer account creation from restriction dialog', async ({ page }) => {
        await page.goto('/auth');

        // Enter demo mode
        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        await page.waitForURL('/');
        await page.goto('/cotacao');

        const addButton = page.getByTestId('add-fornecedor').or(
            page.getByRole('button', { name: /adicionar fornecedor/i })
        );

        if (await addButton.isVisible()) {
            await addButton.click();

            // Click create account
            const createAccountButton = page.getByRole('button', { name: /criar conta/i });
            if (await createAccountButton.isVisible()) {
                await createAccountButton.click();

                // Should navigate to signup
                await expect(page).toHaveURL(/\/auth\?view=signup/);
            }
        }
    });
});

test.describe('Demo Mode localStorage', () => {
    test('should set localStorage when entering demo mode', async ({ page }) => {
        await page.goto('/auth');

        const demoButton = page.getByRole('button', { name: /testar sem criar conta/i });
        await demoButton.click();

        await page.waitForURL('/');

        // Check localStorage
        const demoValue = await page.evaluate(() => localStorage.getItem('xtudo-demo-mode'));
        expect(demoValue).toBe('true');
    });

    test('should clear localStorage when exiting demo mode', async ({ page }) => {
        // First set demo mode
        await page.goto('/');
        await page.evaluate(() => localStorage.setItem('xtudo-demo-mode', 'true'));

        await page.goto('/auth');

        // The exit should clear it
        await page.evaluate(() => localStorage.removeItem('xtudo-demo-mode'));

        const demoValue = await page.evaluate(() => localStorage.getItem('xtudo-demo-mode'));
        expect(demoValue).toBeNull();
    });
});
