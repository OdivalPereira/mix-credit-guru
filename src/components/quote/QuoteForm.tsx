import { memo, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronsUpDown, Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ESTADOS, getMunicipiosByUF } from "@/data/locations";
import { DESTINO_OPTIONS, REGIME_OPTIONS } from "@/data/lookups";
import { cn } from "@/lib/utils";
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
  const [isMunicipioOpen, setIsMunicipioOpen] = useState(false);
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
  const municipios = useMemo(
    () => getMunicipiosByUF(contexto.uf?.toUpperCase() ?? ""),
    [contexto.uf],
  );
  const municipioValue = form.watch("municipio");

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
  const selectedMunicipio = useMemo(
    () => municipios.find((item) => item.codigo === municipioValue),
    [municipios, municipioValue],
  );

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
                      form.setValue("municipio", "");
                      handleFieldChange("municipio", "");
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
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado.sigla} value={estado.sigla}>
                          {estado.sigla} - {estado.nome}
                        </SelectItem>
                      ))}
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
                <FormItem className="sm:max-w-[320px]">
                  <FormLabel htmlFor="municipio">Municipio</FormLabel>
                  <FormControl>
                    <Popover open={isMunicipioOpen} onOpenChange={setIsMunicipioOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          ref={field.ref}
                          id="municipio"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                          aria-expanded={isMunicipioOpen}
                          disabled={!contexto.uf}
                        >
                          {selectedMunicipio ? selectedMunicipio.nome : "Selecione o municipio"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-[--radix-popover-trigger-width] p-0"
                      >
                        <Command>
                          <CommandInput placeholder="Pesquisar municipio..." />
                          <CommandEmpty>Nenhum municipio encontrado.</CommandEmpty>
                          <CommandList className="max-h-72">
                            <CommandGroup>
                              {municipios.map((municipio) => (
                                <CommandItem
                                  key={municipio.codigo}
                                  value={`${municipio.codigo} ${municipio.nome}`}
                                  onSelect={() => {
                                    field.onChange(municipio.codigo);
                                    handleFieldChange("municipio", municipio.codigo);
                                    setIsMunicipioOpen(false);
                                    field.onBlur();
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      municipio.codigo === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {municipio.nome}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
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
                      {DESTINO_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          textValue={`${option.value} - ${option.label}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            {option.description ? (
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
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
                      {REGIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
