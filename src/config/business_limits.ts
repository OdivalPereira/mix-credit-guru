export const BUSINESS_LIMITS = {
    FREE_TIER: {
        MAX_SUPPLIERS: 50,
        MAX_OFFERS_PER_SUPPLIER: 20,
        MAX_SIMULTANEOUS_ITEMS: 1, // Only 1 product simulation at a time for free users
    },
    // Placeholders for future paid plans
    PRO_TIER: {
        MAX_SUPPLIERS: 500,
        MAX_OFFERS_PER_SUPPLIER: 100,
        MAX_SIMULTANEOUS_ITEMS: 10,
    }
};

export const CURRENT_PLAN = 'FREE_TIER'; // In a real app, this would come from Auth/User Profile

export function checkLimit(currentCount: number, limitType: keyof typeof BUSINESS_LIMITS['FREE_TIER']): boolean {
    const limit = BUSINESS_LIMITS[CURRENT_PLAN][limitType];
    return currentCount < limit;
}
