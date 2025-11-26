import { supabase } from "@/integrations/supabase/client";

export interface TaxCalculationResult {
    ncm: string;
    uf_destino: string;
    valor: number;
    rates: {
        ibs: number;
        cbs: number;
        is: number;
    };
    values: {
        ibs: number;
        cbs: number;
        is: number;
        total: number;
    };
    credit_amount: number;
    explanation: string;
}

export const TaxApiClient = {
    async calculateTax(ncm: string, uf_origem: string, uf_destino: string, valor: number): Promise<TaxCalculationResult | null> {
        try {
            const { data, error } = await supabase.functions.invoke('tax-engine', {
                body: { ncm, uf_origem, uf_destino, valor }
            });

            if (error) {
                console.error('Error calling tax-engine:', error);
                return null;
            }

            return data as TaxCalculationResult;
        } catch (e) {
            console.error('Exception calling tax-engine:', e);
            return null;
        }
    }
};
