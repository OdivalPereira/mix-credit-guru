import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface HydrationRule {
    id: string;
    ncm?: string;
    uf?: string;
    municipio?: string;
    scenario: string;
    validFrom?: string;
    validTo?: string;
    rates: {
        ibs: number;
        cbs: number;
        is: number;
    }
}

export const STORAGE_KEY = "mix_credit_guru_tax_rules";

export const HydrationService = {
    /**
     * Fetches rules from the backend and saves to LocalStorage.
     * Only attempts to sync if user has an active session.
     */
    async syncRules(): Promise<HydrationRule[]> {
        try {
            // Check for active session before invoking edge function
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log("[Hydration] No active session, using local rules.");
                return this.loadFromLocal();
            }

            const { data, error } = await supabase.functions.invoke('get-tax-rules');

            if (error) throw error;

            if (!Array.isArray(data)) {
                throw new Error("Invalid payload format");
            }

            this.saveToLocal(data);
            console.log(`[Hydration] Synced ${data.length} rules.`);
            return data;
        } catch (err) {
            console.error("[Hydration] Sync failed:", err);
            toast({
                title: "Erro de Sincronização",
                description: "Não foi possível atualizar as regras tributárias. Usando versão local.",
                variant: "destructive",
            });
            return this.loadFromLocal();
        }
    },

    saveToLocal(rules: HydrationRule[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
        } catch (e) {
            console.error("Failed to save rules to localStorage", e);
        }
    },

    loadFromLocal(): HydrationRule[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
