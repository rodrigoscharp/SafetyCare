import "server-only";
import type { Prisma } from "@prisma/client";
import { DomainError } from "@/domain/errors";
import { isValidPartFor, partLabel } from "@/domain/parts";
import { canEditQuote, canReviewQuote, type Actor } from "@/domain/permissions";
import { financialSummary, quoteTotals } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { CoverageReviewInput, QuoteInput } from "@/lib/validation/quote";
import { applyTransition } from "./claims";

type Tx = Prisma.TransactionClient;

async function loadClaim(tx: Tx, claimId: string) {
  const claim = await tx.claim.findUnique({
    where: { id: claimId },
    include: {
      policy: { include: { vehicle: { select: { type: true } } } },
      damages: true,
      quotes: { orderBy: { version: "desc" }, take: 1, include: { items: true } },
    },
  });
  if (!claim) throw new DomainError("Sinistro não encontrado.");
  return claim;
}

/**
 * Salva o rascunho do orçamento (cria nova versão se a última já foi enviada).
 * Peças orçadas que não foram declaradas pelo cliente viram dano de origem OFICINA.
 */
async function saveDraftTx(tx: Tx, actor: Actor, input: QuoteInput) {
  const claim = await loadClaim(tx, input.claimId);
  if (!canEditQuote(actor, claim)) throw new DomainError("Orçamento não pode ser editado neste momento.");

  for (const item of input.items) {
    if (!isValidPartFor(item.partKey, claim.policy.vehicle.type)) throw new DomainError(`Peça inválida: ${item.partKey}`);
  }

  const last = claim.quotes[0];
  const totals = quoteTotals(input.items);
  const quote =
    last && last.status === "RASCUNHO"
      ? await tx.quote.update({
          where: { id: last.id },
          data: { partsTotal: totals.partsTotal, laborTotal: totals.laborTotal, estimatedDays: input.estimatedDays },
        })
      : await tx.quote.create({
          data: {
            claimId: claim.id,
            workshopId: actor.id,
            version: (last?.version ?? 0) + 1,
            status: "RASCUNHO",
            partsTotal: totals.partsTotal,
            laborTotal: totals.laborTotal,
            estimatedDays: input.estimatedDays,
          },
        });

  await tx.quoteItem.deleteMany({ where: { quoteId: quote.id } });
  if (input.items.length) {
    await tx.quoteItem.createMany({
      data: input.items.map((i) => ({ ...i, quoteId: quote.id, coverage: "PENDENTE" as const })),
    });
  }

  const declared = new Set(claim.damages.map((d) => d.partKey));
  const discovered = input.items.filter((i) => !declared.has(i.partKey));
  for (const i of discovered) {
    await tx.claimDamage.upsert({
      where: { claimId_partKey_source: { claimId: claim.id, partKey: i.partKey, source: "OFICINA" } },
      create: { claimId: claim.id, partKey: i.partKey, severity: "MEDIO", note: "Identificado pela oficina", source: "OFICINA" },
      update: {},
    });
  }
  // remove danos da oficina que saíram do orçamento
  await tx.claimDamage.deleteMany({
    where: { claimId: claim.id, source: "OFICINA", partKey: { notIn: input.items.map((i) => i.partKey) } },
  });

  return { quote, totals, claim };
}

export async function saveQuoteDraft(actor: Actor, input: QuoteInput) {
  return prisma.$transaction(async (tx) => (await saveDraftTx(tx, actor, input)).quote);
}

export async function submitQuote(actor: Actor, input: QuoteInput) {
  return prisma.$transaction(async (tx) => {
    const { quote, totals } = await saveDraftTx(tx, actor, input);
    await applyTransition(tx, actor, input.claimId, {
      to: "ORCAMENTO_ENVIADO",
      context: { quoteItemCount: input.items.length },
      message: `Orçamento v${quote.version} enviado: ${input.items.length} item(ns), total ${formatBRL(totals.total)}, prazo de ${input.estimatedDays} dia(s).`,
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "ENVIADO" } });
    return quote;
  });
}

/** Seguradora grava a decisão de cobertura item a item (sem mudar status). */
async function applyCoverageTx(tx: Tx, actor: Actor, input: CoverageReviewInput) {
  const claim = await loadClaim(tx, input.claimId);
  if (!canReviewQuote(actor, claim)) throw new DomainError("Não há orçamento aguardando revisão.");
  const quote = claim.quotes[0];
  if (!quote || quote.status !== "ENVIADO") throw new DomainError("Orçamento não encontrado.");

  const ids = new Set(quote.items.map((i) => i.id));
  for (const d of input.decisions) {
    if (!ids.has(d.itemId)) throw new DomainError("Item de orçamento inválido.");
    await tx.quoteItem.update({
      where: { id: d.itemId },
      data: { coverage: d.coverage, insurerNote: d.insurerNote?.trim() || null },
    });
  }
  const items = await tx.quoteItem.findMany({ where: { quoteId: quote.id } });
  return { claim, quote, items };
}

export async function saveCoverage(actor: Actor, input: CoverageReviewInput) {
  return prisma.$transaction((tx) => applyCoverageTx(tx, actor, input));
}

export async function approveQuote(actor: Actor, input: CoverageReviewInput) {
  return prisma.$transaction(async (tx) => {
    const { claim, quote, items } = await applyCoverageTx(tx, actor, input);
    const pending = items.filter((i) => i.coverage === "PENDENTE").length;
    const covered = items.filter((i) => i.coverage === "COBERTO");
    const notCovered = items.filter((i) => i.coverage === "NAO_COBERTO");
    const s = financialSummary(items, claim.policy.deductible);

    await applyTransition(tx, actor, claim.id, {
      to: "ORCAMENTO_APROVADO",
      context: { pendingCoverageItems: pending },
      message:
        notCovered.length === 0
          ? `Orçamento v${quote.version} aprovado integralmente.`
          : `Orçamento v${quote.version} aprovado parcialmente.`,
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "APROVADO" } });
    await tx.claimEvent.create({
      data: {
        claimId: claim.id,
        actorId: actor.id,
        type: "COBERTURA",
        message:
          `${covered.length} item(ns) coberto(s), ${notCovered.length} não coberto(s)` +
          (notCovered.length ? ` (${notCovered.map((i) => partLabel(i.partKey)).join(", ")})` : "") +
          `. Segurado paga ${formatBRL(s.clientPays)} (franquia ${formatBRL(s.deductibleApplied)} + não cobertos ${formatBRL(s.notCoveredTotal)}).`,
      },
    });
  });
}

export async function requestAdjustment(actor: Actor, input: CoverageReviewInput, reason: string) {
  return prisma.$transaction(async (tx) => {
    const { claim, quote } = await applyCoverageTx(tx, actor, input);
    await applyTransition(tx, actor, claim.id, {
      to: "AJUSTE_SOLICITADO",
      context: { reason },
      message: `Ajuste solicitado no orçamento v${quote.version}: ${reason}`,
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "AJUSTE_SOLICITADO" } });
  });
}

export async function rejectQuote(actor: Actor, claimId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const claim = await loadClaim(tx, claimId);
    await applyTransition(tx, actor, claimId, { to: "NEGADO", context: { reason }, message: `Negado: ${reason}` });
    const quote = claim.quotes[0];
    if (quote) await tx.quote.update({ where: { id: quote.id }, data: { status: "RECUSADO" } });
  });
}
