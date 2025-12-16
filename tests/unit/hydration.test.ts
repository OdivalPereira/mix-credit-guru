import { describe, it, expect, beforeEach } from 'vitest';
import { hydrateRules, computeRates } from '@/lib/rates';
import { HydrationRule } from '@/services/HydrationService';

describe('Tax Engine Hydration', () => {

    // Clean state if possible, but rates.ts is a singleton module. 
    // We should test an additive change that is distinct.

    it('should apply hydrated rules over static rules', () => {
        const mockNcm = "9999.99.99";
        const scenario = "default";
        const date = new Date("2026-01-01"); // Post-reform

        const ctx = {
            uf: "SP",
            municipio: "Sao Paulo",
            flagsItem: { ncm: mockNcm }
        };

        // 1. Initial State: Should be 0 or default for unknown NCM
        const initial = computeRates(scenario, date, ctx);

        // 2. Hydrate with a specific rule for this fake NCM
        const newRule: HydrationRule = {
            id: "test-rule-1",
            ncm: mockNcm,
            scenario: "default",
            validFrom: "2025-01-01",
            rates: {
                ibs: 15,
                cbs: 15,
                is: 0
            }
        };

        hydrateRules([newRule]);

        // 3. Verify Update
        const updated = computeRates(scenario, date, ctx);

        expect(updated.ibs).toBe(15);
        expect(updated.cbs).toBe(15);
        // Ensure it didn't break functionality
        expect(updated).not.toEqual(initial);
    });

    it('should map global rules correctly', () => {
        // Test global hydration if supported
        // ...
    });
});
