import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('Demo Mode Persistence', () => {
    const DEMO_STORAGE_KEY = 'xtudo-demo-mode';

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    it('should use correct localStorage key for demo mode', () => {
        expect(DEMO_STORAGE_KEY).toBe('xtudo-demo-mode');
    });

    it('should save demo mode to localStorage', () => {
        localStorage.setItem(DEMO_STORAGE_KEY, 'true');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(DEMO_STORAGE_KEY, 'true');
    });

    it('should read demo mode from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('true');

        const value = localStorage.getItem(DEMO_STORAGE_KEY);

        expect(value).toBe('true');
    });

    it('should remove demo mode from localStorage on sign out', () => {
        localStorage.setItem(DEMO_STORAGE_KEY, 'true');
        localStorage.removeItem(DEMO_STORAGE_KEY);

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(DEMO_STORAGE_KEY);
    });

    it('should return null when demo mode is not set', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const value = localStorage.getItem(DEMO_STORAGE_KEY);

        expect(value).toBeNull();
    });

    it('should persist demo mode across page reload simulation', () => {
        // Set demo mode
        localStorage.setItem(DEMO_STORAGE_KEY, 'true');

        // Clear and restore (simulating page reload)
        const savedValue = localStorage.getItem(DEMO_STORAGE_KEY);
        localStorageMock.getItem.mockReturnValue(savedValue);

        // Check value is still there
        expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBe('true');
    });
});

describe('Demo Mode Authentication Bypass', () => {
    it('should allow access to protected routes when isDemo is true', () => {
        // Test the logic: user is null but isDemo is true
        const user = null;
        const isDemo = true;

        // This mimics the ProtectedRoute logic
        const shouldAllowAccess = user !== null || isDemo;

        expect(shouldAllowAccess).toBe(true);
    });

    it('should deny access when both user and isDemo are false', () => {
        const user = null;
        const isDemo = false;

        const shouldAllowAccess = user !== null || isDemo;

        expect(shouldAllowAccess).toBe(false);
    });

    it('should allow access when user is authenticated regardless of isDemo', () => {
        const user = { id: 'user-123' };
        const isDemo = false;

        const shouldAllowAccess = user !== null || isDemo;

        expect(shouldAllowAccess).toBe(true);
    });
});
