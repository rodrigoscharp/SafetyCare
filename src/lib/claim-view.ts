import type { DamageLike, QuoteItemLike } from "@/domain/part-status";
import type { ClaimDetail } from "@/server/claims";

/** Danos serializáveis para o 3D. */
export function viewerDamages(claim: ClaimDetail): DamageLike[] {
  return claim.damages.map((d) => ({ partKey: d.partKey, severity: d.severity, note: d.note }));
}

/** Itens do orçamento mais recente (opcionalmente ignorando rascunhos). */
export function latestQuote(claim: ClaimDetail, opts: { includeDraft?: boolean } = {}) {
  return claim.quotes.find((q) => opts.includeDraft || q.status !== "RASCUNHO") ?? null;
}

export function viewerItems(quote: ClaimDetail["quotes"][number] | null): QuoteItemLike[] {
  return (quote?.items ?? []).map((i) => ({
    partKey: i.partKey,
    action: i.action,
    partPrice: i.partPrice,
    laborPrice: i.laborPrice,
    coverage: i.coverage,
    insurerNote: i.insurerNote,
  }));
}
