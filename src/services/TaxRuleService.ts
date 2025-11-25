import { supabase } from "@/integrations/supabase/client";

export interface TaxRule {
    id: string;
    ncm: string;
    uf: string;
    date_start: string;
    date_end: string | null;
    aliquota_ibs: number;
    aliquota_cbs: number;
    aliquota_is: number;
    explanation_markdown: string | null;
}

export const TaxRuleService = {
    async getRule(ncm: string, uf: string, date: Date): Promise<TaxRule | null> {
        const formattedDate = date.toISOString().split('T')[0];

        // We need to find a rule that is active for the given date
        // date_start <= date AND (date_end IS NULL OR date_end >= date)

        const { data, error } = await supabase
            .from('ncm_rules')
            .select('*')
            .eq('ncm', ncm)
            .eq('uf', uf)
            .lte('date_start', formattedDate)
            .or(`date_end.is.null,date_end.gte.${formattedDate}`)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching tax rule:', error);
            return null;
        }

        return data as TaxRule;
    }
};
