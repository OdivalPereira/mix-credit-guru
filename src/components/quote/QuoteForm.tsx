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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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
                <FormItem>
                  <FormLabel htmlFor="municipio">Municipio (IBGE)</FormLabel>
                  <FormControl>
                    <Input
                      id="municipio"
                      placeholder="Codigo IBGE"
                      name={field.name}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        handleFieldChange("municipio", event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destino"
              render={({ field }) => (
                <FormItem>
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
                      <SelectItem value="A">A - Refeicao</SelectItem>
                      <SelectItem value="B">B - Revenda</SelectItem>
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
                <FormItem>
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
