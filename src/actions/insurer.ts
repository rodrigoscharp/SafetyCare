"use server";

import { z } from "zod";
import { DomainError } from "@/domain/errors";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";
import { requireActionUser } from "@/lib/session";
import { transitionClaim } from "@/server/claims";
import { revalidateClaim } from "@/server/revalidate";
import { isWorkshop } from "@/server/users";
import { coverageReviewSchema } from "@/lib/validation/quote";
import { approveQuote, rejectQuote, requestAdjustment, saveCoverage } from "@/server/quotes";

const id = z.string().min(1).max(64);
const reason = z.string().trim().min(5, "Descreva o motivo (mín. 5 caracteres)").max(1000);

export async function assumeClaimAction(claimId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    await transitionClaim(user, id.parse(claimId), {
      to: "EM_ANALISE",
      message: `Sinistro assumido para análise por ${user.name}.`,
      data: { adjusterId: user.id },
    });
    revalidateClaim(claimId);
    return ok(undefined, "Sinistro em análise.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function denyClaimAction(claimId: string, text: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    const r = reason.parse(text);
    await transitionClaim(user, id.parse(claimId), { to: "NEGADO", message: `Negado: ${r}`, context: { reason: r } });
    revalidateClaim(claimId);
    return ok(undefined, "Sinistro negado.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function forwardClaimAction(claimId: string, workshopId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    const wid = id.parse(workshopId);
    if (!(await isWorkshop(wid))) throw new DomainError("Oficina inválida.");
    await transitionClaim(user, id.parse(claimId), {
      to: "ENCAMINHADO_OFICINA",
      message: "Sinistro encaminhado à oficina. Aguardando recebimento do veículo.",
      context: { workshopId: wid },
      data: { workshopId: wid, adjusterId: user.id },
    });
    revalidateClaim(claimId);
    return ok(undefined, "Sinistro encaminhado à oficina.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function totalLossAction(claimId: string, text: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    const r = reason.parse(text);
    await transitionClaim(user, id.parse(claimId), { to: "INDENIZACAO_INTEGRAL", message: `Indenização integral: ${r}` });
    revalidateClaim(claimId);
    return ok(undefined, "Indenização integral registrada.");
  } catch (e) {
    return toActionError(e);
  }
}

// ── Revisão de orçamento ───────────────────────────────────────────────

export async function saveCoverageAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    const data = coverageReviewSchema.parse(input);
    await saveCoverage(user, data);
    revalidateClaim(data.claimId);
    return ok(undefined, "Decisões salvas.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function approveQuoteAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    const data = coverageReviewSchema.parse(input);
    await approveQuote(user, data);
    revalidateClaim(data.claimId);
    return ok(undefined, "Orçamento aprovado.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function requestAdjustmentAction(input: unknown, text: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    const data = coverageReviewSchema.parse(input);
    await requestAdjustment(user, data, reason.parse(text));
    revalidateClaim(data.claimId);
    return ok(undefined, "Ajuste solicitado à oficina.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function rejectQuoteAction(claimId: string, text: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("SEGURADORA");
    await rejectQuote(user, id.parse(claimId), reason.parse(text));
    revalidateClaim(claimId);
    return ok(undefined, "Sinistro negado.");
  } catch (e) {
    return toActionError(e);
  }
}
