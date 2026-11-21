"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";
import { requireActionUser } from "@/lib/session";
import { vehicleSchema } from "@/lib/validation/claim";
import { deleteVehicle, saveVehicle } from "@/server/vehicles";

export async function saveVehicleAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireActionUser("CLIENTE");
    const raw = Object.fromEntries(formData);
    const input = vehicleSchema.parse({ ...raw, id: raw.id || undefined });
    await saveVehicle(user, input);
    revalidatePath("/app/veiculos");
    return ok(undefined, input.id ? "Veículo atualizado." : "Veículo cadastrado.");
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireActionUser("CLIENTE");
    await deleteVehicle(user, z.string().min(1).parse(id));
    revalidatePath("/app/veiculos");
    return ok(undefined, "Veículo excluído.");
  } catch (e) {
    return toActionError(e);
  }
}
