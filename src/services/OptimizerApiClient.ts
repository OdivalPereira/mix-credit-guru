import { supabase } from "@/integrations/supabase/client";
import type { OptimizePerItemResult } from "@/lib/opt";

export interface Offer {
    id: string;
    price: number;
    moq?: number;
    step?: number;
    capacity?: number;
    share?: number;
}

export interface OptimizeInput {
    quantity: number;
    offers: Offer[];
    budget?: number;
}

export const OptimizerApiClient = {
    async optimize(input: OptimizeInput): Promise<OptimizePerItemResult | null> {
        try {
            const { data, error } = await supabase.functions.invoke('optimizer', {
                body: input
            });

            if (error) {
                console.error('Error calling optimizer:', error);
                throw error;
            }

            return data as OptimizePerItemResult;
        } catch (e) {
            console.error('Exception calling optimizer:', e);
            throw e;
        }
    }
};
