"use server";

import { z } from "zod";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";
import { requireActionUser } from "@/lib/session";
import { createClaimSchema, messageSchema } from "@/lib/validation/claim";
import { createClaim, postMessage, saveAttachments, transitionClaim } from "@/server/claims";
import { revalidateClaim } from "@/server/revalidate";

function filesFrom(formData: FormData, field = "files"): File[] {
  return formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
}

/** Cliente abre sinistro: payload JSON + fotos. */
export async function createClaimAction(formData: FormData): Promise<ActionResult<{ id: string; protocol: string }>> {
  try {
    const user = await requireActionUser("CLIENTE");
    const payload: unknown = JSON.parse(String(formData.get("payload") ?? "{}"));
    const input = createClaimSchema.parse(payload);
    const claim = await createClaim(user, input, filesFrom(formData));
    revalidateClaim(claim.id);
    return ok(claim, `Sinistro ${claim.protocol} aberto.`);
  } catch (e) {
    return toActionError(e);
  }
}

export async function postMessageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    const input = messageSchema.parse(Object.fromEntries(formData));
    await postMessage(user, input.claimId, input.message);
    revalidateClaim(input.claimId);
    return ok(undefined, "Mensagem enviada.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function uploadAttachmentsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireActionUser();
    const claimId = z.string().min(1).parse(formData.get("claimId"));
    const files = filesFrom(formData);
    if (!files.length) return { ok: false, error: "Selecione ao menos um arquivo." };
    const n = await saveAttachments(user, claimId, files);
    revalidateClaim(claimId);
    return ok(undefined, `${n} anexo(s) enviado(s).`);
  } catch (e) {
    return toActionError(e);
  }
}

/** Cliente confirma a retirada do veículo (PRONTO_PARA_RETIRADA → CONCLUIDO). */
export async function confirmPickupAction(claimId: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("CLIENTE");
    await transitionClaim(user, z.string().min(1).parse(claimId), {
      to: "CONCLUIDO",
      message: "Retirada do veículo confirmada pelo segurado.",
    });
    revalidateClaim(claimId);
    return ok(undefined, "Retirada confirmada. Sinistro concluído.");
  } catch (e) {
    return toActionError(e);
  }
}
