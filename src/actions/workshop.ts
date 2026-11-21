"use server";

import { z } from "zod";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";
import { requireActionUser } from "@/lib/session";
import { quoteInputSchema } from "@/lib/validation/quote";
import { transitionClaim } from "@/server/claims";
import { saveQuoteDraft, submitQuote } from "@/server/quotes";
import { revalidateClaim } from "@/server/revalidate";

const id = z.string().min(1).max(64);

export async function receiveVehicleAction(claimId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("OFICINA");
    await transitionClaim(user, id.parse(claimId), { to: "AGUARDANDO_ORCAMENTO", message: "Veículo recebido na oficina." });
    revalidateClaim(claimId);
    return ok(undefined, "Recebimento confirmado. Monte o orçamento.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function saveQuoteDraftAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireActionUser("OFICINA");
    const data = quoteInputSchema.parse(input);
    await saveQuoteDraft(user, data);
    revalidateClaim(data.claimId);
    return ok(undefined, "Rascunho salvo.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function submitQuoteAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireActionUser("OFICINA");
    const data = quoteInputSchema.parse(input);
    await submitQuote(user, data);
    revalidateClaim(data.claimId);
    return ok(undefined, "Orçamento enviado para a seguradora.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function startRepairAction(claimId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("OFICINA");
    await transitionClaim(user, id.parse(claimId), { to: "EM_REPARO", message: "Reparo iniciado." });
    revalidateClaim(claimId);
    return ok(undefined, "Reparo iniciado.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function readyForPickupAction(claimId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("OFICINA");
    await transitionClaim(user, id.parse(claimId), { to: "PRONTO_PARA_RETIRADA", message: "Veículo pronto para retirada." });
    revalidateClaim(claimId);
    return ok(undefined, "Segurado avisado: veículo pronto para retirada.");
  } catch (e) {
    return toActionError(e);
  }
}
