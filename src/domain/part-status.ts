import type { Coverage, RepairAction, Severity } from "@prisma/client";

export type DamageLike = { partKey: string; severity: Severity; note?: string | null };
export type QuoteItemLike = {
  partKey: string;
  action: RepairAction;
  partPrice: number;
  laborPrice: number;
  coverage: Coverage;
  insurerNote?: string | null;
};

/** Estado visual de uma peça no 3D e na lista. */
export type PartVisual = "INTACTA" | "DANO" | "TROCAR" | "REPARAR" | "PINTAR" | "NAO_COBERTO";

export function partVisual(partKey: string, damages: readonly DamageLike[], items: readonly QuoteItemLike[]): PartVisual {
  const item = items.find((i) => i.partKey === partKey);
  if (item) return item.coverage === "NAO_COBERTO" ? "NAO_COBERTO" : item.action;
  if (damages.some((d) => d.partKey === partKey)) return "DANO";
  return "INTACTA";
}

export const PART_VISUAL_LABEL: Record<PartVisual, string> = {
  INTACTA: "Intacta",
  DANO: "Dano declarado",
  TROCAR: "Trocar",
  REPARAR: "Reparar",
  PINTAR: "Pintar",
  NAO_COBERTO: "Não coberto",
};
