import { z } from "zod";

// Validation schema for Supplier
export const supplierSchema = z.object({
  nome: z.string()
    .trim()
    .min(1, { message: "Nome do fornecedor é obrigatório" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  
  cnpj: z.string()
    .trim()
    .regex(/^\d{14}$|^$/, { message: "CNPJ deve ter 14 dígitos ou estar vazio" })
    .optional(),
  
  preco: z.number()
    .min(0, { message: "Preço deve ser maior ou igual a zero" })
    .max(999999, { message: "Preço muito alto" }),
  
  ibs: z.number()
    .min(0, { message: "IBS deve ser maior ou igual a zero" })
    .max(100, { message: "IBS deve ser menor que 100%" }),
  
  cbs: z.number()
    .min(0, { message: "CBS deve ser maior ou igual a zero" })
    .max(100, { message: "CBS deve ser menor que 100%" }),
  
  is: z.number()
    .min(0, { message: "IS deve ser maior ou igual a zero" })
    .max(100, { message: "IS deve ser menor que 100%" }),
  
  frete: z.number()
    .min(0, { message: "Frete deve ser maior ou igual a zero" })
    .max(999999, { message: "Frete muito alto" }),
  
  pedidoMinimo: z.number()
    .min(0, { message: "Pedido mínimo deve ser maior ou igual a zero" })
    .optional(),
  
  prazoEntregaDias: z.number()
    .min(0, { message: "Prazo de entrega deve ser maior ou igual a zero" })
    .max(365, { message: "Prazo de entrega deve ser menor que 365 dias" })
    .optional(),
  
  prazoPagamentoDias: z.number()
    .min(0, { message: "Prazo de pagamento deve ser maior ou igual a zero" })
    .max(365, { message: "Prazo de pagamento deve ser menor que 365 dias" })
    .optional(),
});

// Validation schema for Contexto
export const contextoSchema = z.object({
  uf: z.string()
    .length(2, { message: "UF deve ter 2 caracteres" })
    .regex(/^[A-Z]{2}$/, { message: "UF inválida" }),
  
  regime: z.enum(["normal", "simples"], { 
    errorMap: () => ({ message: "Regime deve ser 'normal' ou 'simples'" })
  }),
  
  destino: z.enum(["A", "B", "C"], {
    errorMap: () => ({ message: "Destino deve ser 'A', 'B' ou 'C'" })
  }),
  
  data: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data deve estar no formato YYYY-MM-DD" })
    .optional(),
  
  produto: z.string()
    .max(200, { message: "Nome do produto muito longo" })
    .optional(),
});

// Validation helper to check for essential data
export function validateEssentialData(options: {
  hasProdutos: boolean;
  hasFornecedores: boolean;
  hasContratos: boolean;
  contextoUf?: string;
  contextoRegime?: string;
}): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!options.hasProdutos) {
    warnings.push("Nenhum produto cadastrado no catálogo");
  }
  
  if (!options.hasFornecedores) {
    warnings.push("Nenhum fornecedor cadastrado para cotação");
  }
  
  if (!options.hasContratos) {
    warnings.push("Nenhum contrato cadastrado - preços podem estar desatualizados");
  }
  
  if (!options.contextoUf) {
    warnings.push("UF não configurada no contexto da cotação");
  }
  
  if (!options.contextoRegime) {
    warnings.push("Regime tributário não configurado no contexto");
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// Validation for NCM
export function validateNCM(ncm: string): { isValid: boolean; message?: string } {
  if (!ncm) {
    return { isValid: false, message: "NCM é obrigatório" };
  }
  
  const ncmClean = ncm.replace(/\D/g, "");
  
  if (ncmClean.length !== 8) {
    return { isValid: false, message: "NCM deve ter 8 dígitos" };
  }
  
  return { isValid: true };
}
