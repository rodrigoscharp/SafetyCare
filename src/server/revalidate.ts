import "server-only";
import { revalidatePath } from "next/cache";

/** Revalida todas as visões de um sinistro (cliente, oficina, seguradora). */
export function revalidateClaim(claimId: string) {
  for (const base of ["/app", "/oficina", "/seguradora"]) {
    revalidatePath(base);
    revalidatePath(`${base}/sinistros/${claimId}`);
  }
}
