import { useRef, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { VirtualizedTableBody } from "@/components/ui/virtualized-table-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { z } from "zod";

const vigenciaSchema = z
  .object({
    inicio: z.string().optional(),
    fim: z.string().optional(),
  })
  .optional();

const ruleSchema = z.object({
  ncm: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/, "NCM invalido"),
  descricao: z.string().min(1, "Descricao obrigatoria"),
  receita: z.object({
    codigo: z.string().min(1, "Codigo obrigatorio"),
    descricao: z.string().min(1, "Descricao obrigatoria"),
  }),
  aliquotas: z.object({
    ibs: z.number().nonnegative(),
    cbs: z.number().nonnegative(),
    is: z.number().nonnegative(),
  }),
  vigencia: vigenciaSchema,
  prioridade: z.number().int().min(0).optional(),
});

export default function Regras() {
  const regras = useAppStore((s) => s.regras);
  const receitas = useAppStore((s) => s.receitas);
  const addRegra = useAppStore((s) => s.addRegra);
  const updateRegra = useAppStore((s) => s.updateRegra);
  const removeRegra = useAppStore((s) => s.removeRegra);
  const setRegras = useAppStore((s) => s.setRegras);

  const addReceita = useAppStore((s) => s.addReceita);
  const updateReceita = useAppStore((s) => s.updateReceita);
  const removeReceita = useAppStore((s) => s.removeReceita);

  const fileRef = useRef<HTMLInputElement>(null);
  const regrasTableRef = useRef<HTMLDivElement>(null);
  const receitasTableRef = useRef<HTMLDivElement>(null);
  const shouldVirtualizeRegras = regras.length >= 200;
  const shouldVirtualizeReceitas = receitas.length >= 200;

  const updateRegraField = (
    ncm: string,
    updater: (regra: (typeof regras)[number]) => (typeof regras)[number],
  ) => {
    try {
      const next = regras.map((r) => (r.ncm === ncm ? updater(r) : r));
      const current = next.find((r) => r.ncm === ncm);
      if (!current) return;
      const result = ruleSchema.safeParse({
        ...current,
        aliquotas: {
          ibs: Number(current.aliquotas.ibs) || 0,
          cbs: Number(current.aliquotas.cbs) || 0,
          is: Number(current.aliquotas.is) || 0,
        },
        prioridade:
          typeof current.prioridade === "number"
            ? Number(current.prioridade)
            : undefined,
      });
      if (!result.success) return;
      setRegras(next);
    } catch {
      /* ignore */
    }
  };

  const handleSimpleField = (
    ncm: string,
    field: "ncm" | "descricao" | "prioridade",
    value: string,
  ) => {
    updateRegraField(ncm, (regra) => ({
      ...regra,
      [field]: field === "prioridade" ? Number(value) || 0 : value,
    }));
  };

  const handleReceitaField = (
    ncm: string,
    field: "codigo" | "descricao",
    value: string,
  ) => {
    updateRegraField(ncm, (regra) => ({
      ...regra,
      receita: { ...regra.receita, [field]: value },
    }));
  };

  const handleAliquotaField = (
    ncm: string,
    field: "ibs" | "cbs" | "is",
    value: string,
  ) => {
    updateRegraField(ncm, (regra) => ({
      ...regra,
      aliquotas: { ...regra.aliquotas, [field]: Number(value) || 0 },
    }));
  };

  const handleVigenciaField = (
    ncm: string,
    field: "inicio" | "fim",
    value: string,
  ) => {
    updateRegraField(ncm, (regra) => ({
      ...regra,
      vigencia: { ...regra.vigencia, [field]: value },
    }));
  };

  const handleAddRegra = () => {
    addRegra({
      ncm: "0000.00.00",
      descricao: "",
      receita: { codigo: "", descricao: "" },
      aliquotas: { ibs: 0, cbs: 0, is: 0 },
      vigencia: { inicio: "", fim: "" },
      prioridade: 0,
    });
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        const valid = json.filter((j) => ruleSchema.safeParse(j).success);
        setRegras(valid);
      }
    } catch {
      /* ignore */
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(regras, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "regras.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReload = async () => {
    try {
      const res = await fetch("/data/rules/ncm_rules.json");
      const json = await res.json();
      if (Array.isArray(json)) {
        setRegras(json);
      }
    } catch {
      /* ignore */
    }
  };

  const handleAddReceita = () => {
    addReceita({ codigo: "", descricao: "" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => fileRef.current?.click()}>Importar JSON</Button>
        <input
          type="file"
          accept="application/json"
          className="hidden"
          ref={fileRef}
          data-testid="regras-import-input"
          onChange={handleImport}
        />
        <Button variant="secondary" onClick={handleExport}>
          Exportar JSON
        </Button>
        <Button variant="outline" onClick={handleReload}>
          Recarregar regras
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras NCM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button size="sm" onClick={handleAddRegra}>
              Adicionar regra
            </Button>
          </div>
          <Table
            data-testid="regras-table"
            containerRef={regrasTableRef}
            containerClassName={shouldVirtualizeRegras ? "max-h-[500px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>NCM</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Código Receita</TableHead>
                <TableHead>Descrição Receita</TableHead>
                <TableHead>IBS</TableHead>
                <TableHead>CBS</TableHead>
                <TableHead>IS</TableHead>
                <TableHead>Início Vigência</TableHead>
                <TableHead>Fim Vigência</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={regras}
              colSpan={11}
              scrollElement={() => regrasTableRef.current}
              estimateSize={() => 68}
              renderRow={(r) => (
                <TableRow key={r.ncm} data-testid="regras-row">
                  <TableCell>
                    <Input
                      value={r.ncm}
                      onChange={(e) => handleSimpleField(r.ncm, "ncm", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.descricao}
                      onChange={(e) =>
                        handleSimpleField(r.ncm, "descricao", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.receita.codigo}
                      onChange={(e) => handleReceitaField(r.ncm, "codigo", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.receita.descricao}
                      onChange={(e) =>
                        handleReceitaField(r.ncm, "descricao", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.aliquotas.ibs}
                      onChange={(e) => handleAliquotaField(r.ncm, "ibs", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.aliquotas.cbs}
                      onChange={(e) => handleAliquotaField(r.ncm, "cbs", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.aliquotas.is}
                      onChange={(e) => handleAliquotaField(r.ncm, "is", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={r.vigencia?.inicio ?? ""}
                      onChange={(e) =>
                        handleVigenciaField(r.ncm, "inicio", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={r.vigencia?.fim ?? ""}
                      onChange={(e) =>
                        handleVigenciaField(r.ncm, "fim", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.prioridade ?? 0}
                      onChange={(e) =>
                        handleSimpleField(r.ncm, "prioridade", e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRegra(r.ncm)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button size="sm" onClick={handleAddReceita}>
              Adicionar receita
            </Button>
          </div>
          <Table
            data-testid="receitas-table"
            containerRef={receitasTableRef}
            containerClassName={shouldVirtualizeReceitas ? "max-h-[400px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={receitas}
              colSpan={3}
              scrollElement={() => receitasTableRef.current}
              estimateSize={() => 64}
              renderRow={(r) => (
                <TableRow key={r.codigo}>
                  <TableCell>
                    <Input
                      value={r.codigo}
                      onChange={(e) => updateReceita(r.codigo, { codigo: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.descricao}
                      onChange={(e) => updateReceita(r.codigo, { descricao: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReceita(r.codigo)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
