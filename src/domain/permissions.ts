import type { ClaimStatus, Prisma, Role } from "@prisma/client";
import { DomainError } from "./errors";

export type Actor = { id: string; role: Role };
export type ClaimAccess = { clientId: string; workshopId: string | null; status: ClaimStatus };

/** Filtro Prisma com os sinistros visíveis para o usuário. Use em TODA listagem/consulta. */
export function claimScope(actor: Actor): Prisma.ClaimWhereInput {
  switch (actor.role) {
    case "CLIENTE":
      return { clientId: actor.id };
    case "OFICINA":
      return { workshopId: actor.id };
    case "SEGURADORA":
      return {};
  }
}

export function canViewClaim(actor: Actor, claim: Pick<ClaimAccess, "clientId" | "workshopId">): boolean {
  switch (actor.role) {
    case "CLIENTE":
      return claim.clientId === actor.id;
    case "OFICINA":
      return claim.workshopId !== null && claim.workshopId === actor.id;
    case "SEGURADORA":
      return true;
  }
}

export function assertCanViewClaim(actor: Actor, claim: Pick<ClaimAccess, "clientId" | "workshopId">): void {
  if (!canViewClaim(actor, claim)) throw new DomainError("Sinistro não encontrado.");
}

const QUOTE_EDITABLE: readonly ClaimStatus[] = ["AGUARDANDO_ORCAMENTO", "AJUSTE_SOLICITADO"];

/** Oficina responsável pode editar o orçamento enquanto aguarda orçamento ou ajuste. */
export function canEditQuote(actor: Actor, claim: ClaimAccess): boolean {
  return actor.role === "OFICINA" && canViewClaim(actor, claim) && QUOTE_EDITABLE.includes(claim.status);
}

/** Seguradora revisa cobertura item a item quando o orçamento foi enviado. */
export function canReviewQuote(actor: Actor, claim: ClaimAccess): boolean {
  return actor.role === "SEGURADORA" && claim.status === "ORCAMENTO_ENVIADO";
}

/** Mensagens: qualquer participante que enxerga o sinistro. */
export function canPostMessage(actor: Actor, claim: Pick<ClaimAccess, "clientId" | "workshopId">): boolean {
  return canViewClaim(actor, claim);
}

/** Anexos: cliente e oficina participantes (seguradora também, para laudos). */
export function canUploadAttachment(actor: Actor, claim: Pick<ClaimAccess, "clientId" | "workshopId">): boolean {
  return canViewClaim(actor, claim);
}

export function canOpenClaim(actor: Actor, vehicle: { ownerId: string }): boolean {
  return actor.role === "CLIENTE" && vehicle.ownerId === actor.id;
}

export function canManageVehicle(actor: Actor, vehicle: { ownerId: string }): boolean {
  return actor.role === "CLIENTE" && vehicle.ownerId === actor.id;
}
