import { supabase } from '@/integrations/supabase/client';
import { ClassificacaoProduto } from '@/lib/strategies/tax-2033-item';

export interface ClassificationResult {
    id: string; // The original ID from the input list
    classificacao: ClassificacaoProduto;
    source: 'governo' | 'ia';
    motivo?: string;
}

export class TaxClassificationService {
    /**
     * Classifies a list of products using a hybrid strategy:
     * 1. Try to find a match in the Silver Layer (Supabase local table).
     * 2. If not found, call the Edge Function (IA fallback).
     * 3. Persist new IA classifications to the Silver Layer.
     */
    static async classifyProducts(produtos: { id: string; descricao: string; ncm: string }[]): Promise<ClassificationResult[]> {
        const results: ClassificationResult[] = [];
        const productsToClassifyWithIA: typeof produtos = [];

        // 1. Try Cache (Silver Layer)
        // We do this in parallel for all products for efficiency
        const cachePromises = produtos.map(async (produto) => {
            const ncmLimpo = produto.ncm?.replace(/\D/g, '');

            const { data, error } = await supabase
                .from('silver_tax_layer')
                .select('classificacao, source')
                .eq('ncm', ncmLimpo)
                .eq('descricao', produto.descricao)
                .maybeSingle();

            if (data && !error) {
                return {
                    id: produto.id,
                    classificacao: data.classificacao as unknown as ClassificacaoProduto,
                    source: data.source as 'governo' | 'ia'
                };
            }
            return null;
        });

        const cachedResults = await Promise.all(cachePromises);

        cachedResults.forEach((res, index) => {
            if (res) {
                results.push(res);
            } else {
                productsToClassifyWithIA.push(produtos[index]);
            }
        });

        if (productsToClassifyWithIA.length === 0) return results;

        // 2. Fallback to IA (Edge Function)
        const { data: iaData, error: iaError } = await supabase.functions.invoke('tax-classifier', {
            body: { produtos: productsToClassifyWithIA }
        });

        if (iaError) {
            console.error('Edge Function Error:', iaError);
            throw new Error('Falha ao classificar com IA');
        }

        if (!iaData.success) {
            throw new Error(iaData.error || 'Erro na classificação via IA');
        }

        // 3. Persist and return IA results
        const persistPromises = iaData.data.map(async (item: any) => {
            const original = productsToClassifyWithIA.find(p => p.id === item.id);
            if (original) {
                const result: ClassificationResult = {
                    id: item.id,
                    classificacao: item.classificacao,
                    source: item.source,
                    motivo: item.motivo
                };

                // Save to Silver Layer (Async, don't block return)
                const ncmLimpo = original.ncm?.replace(/\D/g, '');
                supabase.from('silver_tax_layer').insert({
                    ncm: ncmLimpo,
                    descricao: original.descricao,
                    classificacao: item.classificacao,
                    source: item.source
                }).then(({ error }) => {
                    if (error) console.error('Error persisting to silver_tax_layer:', error);
                });

                return result;
            }
            return null;
        });

        const iaResults = await Promise.all(persistPromises);
        iaResults.forEach(res => {
            if (res) results.push(res);
        });

        return results;
    }
}
