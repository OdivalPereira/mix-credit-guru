import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Contexto } from "@/store/useCotacaoStore";

const quoteFormSchema = z.object({
  data: z.string().min(1, "Data obrigatoria"),
  uf: z.string().min(1, "UF obrigatoria"),
  municipio: z.string().optional(),
  destino: z.string().min(1, "Destino obrigatorio"),
  regime: z.string().min(1, "Regime obrigatorio"),
  produto: z
    .string()
    .min(1, "Produto obrigatorio")
    .max(100, "Produto deve ter no maximo 100 caracteres"),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  contexto: Contexto;
  onContextoChange: (key: keyof Contexto, value: string) => void;
}

const QuoteFormComponent = ({ contexto, onContextoChange }: QuoteFormProps) => {
  const form = useForm<QuoteFormValues>({
    mode: "onBlur",
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      data: contexto.data || "",
      uf: contexto.uf?.toUpperCase() || "",
      municipio: contexto.municipio || "",
      destino: contexto.destino || "",
      regime: contexto.regime || "",
      produto: contexto.produto || "",
    },
  });

  useEffect(() => {
    form.reset({
      data: contexto.data || "",
      uf: contexto.uf?.toUpperCase() || "",
      municipio: contexto.municipio || "",
      destino: contexto.destino || "",
      regime: contexto.regime || "",
      produto: contexto.produto || "",
    });
  }, [contexto, form]);

  const handleFieldChange = (field: keyof Contexto, value: string) => {
    const nextValue = field === "uf" ? value.toUpperCase() : value;
    onContextoChange(field, nextValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parametros da cotacao</CardTitle>
        <CardDescription>
          Configure os dados para analisar fornecedores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="sm:max-w-[200px]">
                  <FormLabel htmlFor="data">Data</FormLabel>
                  <FormControl>
                    <Input
                      id="data"
                      type="date"
                      name={field.name}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        handleFieldChange("data", event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem className="sm:max-w-[160px]">
                  <FormLabel htmlFor="estado">Estado</FormLabel>
                  <Select
                    value={field.value?.toUpperCase()}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("uf", value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger
                        id="estado"
                        aria-label="Estado"
                        data-testid="select-uf"
                      >
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SP">SP - Sao Paulo</SelectItem>
                      <SelectItem value="RJ">RJ - Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">MG - Minas Gerais</SelectItem>
                      <SelectItem value="PR">PR - Parana</SelectItem>
                      <SelectItem value="RS">RS - Rio Grande do Sul</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="municipio"
              render={({ field }) => (
                <FormItem className="sm:max-w-[260px]">
                  <FormLabel htmlFor="municipio">Municipio</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("municipio", value);
                    }}
                    disabled={!contexto.uf}
                  >
                    <FormControl>
                      <SelectTrigger
                        id="municipio"
                        aria-label="Municipio"
                      >
                        <SelectValue placeholder="Selecione o municipio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contexto.uf === "SP" && (
                        <>
                          <SelectItem value="3550308">Sao Paulo</SelectItem>
                          <SelectItem value="3509502">Campinas</SelectItem>
                          <SelectItem value="3543402">Ribeirao Preto</SelectItem>
                          <SelectItem value="3552205">Sorocaba</SelectItem>
                        </>
                      )}
                      {contexto.uf === "RJ" && (
                        <>
                          <SelectItem value="3304557">Rio de Janeiro</SelectItem>
                          <SelectItem value="3303302">Niteroi</SelectItem>
                          <SelectItem value="3301702">Duque de Caxias</SelectItem>
                        </>
                      )}
                      {contexto.uf === "MG" && (
                        <>
                          <SelectItem value="3106200">Belo Horizonte</SelectItem>
                          <SelectItem value="3170206">Uberlandia</SelectItem>
                          <SelectItem value="3118601">Contagem</SelectItem>
                        </>
                      )}
                      {contexto.uf === "PR" && (
                        <>
                          <SelectItem value="4106902">Curitiba</SelectItem>
                          <SelectItem value="4115200">Londrina</SelectItem>
                          <SelectItem value="4125506">Maringa</SelectItem>
                        </>
                      )}
                      {contexto.uf === "RS" && (
                        <>
                          <SelectItem value="4314902">Porto Alegre</SelectItem>
                          <SelectItem value="4304606">Caxias do Sul</SelectItem>
                          <SelectItem value="4313409">Pelotas</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destino"
              render={({ field }) => (
                <FormItem className="sm:max-w-[220px]">
                  <FormLabel htmlFor="destinacao">Destinacao</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("destino", value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger
                        id="destinacao"
                        aria-label="Destino"
                        data-testid="select-destino"
                      >
                        <SelectValue placeholder="Finalidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="consumo">Uso e consumo</SelectItem>
                      <SelectItem value="revenda">Revenda</SelectItem>
                      <SelectItem value="imobilizado">Imobilizado</SelectItem>
                      <SelectItem value="producao">Producao</SelectItem>
                      <SelectItem value="comercializacao">Comercializacao</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regime"
              render={({ field }) => (
                <FormItem className="sm:max-w-[240px]">
                  <FormLabel htmlFor="regime">Regime tributario</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("regime", value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger
                        id="regime"
                        aria-label="Regime"
                        data-testid="select-regime"
                      >
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Regime Normal</SelectItem>
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                      <SelectItem value="presumido">Lucro Presumido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="produto">Produto</FormLabel>
                  <FormControl>
                    <Input
                      id="produto"
                      placeholder="NCM ou descricao"
                      name={field.name}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        handleFieldChange("produto", event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export const QuoteForm = memo(QuoteFormComponent);
