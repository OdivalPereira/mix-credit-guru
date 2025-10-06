import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Contexto } from "@/store/useCotacaoStore";
import { useEffect } from "react";

const quoteFormSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  uf: z.string().min(1, "UF é obrigatória"),
  destino: z.string().min(1, "Destino é obrigatório"),
  regime: z.string().min(1, "Regime é obrigatório"),
  produto: z.string().min(1, "Produto é obrigatório").max(100, "Produto deve ter no máximo 100 caracteres"),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  contexto: Contexto;
  onContextoChange: (key: keyof Contexto, value: string) => void;
}

export function QuoteForm({ contexto, onContextoChange }: QuoteFormProps) {
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      data: contexto.data || "",
      uf: contexto.uf || "",
      destino: contexto.destino || "",
      regime: contexto.regime || "",
      produto: contexto.produto || "",
    },
  });

  // Sync form with external contexto changes
  useEffect(() => {
    form.reset({
      data: contexto.data || "",
      uf: contexto.uf || "",
      destino: contexto.destino || "",
      regime: contexto.regime || "",
      produto: contexto.produto || "",
    });
  }, [contexto, form]);

  const handleFieldChange = (field: keyof Contexto, value: string) => {
    onContextoChange(field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parâmetros da Cotação</CardTitle>
        <CardDescription>
          Configure os dados para análise comparativa dos fornecedores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("data", e.target.value);
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
                  <FormLabel>UF</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("uf", value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="UF" data-testid="select-uf">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sp">SP - São Paulo</SelectItem>
                      <SelectItem value="rj">RJ - Rio de Janeiro</SelectItem>
                      <SelectItem value="mg">MG - Minas Gerais</SelectItem>
                      <SelectItem value="pr">PR - Paraná</SelectItem>
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
                <FormItem>
                  <FormLabel>Destino</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("destino", value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Destino" data-testid="select-destino">
                        <SelectValue placeholder="Finalidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A - Refeição</SelectItem>
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
                  <FormLabel>Seu Regime</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange("regime", value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Regime" data-testid="select-regime">
                        <SelectValue placeholder="Regime tributário" />
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
                  <FormLabel>Produto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NCM ou descrição"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("produto", e.target.value);
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
}
