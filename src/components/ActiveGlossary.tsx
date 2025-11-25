import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, X } from "lucide-react";
import { useGlossary } from "@/contexts/GlossaryContext";
import { glossaryTerms } from "@/components/shared/GlossaryTerm";
import { Button } from "@/components/ui/button";

export function ActiveGlossary() {
    const { activeTerm, setActiveTerm } = useGlossary();

    if (!activeTerm) return null;

    // Find definition
    // We search by key or by term name
    const termEntry = Object.values(glossaryTerms).find(
        (t) => t.term.toLowerCase() === activeTerm.toLowerCase()
    ) || (glossaryTerms as any)[activeTerm];

    if (!termEntry) return null;

    return (
        <div className="fixed right-4 top-24 w-80 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
            <Card className="shadow-lg border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                        <BookOpen className="h-4 w-4" />
                        Glossário Inteligente
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-2"
                        onClick={() => setActiveTerm(null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <h4 className="font-bold text-lg mb-2">{termEntry.term}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {termEntry.definition}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
