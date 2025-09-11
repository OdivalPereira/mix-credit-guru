import { useState } from "react";
import type {
  ContractFornecedor,
  PriceBreak,
  FreightBreak,
} from "@/types/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContractCardProps = {
  contract: ContractFornecedor;
  onChange: (c: ContractFornecedor) => void;
  onRemove: () => void;
};

function ContractCard({ contract, onChange, onRemove }: ContractCardProps) {
  const [pb, setPb] = useState<PriceBreak>({ quantidade: 0, preco: 0 });
  const [fb, setFb] = useState<FreightBreak>({ quantidade: 0, frete: 0 });

  const addPB = () => {
    onChange({
      ...contract,
      priceBreaks: [...(contract.priceBreaks ?? []), pb],
    });
    setPb({ quantidade: 0, preco: 0 });
  };

  const removePB = (index: number) => {
    const priceBreaks = (contract.priceBreaks ?? []).filter((_, i) => i !== index);
    onChange({ ...contract, priceBreaks });
  };

  const addFB = () => {
    onChange({
      ...contract,
      freightBreaks: [...(contract.freightBreaks ?? []), fb],
    });
    setFb({ quantidade: 0, frete: 0 });
  };

  const removeFB = (index: number) => {
    const freightBreaks = (contract.freightBreaks ?? []).filter((_, i) => i !== index);
    onChange({ ...contract, freightBreaks });
  };

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {contract.fornecedorId} - {contract.produtoId}
        </CardTitle>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          Remover
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-semibold mb-2">Degraus de Preço</div>
          {(contract.priceBreaks ?? []).map((b, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span>
                {b.quantidade} @ {b.preco}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePB(idx)}
              >
                x
              </Button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              placeholder="Qtd"
              value={pb.quantidade}
              onChange={(e) =>
                setPb({ ...pb, quantidade: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              placeholder="Preço"
              value={pb.preco}
              onChange={(e) => setPb({ ...pb, preco: Number(e.target.value) })}
            />
            <Button type="button" onClick={addPB}>
              Adicionar
            </Button>
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Frete por Faixa</div>
          {(contract.freightBreaks ?? []).map((b, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span>
                {b.quantidade} @ {b.frete}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFB(idx)}
              >
                x
              </Button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              placeholder="Qtd"
              value={fb.quantidade}
              onChange={(e) =>
                setFb({ ...fb, quantidade: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              placeholder="Frete"
              value={fb.frete}
              onChange={(e) => setFb({ ...fb, frete: Number(e.target.value) })}
            />
            <Button type="button" onClick={addFB}>
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FornecedoresContratos() {
  const [contracts, setContracts] = useState<ContractFornecedor[]>([]);
  const [form, setForm] = useState<ContractFornecedor>({
    fornecedorId: "",
    produtoId: "",
    unidade: "un",
    precoBase: 0,
    priceBreaks: [],
    freightBreaks: [],
  });

  const addContract = () => {
    setContracts([...contracts, form]);
    setForm({
      fornecedorId: "",
      produtoId: "",
      unidade: "un",
      precoBase: 0,
      priceBreaks: [],
      freightBreaks: [],
    });
  };

  const updateContract = (index: number, c: ContractFornecedor) => {
    const next = [...contracts];
    next[index] = c;
    setContracts(next);
  };

  const removeContract = (index: number) => {
    setContracts(contracts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-3xl font-bold tracking-tight">
        Contratos de Fornecedores
      </h2>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Fornecedor ID"
          value={form.fornecedorId}
          onChange={(e) =>
            setForm({ ...form, fornecedorId: e.target.value })
          }
        />
        <Input
          placeholder="Produto ID"
          value={form.produtoId}
          onChange={(e) => setForm({ ...form, produtoId: e.target.value })}
        />
        <Input
          placeholder="Unidade"
          value={form.unidade}
          onChange={(e) =>
            setForm({ ...form, unidade: e.target.value as any })
          }
        />
        <Input
          type="number"
          placeholder="Preço Base"
          value={form.precoBase}
          onChange={(e) =>
            setForm({ ...form, precoBase: Number(e.target.value) })
          }
        />
        <Button type="button" onClick={addContract}>
          Adicionar
        </Button>
      </div>
      <div className="space-y-4">
        {contracts.map((c, idx) => (
          <ContractCard
            key={idx}
            contract={c}
            onChange={(nc) => updateContract(idx, nc)}
            onRemove={() => removeContract(idx)}
          />
        ))}
      </div>
    </div>
  );
}

