import { useEffect, useRef } from "react";
import { HydrationService } from "@/services/HydrationService";
import { hydrateRules } from "@/lib/rates";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function HydrationController() {
    const { toast } = useToast();
    const { isDemo, session } = useAuth();
    const hasSynced = useRef(false);

    useEffect(() => {
        const init = async () => {
            // 1. Load from local cache immediately (Fast)
            const cached = HydrationService.loadFromLocal();
            if (cached.length > 0) {
                hydrateRules(cached);
            }

            // 2. Sync from Server (Async) - Skip if in Demo Mode OR No Session
            if (isDemo || !session || hasSynced.current) {
                return;
            }

            hasSynced.current = true;
            console.log("[Hydration] Starting sync...");
            try {
                const fresh = await HydrationService.syncRules();
                if (fresh.length > 0) {
                    hydrateRules(fresh);
                }
            } catch (e) {
                console.error("[Hydration] Background sync failed", e);
                hasSynced.current = false; // Allow retry on next trigger if failed? Or maybe not to avoid loops.
            }
        };

        init();
    }, [toast, isDemo, session]);

    return null; // Headless component
}
