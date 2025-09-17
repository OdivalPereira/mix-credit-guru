import { useRef, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { z } from "zod";

const ruleSchema = z.object({
  ncm: z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/, "NCM inválido"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  receita: z.object({
    codigo: z.string().min(1, "Código obrigatório"),
    descricao: z.string().min(1, "Descrição obrigatória"),
  }),
  aliquotas: z.object({
    ibs: z.number().nonnegative(),
    cbs: z.number().nonnegative(),
    is: z.number().nonnegative(),
  }),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export default function Regras() {
  const regras = useAppStore((s) => s.regras);
  const receitas = useAppStore((s) => s.receitas);
  const addRegra = useAppStore((s) => s.addRegra);
  const removeRegra = useAppStore((s) => s.removeRegra);
  const setRegras = useAppStore((s) => s.setRegras);

  const addReceita = useAppStore((s) => s.addReceita);
  const updateReceita = useAppStore((s) => s.updateReceita);
  const removeReceita = useAppStore((s) => s.removeReceita);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleField = (
    ncm: string,
    field: keyof typeof regras[number],
    value: string,
    subfield?: keyof typeof regras[number]["aliquotas"] | keyof typeof regras[number]["receita"],
  ) => {
    try {
      const next = regras.map((r) =>
        r.ncm === ncm
          ? {
              ...r,
              [field]:
                field === "aliquotas"
                  ? { ...r.aliquotas, [subfield as string]: Number(value) }
                  : field === "receita"
                  ? { ...r.receita, [subfield as string]: value }
                  : value,
            }
          : r,
      );
      const result = ruleSchema.safeParse(next.find((r) => r.ncm === ncm));
      if (!result.success) return;
      setRegras(next);
    } catch {
      /* ignore */
    }
  };

  const handleAddRegra = () => {
    addRegra({
      ncm: "0000.00.00",
      descricao: "",
      receita: { codigo: "", descricao: "" },
      aliquotas: { ibs: 0, cbs: 0, is: 0 },
      validFrom: "",
      validTo: "",
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NCM</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Código Receita</TableHead>
                <TableHead>Descrição Receita</TableHead>
                <TableHead>IBS</TableHead>
                <TableHead>CBS</TableHead>
                <TableHead>IS</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regras.map((r) => (
                <TableRow key={r.ncm}>
                  <TableCell>
                    <Input
                      value={r.ncm}
                      onChange={(e) => handleField(r.ncm, "ncm", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.descricao}
                      onChange={(e) => handleField(r.ncm, "descricao", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.receita.codigo}
                      onChange={(e) =>
                        handleField(r.ncm, "receita", e.target.value, "codigo")
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.receita.descricao}
                      onChange={(e) =>
                        handleField(r.ncm, "receita", e.target.value, "descricao")
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.aliquotas.ibs}
                      onChange={(e) =>
                        handleField(r.ncm, "aliquotas", e.target.value, "ibs")
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.aliquotas.cbs}
                      onChange={(e) =>
                        handleField(r.ncm, "aliquotas", e.target.value, "cbs")
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.aliquotas.is}
                      onChange={(e) =>
                        handleField(r.ncm, "aliquotas", e.target.value, "is")
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRegra(r.ncm, r.validFrom)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitas.map((r) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
