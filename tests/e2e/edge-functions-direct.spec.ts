import { test, expect } from '@playwright/test';

/**
 * E2E Test: Direct testing of Supabase Edge Functions
 * 
 * This test directly calls the edge functions to verify they work correctly
 * without going through the full UI flow.
 */

const SUPABASE_URL = 'https://jksbkhbgggytymhgnerh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprc2JraGJnZ2d5dHltaGduZXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTkzMTAsImV4cCI6MjA3MzE3NTMxMH0.PCk8gUCUbFQsB91MYjbdzImQb9UvhlP2w7p9Gh7Bfb0';

test.describe('Direct Edge Function Tests', () => {
  test('tax-engine: should calculate taxes with existing rule', async ({ request }) => {
    // First, create a test rule via database
    // (In real scenario, this would be done via admin panel or migration)
    
    // Call tax-engine
    const response = await request.post(`${SUPABASE_URL}/functions/v1/tax-engine`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        ncm: '1006.30.11',
        uf_origem: 'MG',
        uf_destino: 'SP',
        valor: 1000.00
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    console.log('Tax Engine Direct Response:', data);
    
    // Verify response structure
    expect(data).toHaveProperty('ncm');
    expect(data).toHaveProperty('uf_destino');
    expect(data).toHaveProperty('valor');
    expect(data).toHaveProperty('rates');
    expect(data).toHaveProperty('values');
    expect(data).toHaveProperty('credit_amount');
    expect(data).toHaveProperty('explanation');
    
    // Verify rates structure
    expect(data.rates).toHaveProperty('ibs');
    expect(data.rates).toHaveProperty('cbs');
    expect(data.rates).toHaveProperty('is');
    
    // Verify values structure
    expect(data.values).toHaveProperty('ibs');
    expect(data.values).toHaveProperty('cbs');
    expect(data.values).toHaveProperty('is');
    expect(data.values).toHaveProperty('total');
    
    // Verify calculations
    const expectedIBS = data.valor * (data.rates.ibs / 100);
    const expectedCBS = data.valor * (data.rates.cbs / 100);
    const expectedIS = data.valor * (data.rates.is / 100);
    const expectedTotal = expectedIBS + expectedCBS + expectedIS;
    
    expect(Math.abs(data.values.ibs - expectedIBS)).toBeLessThan(0.01);
    expect(Math.abs(data.values.cbs - expectedCBS)).toBeLessThan(0.01);
    expect(Math.abs(data.values.is - expectedIS)).toBeLessThan(0.01);
    expect(Math.abs(data.values.total - expectedTotal)).toBeLessThan(0.01);
  });

  test('tax-engine: should handle missing required fields', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/tax-engine`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        // Missing required fields
        ncm: '1006.30.11'
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Missing required fields');
  });

  test('optimizer: should optimize supplier allocation', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/optimizer`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        quantity: 100,
        offers: [
          { id: 'supplier1', price: 10.50 },
          { id: 'supplier2', price: 9.80 },
          { id: 'supplier3', price: 11.20 },
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    console.log('Optimizer Direct Response:', data);
    
    // Verify response structure
    expect(data).toHaveProperty('allocation');
    expect(data).toHaveProperty('cost');
    expect(data).toHaveProperty('violations');
    
    // Verify allocation is an object
    expect(typeof data.allocation).toBe('object');
    
    // Verify cost is a number
    expect(typeof data.cost).toBe('number');
    
    // Verify violations is an array
    expect(Array.isArray(data.violations)).toBeTruthy();
    
    // Verify all quantity was allocated (if no violations)
    if (data.violations.length === 0) {
      const totalAllocated = Object.values(data.allocation as Record<string, number>)
        .reduce((sum, qty) => sum + qty, 0);
      expect(totalAllocated).toBe(100);
      
      // Verify cheapest supplier was chosen
      expect(data.allocation['supplier2']).toBe(100);
      expect(data.cost).toBe(980); // 100 * 9.80
    }
  });

  test('optimizer: should handle MOQ constraints', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/optimizer`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        quantity: 100,
        offers: [
          { id: 'supplier1', price: 10.50, moq: 150 }, // Can't use, MOQ too high
          { id: 'supplier2', price: 9.80, moq: 50 },   // Should use this
          { id: 'supplier3', price: 11.20 },
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    console.log('Optimizer MOQ Response:', data);
    
    // Supplier1 should not be used due to MOQ violation
    expect(data.allocation['supplier1']).toBeUndefined();
    
    // Supplier2 should be used
    expect(data.allocation['supplier2']).toBeGreaterThan(0);
  });

  test('optimizer: should handle missing required fields', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/optimizer`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        // Missing required fields
        offers: []
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('knowledge-base: should return content for valid context key', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/knowledge-base?context_key=ibs_cbs`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    console.log('Knowledge Base Response:', data);
    
    // Verify response structure
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('content_markdown');
    expect(data).toHaveProperty('related_links');
    
    // Verify it's an array
    expect(Array.isArray(data.related_links)).toBeTruthy();
  });

  test('knowledge-base: should return 404 for invalid context key', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/knowledge-base?context_key=invalid_key_12345`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Content not found');
  });
});
