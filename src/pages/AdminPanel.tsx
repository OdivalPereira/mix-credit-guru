import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxRule } from "@/services/TaxRuleService";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Pencil, Trash2, Upload, Download, FileSpreadsheet, Plus, X, Check } from "lucide-react";
import { readNcmRulesCSV, writeNcmRulesCSV } from "@/lib/csv";

export default function AdminPanel() {
    const { isAdmin, isLoading: guardLoading, userId } = useAdminGuard();
    const [rules, setRules] = useState<TaxRule[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<TaxRule>>({});
    
    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
    
    // CSV Import
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importPreview, setImportPreview] = useState<Partial<TaxRule>[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state for new rule
    const [formData, setFormData] = useState<Partial<TaxRule>>({
        ncm: '',
        uf: 'SP',
        aliquota_ibs: 0,
        aliquota_cbs: 0,
        aliquota_is: 0,
        date_start: new Date().toISOString().split('T')[0],
        date_end: null,
        explanation_markdown: ''
    });

    // Verificar se supabase está disponível
    if (!supabase) {
        return (
            <div className="container mx-auto py-8">
                <p className="text-destructive">Supabase não configurado.</p>
            </div>
        );
    }

    const fetchRules = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ncm_rules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: "Erro ao buscar regras", description: error.message, variant: "destructive" });
        } else {
            setRules(data as TaxRule[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) {
            fetchRules();
        }
    }, [isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!userId) {
            toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
            return;
        }
        
        if (!formData.ncm || !formData.uf || !formData.date_start) {
            toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
            return;
        }
        
        const { error } = await supabase
            .from('ncm_rules')
            .insert([{ 
                ncm: formData.ncm,
                uf: formData.uf,
                date_start: formData.date_start,
                date_end: formData.date_end || null,
                aliquota_ibs: formData.aliquota_ibs || 0,
                aliquota_cbs: formData.aliquota_cbs || 0,
                aliquota_is: formData.aliquota_is || 0,
                explanation_markdown: formData.explanation_markdown || null,
                user_id: userId 
            }]);

        if (error) {
            toast({ title: "Erro ao criar regra", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✓ Regra criada com sucesso" });
            fetchRules();
            setFormData({ 
                ncm: '', 
                uf: 'SP',
                aliquota_ibs: 0,
                aliquota_cbs: 0,
                aliquota_is: 0,
                date_start: new Date().toISOString().split('T')[0],
                date_end: null,
                explanation_markdown: '' 
            });
        }
    };

    const handleEdit = (rule: TaxRule) => {
        setEditingId(rule.id);
        setEditFormData(rule);
    };

    const handleUpdate = async () => {
        if (!editingId || !editFormData.ncm || !editFormData.uf || !editFormData.date_start) {
            toast({ title: "Erro", description: "Dados inválidos", variant: "destructive" });
            return;
        }

        const { error } = await supabase
            .from('ncm_rules')
            .update({
                ncm: editFormData.ncm,
                uf: editFormData.uf,
                date_start: editFormData.date_start,
                date_end: editFormData.date_end || null,
                aliquota_ibs: editFormData.aliquota_ibs || 0,
                aliquota_cbs: editFormData.aliquota_cbs || 0,
                aliquota_is: editFormData.aliquota_is || 0,
                explanation_markdown: editFormData.explanation_markdown || null,
            })
            .eq('id', editingId);

        if (error) {
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✓ Regra atualizada" });
            setEditingId(null);
            setEditFormData({});
            fetchRules();
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleDeleteConfirm = async () => {
        if (!ruleToDelete) return;

        const { error } = await supabase
            .from('ncm_rules')
            .delete()
            .eq('id', ruleToDelete);

        if (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "✓ Regra excluída" });
            fetchRules();
        }
        
        setDeleteDialogOpen(false);
        setRuleToDelete(null);
    };

    const handleExportCSV = () => {
        const csv = writeNcmRulesCSV(rules);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ncm_rules_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "✓ CSV exportado" });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const parsed = readNcmRulesCSV(text);
        
        setImportPreview(parsed);
        setImportDialogOpen(true);
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImportConfirm = async () => {
        if (!userId || importPreview.length === 0) return;

        // Filter out invalid rules
        const rulesToInsert = importPreview
            .filter(rule => rule.ncm && rule.uf && rule.date_start)
            .map(rule => ({
                ncm: rule.ncm!,
                uf: rule.uf!,
                date_start: rule.date_start!,
                date_end: rule.date_end || null,
                aliquota_ibs: rule.aliquota_ibs || 0,
                aliquota_cbs: rule.aliquota_cbs || 0,
                aliquota_is: rule.aliquota_is || 0,
                explanation_markdown: rule.explanation_markdown || null,
                user_id: userId
            }));

        if (rulesToInsert.length === 0) {
            toast({ title: "Erro", description: "Nenhuma regra válida para importar", variant: "destructive" });
            return;
        }

        const { error } = await supabase
            .from('ncm_rules')
            .insert(rulesToInsert);

        if (error) {
            toast({ title: "Erro ao importar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: `✓ ${rulesToInsert.length} regras importadas` });
            setImportDialogOpen(false);
            setImportPreview([]);
            fetchRules();
        }
    };

    if (guardLoading) {
        return (
            <div className="container mx-auto py-8">
                <Skeleton className="h-12 w-64 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto py-8">
            <PageHeader
                icon={Shield}
                iconColor="destructive"
                title="Painel Administrativo"
                description="Gerencie regras fiscais NCM para cálculo de impostos"
                badge={{
                    label: `${rules.length} regras`,
                    variant: "secondary"
                }}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleImportClick}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={rules.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add New Rule Card */}
                <Card className="bg-gradient-to-br from-background to-accent/5 border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Nova Regra
                        </CardTitle>
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
                                        maxLength={2}
                                        value={formData.uf}
                                        onChange={e => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IBS %</label>
                                    <Input
                                        type="number" 
                                        step="0.01"
                                        placeholder="0"
                                        value={formData.aliquota_ibs}
                                        onChange={e => setFormData({ ...formData, aliquota_ibs: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CBS %</label>
                                    <Input
                                        type="number" 
                                        step="0.01"
                                        placeholder="0"
                                        value={formData.aliquota_cbs}
                                        onChange={e => setFormData({ ...formData, aliquota_cbs: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IS %</label>
                                    <Input
                                        type="number" 
                                        step="0.01"
                                        placeholder="0"
                                        value={formData.aliquota_is}
                                        onChange={e => setFormData({ ...formData, aliquota_is: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data Início</label>
                                    <Input
                                        type="date"
                                        value={formData.date_start}
                                        onChange={e => setFormData({ ...formData, date_start: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data Fim (opcional)</label>
                                    <Input
                                        type="date"
                                        value={formData.date_end || ''}
                                        onChange={e => setFormData({ ...formData, date_end: e.target.value || null })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Explicação (Markdown)</label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Por que esta alíquota é aplicada? Justificativa legal..."
                                    value={formData.explanation_markdown || ''}
                                    onChange={e => setFormData({ ...formData, explanation_markdown: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Regra
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Existing Rules Card */}
                <Card className="bg-gradient-to-br from-background to-primary/5 border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Regras Existentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-32" />
                                    <Skeleton className="h-32" />
                                </div>
                            ) : rules.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>Nenhuma regra cadastrada</p>
                                    <p className="text-sm mt-1">Adicione regras ou importe via CSV</p>
                                </div>
                            ) : (
                                rules.map(rule => (
                                    <div 
                                        key={rule.id} 
                                        className={`p-4 border rounded-lg transition-all ${
                                            editingId === rule.id 
                                                ? 'bg-accent border-primary ring-2 ring-primary/20' 
                                                : 'hover:bg-accent/50 hover:border-accent'
                                        }`}
                                    >
                                        {editingId === rule.id ? (
                                            // Edit mode
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input 
                                                        size={1}
                                                        value={editFormData.ncm} 
                                                        onChange={e => setEditFormData({...editFormData, ncm: e.target.value})}
                                                        placeholder="NCM"
                                                    />
                                                    <Input 
                                                        size={1}
                                                        maxLength={2}
                                                        value={editFormData.uf} 
                                                        onChange={e => setEditFormData({...editFormData, uf: e.target.value.toUpperCase()})}
                                                        placeholder="UF"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Input 
                                                        type="number" 
                                                        step="0.01"
                                                        size={1}
                                                        value={editFormData.aliquota_ibs} 
                                                        onChange={e => setEditFormData({...editFormData, aliquota_ibs: Number(e.target.value)})}
                                                        placeholder="IBS %"
                                                    />
                                                    <Input 
                                                        type="number" 
                                                        step="0.01"
                                                        size={1}
                                                        value={editFormData.aliquota_cbs} 
                                                        onChange={e => setEditFormData({...editFormData, aliquota_cbs: Number(e.target.value)})}
                                                        placeholder="CBS %"
                                                    />
                                                    <Input 
                                                        type="number" 
                                                        step="0.01"
                                                        size={1}
                                                        value={editFormData.aliquota_is} 
                                                        onChange={e => setEditFormData({...editFormData, aliquota_is: Number(e.target.value)})}
                                                        placeholder="IS %"
                                                    />
                                                </div>
                                                <Input 
                                                    type="date" 
                                                    value={editFormData.date_start} 
                                                    onChange={e => setEditFormData({...editFormData, date_start: e.target.value})}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleUpdate} className="flex-1">
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Salvar
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                        <X className="h-4 w-4 mr-1" />
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            // View mode
                                            <>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-lg">
                                                        {rule.ncm} 
                                                        <Badge variant="outline" className="ml-2">{rule.uf}</Badge>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={() => handleEdit(rule)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            onClick={() => {
                                                                setRuleToDelete(rule.id);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 my-2 text-sm">
                                                    <div className="bg-primary/10 text-primary p-2 rounded text-center font-medium">
                                                        IBS: {rule.aliquota_ibs}%
                                                    </div>
                                                    <div className="bg-secondary/10 text-secondary-foreground p-2 rounded text-center font-medium">
                                                        CBS: {rule.aliquota_cbs}%
                                                    </div>
                                                    <div className="bg-accent/10 text-accent-foreground p-2 rounded text-center font-medium">
                                                        IS: {rule.aliquota_is}%
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Vigência: {new Date(rule.date_start).toLocaleDateString()}
                                                    {rule.date_end && ` até ${new Date(rule.date_end).toLocaleDateString()}`}
                                                </div>
                                                {rule.explanation_markdown && (
                                                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                                        {rule.explanation_markdown}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A regra será permanentemente excluída.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Import Preview Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview de Importação</DialogTitle>
                        <DialogDescription>
                            Revise as {importPreview.length} regras antes de importar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-4">
                        {importPreview.map((rule, idx) => (
                            <div key={idx} className="p-3 border rounded-lg bg-accent/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">{rule.ncm}</span>
                                    <Badge variant="outline">{rule.uf}</Badge>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {rule.date_start}
                                    </span>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <span>IBS: {rule.aliquota_ibs}%</span>
                                    <span>CBS: {rule.aliquota_cbs}%</span>
                                    <span>IS: {rule.aliquota_is}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleImportConfirm}>
                            Importar {importPreview.length} regras
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
