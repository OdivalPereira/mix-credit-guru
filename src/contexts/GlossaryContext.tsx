import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlossaryContextType {
    activeTerm: string | null;
    setActiveTerm: (term: string | null) => void;
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export function GlossaryProvider({ children }: { children: ReactNode }) {
    const [activeTerm, setActiveTerm] = useState<string | null>(null);

    return (
        <GlossaryContext.Provider value={{ activeTerm, setActiveTerm }}>
            {children}
        </GlossaryContext.Provider>
    );
}

export function useGlossary() {
    const context = useContext(GlossaryContext);
    if (context === undefined) {
        throw new Error('useGlossary must be used within a GlossaryProvider');
    }
    return context;
}
