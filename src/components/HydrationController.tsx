import { useEffect, useRef } from "react";
import { HydrationService } from "@/services/HydrationService";
import { hydrateRules } from "@/lib/rates";
import { useToast } from "@/components/ui/use-toast";

export function HydrationController() {
    const { toast } = useToast();
    const mounted = useRef(false);

    useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;

        const init = async () => {
            // 1. Load from local cache immediately (Fast)
            const cached = HydrationService.loadFromLocal();
            if (cached.length > 0) {
                console.log(`[Hydration] Loaded ${cached.length} rules from cache.`);
                hydrateRules(cached);
            } else {
                console.log("[Hydration] No cached rules found.");
            }

            // 2. Sync from Server (Async)
            console.log("[Hydration] Starting sync...");
            try {
                const fresh = await HydrationService.syncRules();
                if (fresh.length > 0) {
                    hydrateRules(fresh);
                    console.log("[Hydration] Rules updated from server.");
                }
            } catch (e) {
                console.error("[Hydration] Background sync failed", e);
                // Toast is already handled in service for some errors, but we can add specific ones here if needed
            }
        };

        init();
    }, [toast]);

    return null; // Headless component
}
