import type { Coverage, RepairAction, Severity } from "@prisma/client";

type Priced = { partPrice: number; laborPrice: number };
type Covered = Priced & { coverage: Coverage };

export function itemTotal(i: Priced): number {
  return i.partPrice + i.laborPrice;
}

export function quoteTotals(items: readonly Priced[]) {
  const partsTotal = items.reduce((s, i) => s + i.partPrice, 0);
  const laborTotal = items.reduce((s, i) => s + i.laborPrice, 0);
  return { partsTotal, laborTotal, total: partsTotal + laborTotal };
}

/** Ação sugerida ao adicionar uma peça danificada ao orçamento. */
export function suggestedAction(severity: Severity | undefined): RepairAction {
  if (severity === "GRAVE") return "TROCAR";
  if (severity === "LEVE") return "PINTAR";
  return "REPARAR";
}

export type FinancialSummary = {
  /** Soma de todos os itens do orçamento */
  quoteTotal: number;
  /** Itens marcados como cobertos */
  coveredTotal: number;
  /** Itens marcados como não cobertos (segurado paga integralmente) */
  notCoveredTotal: number;
  /** Itens ainda sem decisão */
  pendingTotal: number;
  /** Franquia da apólice */
  deductible: number;
  /** Franquia efetivamente cobrada (nunca maior que o total coberto) */
  deductibleApplied: number;
  /** Valor pago pela seguradora à oficina */
  insurerPays: number;
  /** Valor pago pelo segurado: franquia aplicada + itens não cobertos */
  clientPays: number;
};

/** Resumo financeiro do sinistro. Valores em centavos. */
export function financialSummary(items: readonly Covered[], deductible: number): FinancialSummary {
  const sumBy = (c: Coverage) => items.filter((i) => i.coverage === c).reduce((s, i) => s + itemTotal(i), 0);
  const coveredTotal = sumBy("COBERTO");
  const notCoveredTotal = sumBy("NAO_COBERTO");
  const pendingTotal = sumBy("PENDENTE");
  const deductibleApplied = Math.min(Math.max(deductible, 0), coveredTotal);
  return {
    quoteTotal: coveredTotal + notCoveredTotal + pendingTotal,
    coveredTotal,
    notCoveredTotal,
    pendingTotal,
    deductible,
    deductibleApplied,
    insurerPays: coveredTotal - deductibleApplied,
    clientPays: deductibleApplied + notCoveredTotal,
  };
}
