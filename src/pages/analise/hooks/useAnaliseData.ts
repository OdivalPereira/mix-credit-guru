
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useAppStore } from "@/store/useAppStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import { analisarImpactoProduto, calcularTotais, type ProdutoAnalise } from "@/lib/impacto";
import { scenarioTimeline } from "@/data/scenarios";
import type { MixResultadoItem } from "@/types/domain";
import { toast } from "@/hooks/use-toast";

export interface ProdutoSelecionado {
    produtoId: string;
    quantidade: number;
}

const getEffectiveCost = (item: MixResultadoItem) =>
    item.custoNormalizado ?? item.custoEfetivo;

const calcularMix = (vencedores: MixResultadoItem[], totalQuantidade: number) => {
    const totalCusto = vencedores.reduce((sum, item) => sum + item.custoEfetivo, 0);
    return vencedores.map(item => ({
        ...item,
        mix: totalCusto > 0 ? (item.custoEfetivo / totalCusto) * 100 : 0,
        custoPorPorcao: totalQuantidade > 0 ? item.custoEfetivo / totalQuantidade : 0,
    }));
};

export const useAnaliseData = () => {
    const navigate = useNavigate();

    // Stores
    const catalogo = useCatalogoStore((state) => state.produtos);
    const { contexto, fornecedores, resultado, ultimaOtimizacao } = useCotacaoStore();
    const scenario = useAppStore((state) => state.scenario);
    const setScenario = useAppStore((state) => state.setScenario);
    const conversoes = useUnidadesStore((state) => state.conversoes);
    const yields = useUnidadesStore((state) => state.yields);

    // Estado para Impacto
    const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
    const [novoProdutoId, setNovoProdutoId] = useState<string>("");

    // Estado para Cenários
    const [compareYear, setCompareYear] = useState(
        () => scenarioTimeline[1]?.year ?? scenarioTimeline[0]?.year ?? "",
    );

    // === IMPACTO: Análises ===
    const analises = useMemo<ProdutoAnalise[]>(() => {
        if (!contexto.uf || !contexto.regime) return [];

        return produtosSelecionados
            .map((sel) => {
                const produto = catalogo.find((p) => p.id === sel.produtoId);
                if (!produto) return null;

                return analisarImpactoProduto(produto, sel.quantidade, {
                    uf: contexto.uf,
                    municipio: contexto.municipio,
                    regime: contexto.regime,
                    destino: contexto.destino,
                    date: contexto.data,
                    precoMedio: 100,
                });
            })
            .filter(Boolean) as ProdutoAnalise[];
    }, [produtosSelecionados, catalogo, contexto]);

    const totais = useMemo(() => calcularTotais(analises), [analises]);

    const chartDataImpacto = useMemo(() => {
        return analises.map((a) => ({
            nome: a.descricao.slice(0, 20),
            Antes: a.custoAntes,
            Depois: a.custoDepois,
        }));
    }, [analises]);

    // === CENÁRIOS: Comparação ===
    const baseOption = useMemo(() => {
        return (
            scenarioTimeline.find((option) => option.scenarioKey === scenario) ??
            scenarioTimeline[0]
        );
    }, [scenario]);

    const compareOption = useMemo(() => {
        return (
            scenarioTimeline.find((option) => option.year === compareYear) ??
            baseOption
        );
    }, [compareYear, baseOption]);

    const hasDados = fornecedores.length > 0;

    const baseResultado = useMemo(() => {
        if (!hasDados) return { itens: [] as MixResultadoItem[] };
        return useCotacaoStore.getState().computeResultado(baseOption.scenarioKey);
    }, [baseOption.scenarioKey, fornecedores, contexto, conversoes, yields, hasDados]);

    const compareResultado = useMemo(() => {
        if (!hasDados) return { itens: [] as MixResultadoItem[] };
        return useCotacaoStore.getState().computeResultado(compareOption.scenarioKey);
    }, [compareOption.scenarioKey, fornecedores, contexto, conversoes, yields, hasDados]);

    const allItemIds = useMemo(() => {
        const ids = new Set<string>();
        baseResultado.itens.forEach((item) => ids.add(item.id));
        compareResultado.itens.forEach((item) => ids.add(item.id));
        return Array.from(ids);
    }, [baseResultado.itens, compareResultado.itens]);

    const resumoComparacao = useMemo(() => {
        if (!hasDados) return null;
        const somaBase = baseResultado.itens.reduce((acc, item) => acc + getEffectiveCost(item), 0);
        const somaComparado = compareResultado.itens.reduce((acc, item) => acc + getEffectiveCost(item), 0);
        const variacao = somaComparado - somaBase;
        const percentual = somaBase > 0 ? (variacao / somaBase) * 100 : 0;
        return { somaBase, somaComparado, variacao, percentual };
    }, [baseResultado.itens, compareResultado.itens, hasDados]);

    // === RELATÓRIOS: Dados ===
    const vencedores = resultado.itens.slice(0, 3);
    const mixData = calcularMix(vencedores, 1);

    const impactoDataRelatorio = useMemo(() => {
        if (!contexto.uf || !contexto.regime || fornecedores.length === 0) return null;

        const analisesRel = fornecedores
            .filter(f => f.ativo && f.produtoId)
            .map(f => {
                const produto = catalogo.find(p => p.id === f.produtoId);
                if (!produto) return null;

                return analisarImpactoProduto(produto, 1, {
                    uf: contexto.uf,
                    municipio: contexto.municipio,
                    regime: contexto.regime,
                    destino: contexto.destino,
                    date: contexto.data || new Date().toISOString(),
                    precoMedio: f.preco || 100,
                });
            })
            .filter(Boolean);

        if (analisesRel.length === 0) return null;

        const totaisRel = calcularTotais(analisesRel);
        return { analises: analisesRel, totais: totaisRel };
    }, [fornecedores, catalogo, contexto]);

    const comparacaoCenarios = useMemo(() => {
        if (fornecedores.length === 0) return null;

        const computeResultado = useCotacaoStore.getState().computeResultado;
        const resultados = scenarioTimeline.map(s => ({
            ano: s.year,
            titulo: s.data.title,
            scenarioKey: s.scenarioKey,
            resultado: computeResultado(s.scenarioKey),
        }));

        return resultados;
    }, [fornecedores, contexto]);

    // === HANDLERS: Impacto ===
    const handleAdicionarProduto = () => {
        if (!novoProdutoId) return;
        if (produtosSelecionados.some((p) => p.produtoId === novoProdutoId)) return;
        setProdutosSelecionados([...produtosSelecionados, { produtoId: novoProdutoId, quantidade: 1 }]);
        setNovoProdutoId("");
    };

    const handleRemoverProduto = (produtoId: string) => {
        setProdutosSelecionados(produtosSelecionados.filter((p) => p.produtoId !== produtoId));
    };

    const handleQuantidadeChange = (produtoId: string, quantidade: number) => {
        setProdutosSelecionados(
            produtosSelecionados.map((p) =>
                p.produtoId === produtoId ? { ...p, quantidade: Math.max(1, quantidade) } : p
            )
        );
    };

    const handleCotarFornecedores = () => {
        const produtosIds = produtosSelecionados.map(p => p.produtoId);
        sessionStorage.setItem("impacto-produtos", JSON.stringify(produtosIds));
        navigate("/cotacao");
        toast({
            title: "Redirecionando para Cotação",
            description: `${produtosSelecionados.length} produto(s) selecionado(s) para cotação`,
        });
    };

    // === HANDLERS: Cenários ===
    const handleBaseYearChange = (year: string) => {
        const option = scenarioTimeline.find((item) => item.year === year);
        if (option) {
            setScenario(option.scenarioKey);
        }
    };

    const handleExportExcel = () => {
        const csvData = useCotacaoStore.getState().exportarCSV();
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: "Exportado", description: "Relatório exportado em formato CSV" });
    };

    return {
        // Stores/Data
        catalogo,
        contexto,
        fornecedores,
        resultado,
        ultimaOtimizacao,

        // Impacto State & Data
        produtosSelecionados,
        setProdutosSelecionados,
        novoProdutoId,
        setNovoProdutoId,
        analises,
        totais,
        chartDataImpacto,

        // Cenários State & Data
        compareYear,
        setCompareYear,
        baseOption,
        compareOption,
        hasDados,
        baseResultado,
        compareResultado,
        allItemIds,
        resumoComparacao,

        // Relatórios Data
        vencedores,
        mixData,
        impactoDataRelatorio,
        comparacaoCenarios,

        // Handlers
        handleAdicionarProduto,
        handleRemoverProduto,
        handleQuantidadeChange,
        handleCotarFornecedores,
        handleBaseYearChange,
        handleExportExcel,

        // Helpers export needed for Components
        getEffectiveCost,
    };
};
