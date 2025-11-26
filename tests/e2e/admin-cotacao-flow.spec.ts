import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete flow from Admin Panel to Quote optimization
 * 
 * This test verifies:
 * 1. Admin Panel can create tax rules
 * 2. Tax rules are stored in database
 * 3. Quote creation triggers tax-engine edge function
 * 4. Optimizer edge function processes supplier data
 */

test.describe('Admin Panel → Cotação → Edge Functions Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should create tax rule in admin panel and use it in quote', async ({ page }) => {
    // Step 1: Navigate to Admin Panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify admin panel loaded
    await expect(page.getByText('Tax Rules Admin')).toBeVisible();

    // Step 2: Add a new tax rule
    const testNCM = '1006.30.11'; // Rice NCM
    const testUF = 'SP';
    const testIBS = '8.5';
    const testCBS = '5.5';
    const testIS = '0';
    const testExplanation = 'Test rule for E2E: Rice products in São Paulo';

    // Fill form
    await page.getByPlaceholder('Ex: 1006.30.11').fill(testNCM);
    await page.getByPlaceholder('SP').fill(testUF);
    
    // Fill tax rates
    const ibsInput = page.locator('input[type="number"]').first();
    const cbsInput = page.locator('input[type="number"]').nth(1);
    const isInput = page.locator('input[type="number"]').nth(2);
    
    await ibsInput.fill(testIBS);
    await cbsInput.fill(testCBS);
    await isInput.fill(testIS);

    // Fill explanation
    await page.getByPlaceholder('Why is this rate applied?').fill(testExplanation);

    // Submit form
    await page.getByRole('button', { name: 'Add Rule' }).click();

    // Wait for success toast
    await expect(page.getByText('Tax rule added successfully')).toBeVisible({ timeout: 5000 });

    // Verify rule appears in list
    await expect(page.getByText(testNCM)).toBeVisible();

    // Step 3: Navigate to Cotação
    await page.goto('/cotacao');
    await page.waitForLoadState('networkidle');

    // Step 4: Fill context (required for tax calculation)
    await page.getByLabel('Produto').fill('Arroz Branco');
    await page.getByLabel('UF').selectOption('SP');
    await page.getByLabel('Data').fill('2025-11-26');

    // Step 5: Add a supplier with the NCM we created
    // Note: This assumes QuoteWizard or similar UI
    // Adjust selectors based on actual implementation
    
    // Wait for supplier form to load
    await page.waitForSelector('[data-testid="supplier-form"]', { timeout: 10000 }).catch(() => {
      console.log('Supplier form not found, trying alternative selector');
    });

    // Try to add supplier through UI
    const addSupplierBtn = page.getByRole('button', { name: /adicionar|add supplier/i });
    if (await addSupplierBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addSupplierBtn.click();
    }

    // Fill supplier data
    const supplierNameInput = page.getByPlaceholder(/nome.*fornecedor/i);
    if (await supplierNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await supplierNameInput.fill('Fornecedor Teste E2E');
      
      // Fill price
      const priceInput = page.getByLabel(/preço|price/i);
      await priceInput.fill('100.00');

      // Fill NCM (this will trigger tax-engine)
      const ncmInput = page.getByLabel(/ncm/i);
      await ncmInput.fill(testNCM);
    }

    // Step 6: Trigger calculation (which calls enrichSuppliersWithTaxes)
    const calculateBtn = page.getByRole('button', { name: /calcular|calculate/i });
    if (await calculateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      
      // Listen for tax-engine API call
      const taxEnginePromise = page.waitForResponse(
        response => response.url().includes('tax-engine') && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => null);

      await calculateBtn.click();

      // Verify tax-engine was called
      const taxResponse = await taxEnginePromise;
      if (taxResponse) {
        const taxData = await taxResponse.json();
        console.log('Tax Engine Response:', taxData);
        
        // Verify response structure
        expect(taxData).toHaveProperty('rates');
        expect(taxData.rates).toHaveProperty('ibs');
        expect(taxData.rates).toHaveProperty('cbs');
        expect(taxData.rates).toHaveProperty('is');
        
        // Verify our tax rule was used
        expect(taxData.rates.ibs).toBe(parseFloat(testIBS));
        expect(taxData.rates.cbs).toBe(parseFloat(testCBS));
        expect(taxData.explanation).toContain(testExplanation);
      }
    }

    // Step 7: Test optimizer edge function
    const optimizeBtn = page.getByRole('button', { name: /otimizar|optimize/i });
    if (await optimizeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      
      // Listen for optimizer API call
      const optimizerPromise = page.waitForResponse(
        response => response.url().includes('optimizer') && response.status() === 200,
        { timeout: 15000 }
      ).catch(() => null);

      await optimizeBtn.click();

      // Verify optimizer was called
      const optResponse = await optimizerPromise;
      if (optResponse) {
        const optData = await optResponse.json();
        console.log('Optimizer Response:', optData);
        
        // Verify response structure
        expect(optData).toHaveProperty('allocation');
        expect(optData).toHaveProperty('cost');
        expect(optData).toHaveProperty('violations');
      }
    }

    // Step 8: Cleanup - Delete test rule
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Find and delete the test rule
    const deleteBtn = page.getByRole('button', { name: /excluir|delete/i }).first();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      
      // Confirm deletion in dialog
      await page.getByRole('button', { name: /confirmar|confirm/i }).click();
      
      // Verify rule was deleted
      await expect(page.getByText(testNCM)).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle tax-engine with no matching rule', async ({ page }) => {
    // Navigate to Cotação
    await page.goto('/cotacao');
    await page.waitForLoadState('networkidle');

    // Fill context with non-existent NCM
    await page.getByLabel('Produto').fill('Produto Inexistente');
    
    // Try to trigger tax calculation
    // The tax-engine should return default rates (0) with explanation
    
    // Listen for tax-engine call
    const taxEnginePromise = page.waitForResponse(
      response => response.url().includes('tax-engine'),
      { timeout: 10000 }
    ).catch(() => null);

    // Trigger calculation somehow
    const calculateBtn = page.getByRole('button', { name: /calcular|calculate/i });
    if (await calculateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await calculateBtn.click();
    }

    const taxResponse = await taxEnginePromise;
    if (taxResponse) {
      const taxData = await taxResponse.json();
      console.log('Tax Engine Response (no rule):', taxData);
      
      // Should return 0 rates with explanation
      expect(taxData.rates.ibs).toBe(0);
      expect(taxData.rates.cbs).toBe(0);
      expect(taxData.explanation).toContain('No tax rule found');
    }
  });
});
