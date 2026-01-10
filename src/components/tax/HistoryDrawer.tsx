import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Search, Loader2, Trash2, Calendar, FileText, Smartphone } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TaxProfile, TaxComparisonResult } from "@/types/tax-planning";

interface HistoryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectSimulation: (profile: TaxProfile, results: TaxComparisonResult) => void;
}

interface TaxSimulation {
    id: string;
    created_at: string;
    scenario_name: string;
    profile: TaxProfile;
    results: TaxComparisonResult;
    is_mobile: boolean;
}

export function HistoryDrawer({ open, onOpenChange, onSelectSimulation }: HistoryDrawerProps) {
    const [simulations, setSimulations] = useState<TaxSimulation[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tax_simulations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Safe cast since we know the structure
            const safeData = (data || []).map(item => ({
                ...item,
                profile: item.profile as unknown as TaxProfile,
                results: item.results as unknown as TaxComparisonResult
            }));

            setSimulations(safeData);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            toast({
                title: "Erro ao carregar histórico",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('tax_simulations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSimulations(prev => prev.filter(s => s.id !== id));
            toast({ title: "Simulação excluída" });
        } catch (error) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    };

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open]);

    const filteredSimulations = simulations.filter(sim =>
        (sim.scenario_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (sim.profile.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background/95 backdrop-blur-xl border-l border-white/10">
                <SheetHeader className="pb-4 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <History className="h-5 w-5 text-primary" />
                        Histórico de Simulações
                    </SheetTitle>
                    <SheetDescription>
                        Acesse e restaure suas análises anteriores.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou empresa..."
                            className="pl-9 bg-muted/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden -mx-6 px-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3 opacity-50">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm">Carregando histórico...</p>
                        </div>
                    ) : filteredSimulations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-50 text-center">
                            <History className="h-10 w-10 mb-2" />
                            <p className="font-medium">Nenhuma simulação encontrada</p>
                            <p className="text-xs max-w-[200px]">
                                Suas análises salvas aparecerão aqui.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-3 pb-6">
                                {filteredSimulations.map((sim) => (
                                    <div
                                        key={sim.id}
                                        className="group relative flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/50 transition-all cursor-pointer hover:border-primary/30 active:scale-[0.98]"
                                        onClick={() => {
                                            onSelectSimulation(sim.profile, sim.results);
                                            onOpenChange(false);
                                            toast({ title: "Simulação restaurada!" });
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    {sim.scenario_name || "Sem nome"}
                                                    {sim.is_mobile && (
                                                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </h4>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {sim.profile.razao_social || "Empresa não identificada"}
                                                </p>
                                            </div>
                                            <Badge variant={sim.results.melhor_atual === 'simples' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                {sim.results.melhor_atual}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                            <div className="flex items-center text-xs text-muted-foreground gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(sim.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10 -mr-2"
                                                onClick={(e) => handleDelete(sim.id, e)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
