import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxRule } from "@/services/TaxRuleService";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
    const [rules, setRules] = useState<TaxRule[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState<Partial<TaxRule>>({
        ncm: '',
        uf: 'SP',
        aliquota_ibs: 0,
        aliquota_cbs: 0,
        aliquota_is: 0,
        date_start: new Date().toISOString().split('T')[0],
        explanation_markdown: ''
    });

    const fetchRules = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ncm_rules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: "Error fetching rules", description: error.message, variant: "destructive" });
        } else {
            setRules(data as TaxRule[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase
            .from('ncm_rules')
            .insert([formData]);

        if (error) {
            toast({ title: "Error creating rule", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Rule created successfully" });
            fetchRules();
            // Reset form (partial)
            setFormData({ ...formData, ncm: '', explanation_markdown: '' });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Tax Rules Admin</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Rule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">NCM</label>
                                    <Input
                                        placeholder="Ex: 1006.30.11"
                                        value={formData.ncm}
                                        onChange={e => setFormData({ ...formData, ncm: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">UF</label>
                                    <Input
                                        placeholder="Ex: SP"
                                        value={formData.uf}
                                        onChange={e => setFormData({ ...formData, uf: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IBS %</label>
                                    <Input
                                        type="number" placeholder="0"
                                        value={formData.aliquota_ibs}
                                        onChange={e => setFormData({ ...formData, aliquota_ibs: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CBS %</label>
                                    <Input
                                        type="number" placeholder="0"
                                        value={formData.aliquota_cbs}
                                        onChange={e => setFormData({ ...formData, aliquota_cbs: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IS %</label>
                                    <Input
                                        type="number" placeholder="0"
                                        value={formData.aliquota_is}
                                        onChange={e => setFormData({ ...formData, aliquota_is: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input
                                    type="date"
                                    value={formData.date_start}
                                    onChange={e => setFormData({ ...formData, date_start: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Explanation (Markdown)</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Why is this rate applied?"
                                    value={formData.explanation_markdown || ''}
                                    onChange={e => setFormData({ ...formData, explanation_markdown: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full">Add Rule</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {loading ? <p>Loading...</p> : rules.length === 0 ? <p className="text-muted-foreground">No rules found.</p> : rules.map(rule => (
                                <div key={rule.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-lg">{rule.ncm} <span className="text-sm font-normal text-muted-foreground">({rule.uf})</span></div>
                                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                            {new Date(rule.date_start).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 my-2 text-sm">
                                        <div className="bg-blue-50 p-1 rounded text-center">IBS: {rule.aliquota_ibs}%</div>
                                        <div className="bg-purple-50 p-1 rounded text-center">CBS: {rule.aliquota_cbs}%</div>
                                        <div className="bg-orange-50 p-1 rounded text-center">IS: {rule.aliquota_is}%</div>
                                    </div>
                                    {rule.explanation_markdown && (
                                        <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                                            {rule.explanation_markdown}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
