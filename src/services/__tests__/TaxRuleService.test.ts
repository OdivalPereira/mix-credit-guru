import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxRuleService } from '../TaxRuleService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn()
    }
}));

describe('TaxRuleService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch a rule successfully', async () => {
        const mockRule = {
            id: '1',
            ncm: '1006.30.11',
            uf: 'SP',
            aliquota_ibs: 10,
            aliquota_cbs: 5,
            aliquota_is: 0,
            date_start: '2025-01-01',
            explanation_markdown: 'Test explanation'
        };

        // Setup mock chain
        const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockRule, error: null });
        const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
        const orMock = vi.fn().mockReturnValue({ limit: limitMock });
        const lteMock = vi.fn().mockReturnValue({ or: orMock });
        const eqUfMock = vi.fn().mockReturnValue({ lte: lteMock });
        const eqNcmMock = vi.fn().mockReturnValue({ eq: eqUfMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqNcmMock });
        const fromMock = vi.fn().mockReturnValue({ select: selectMock });

        (supabase.from as any).mockImplementation(fromMock);

        const result = await TaxRuleService.getRule('1006.30.11', 'SP', new Date('2025-06-01'));

        expect(result).toEqual(mockRule);
        expect(supabase.from).toHaveBeenCalledWith('ncm_rules');
    });

    it('should return null if no rule found', async () => {
        // Setup mock chain for null result
        const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
        const limitMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
        const orMock = vi.fn().mockReturnValue({ limit: limitMock });
        const lteMock = vi.fn().mockReturnValue({ or: orMock });
        const eqUfMock = vi.fn().mockReturnValue({ lte: lteMock });
        const eqNcmMock = vi.fn().mockReturnValue({ eq: eqUfMock });
        const selectMock = vi.fn().mockReturnValue({ eq: eqNcmMock });
        const fromMock = vi.fn().mockReturnValue({ select: selectMock });

        (supabase.from as any).mockImplementation(fromMock);

        const result = await TaxRuleService.getRule('9999.99.99', 'SP', new Date());

        expect(result).toBeNull();
    });
});
