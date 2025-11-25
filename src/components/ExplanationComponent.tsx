import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface ExplanationComponentProps {
    explanation: string | null;
}

export const ExplanationComponent: React.FC<ExplanationComponentProps> = ({ explanation }) => {
    if (!explanation) return null;

    return (
        <Card className="mt-4 bg-blue-50/50 border-blue-100 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
                <Info className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-medium text-blue-800">Tax Insight</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-blue-700/90 whitespace-pre-wrap leading-relaxed">
                    {explanation}
                </div>
            </CardContent>
        </Card>
    );
};
