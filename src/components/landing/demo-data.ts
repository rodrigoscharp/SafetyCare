import type { QuoteItemLike } from "@/domain/part-status";

/** Orçamento fictício usado na vitrine do site. */
export const DEMO_ITEMS: QuoteItemLike[] = [
  { partKey: "parachoque_dianteiro", action: "TROCAR", partPrice: 140_000, laborPrice: 30_000, coverage: "COBERTO" },
  { partKey: "capo", action: "REPARAR", partPrice: 0, laborPrice: 55_000, coverage: "COBERTO" },
  { partKey: "farol_esq", action: "TROCAR", partPrice: 115_000, laborPrice: 10_000, coverage: "COBERTO" },
  {
    partKey: "paralama_dianteiro_esq",
    action: "PINTAR",
    partPrice: 0,
    laborPrice: 40_000,
    coverage: "NAO_COBERTO",
    insurerNote: "Riscos anteriores ao acidente",
  },
];

export const DEMO_DEDUCTIBLE = 250_000;
