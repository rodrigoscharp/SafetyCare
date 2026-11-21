import "server-only";
import type { ClaimStatus, Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { assertTransition, STATUS_LABEL, type TransitionContext } from "@/domain/claim-state-machine";
import { DomainError } from "@/domain/errors";
import { isValidPartFor, partLabel } from "@/domain/parts";
import { assertCanViewClaim, canOpenClaim, canPostMessage, canUploadAttachment, claimScope, type Actor } from "@/domain/permissions";
import { formatProtocol } from "@/domain/protocol";
import { prisma } from "@/lib/prisma";
import type { CreateClaimInput } from "@/lib/validation/claim";
import { attachmentKindFor, storage, validateUpload } from "./storage";

type Tx = Prisma.TransactionClient;

export const claimDetailInclude = {
  policy: { include: { vehicle: true } },
  client: { select: { id: true, name: true, email: true } },
  workshop: { select: { id: true, name: true, email: true } },
  adjuster: { select: { id: true, name: true } },
  damages: { orderBy: { partKey: "asc" } },
  quotes: { orderBy: { version: "desc" }, include: { items: { orderBy: { partKey: "asc" } } } },
  events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { id: true, name: true, role: true } } } },
  attachments: { orderBy: { createdAt: "asc" }, include: { uploader: { select: { name: true, role: true } } } },
} satisfies Prisma.ClaimInclude;

export type ClaimDetail = Prisma.ClaimGetPayload<{ include: typeof claimDetailInclude }>;

export const claimListInclude = {
  policy: { include: { vehicle: true } },
  client: { select: { name: true } },
  workshop: { select: { name: true } },
  quotes: {
    where: { status: { not: "RASCUNHO" } },
    orderBy: { version: "desc" },
    take: 1,
    include: { items: { select: { partPrice: true, laborPrice: true, coverage: true } } },
  },
} satisfies Prisma.ClaimInclude;

export type ClaimListItem = Prisma.ClaimGetPayload<{ include: typeof claimListInclude }>;

/** Detalhe do sinistro respeitando a visibilidade do perfil (404 se não puder ver). */
export async function getClaimForActor(actor: Actor, id: string): Promise<ClaimDetail> {
  const claim = await prisma.claim.findFirst({ where: { id, ...claimScope(actor) }, include: claimDetailInclude });
  if (!claim) notFound();
  return claim;
}

export async function listClaimsForActor(actor: Actor, filter: { status?: ClaimStatus[] } = {}): Promise<ClaimListItem[]> {
  return prisma.claim.findMany({
    where: { ...claimScope(actor), ...(filter.status?.length ? { status: { in: filter.status } } : {}) },
    include: claimListInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function countClaimsByStatus(actor: Actor): Promise<Partial<Record<ClaimStatus, number>>> {
  const rows = await prisma.claim.groupBy({ by: ["status"], where: claimScope(actor), _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
}

async function nextProtocol(tx: Tx): Promise<string> {
  const year = new Date().getUTCFullYear();
  const seq = await tx.protocolSequence.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return formatProtocol(year, seq.last);
}

/** Carrega o sinistro para mutação garantindo visibilidade. */
async function loadForMutation(tx: Tx, actor: Actor, claimId: string) {
  const claim = await tx.claim.findUnique({
    where: { id: claimId },
    select: { id: true, status: true, clientId: true, workshopId: true, type: true },
  });
  if (!claim) throw new DomainError("Sinistro não encontrado.");
  assertCanViewClaim(actor, claim);
  return claim;
}

export type TransitionInput = {
  to: ClaimStatus;
  message?: string;
  context?: TransitionContext;
  /** Campos extras atualizados junto com o status */
  data?: Prisma.ClaimUncheckedUpdateManyInput;
};

/**
 * ÚNICO caminho para mudar status. Valida pela máquina de estados, aplica com checagem
 * otimista do status anterior e registra o ClaimEvent na mesma transação.
 */
export async function applyTransition(tx: Tx, actor: Actor, claimId: string, input: TransitionInput) {
  const claim = await loadForMutation(tx, actor, claimId);
  const transition = assertTransition(claim.status, input.to, actor.role, input.context);

  const updated = await tx.claim.updateMany({
    where: { id: claim.id, status: claim.status },
    data: { ...input.data, status: input.to },
  });
  if (updated.count !== 1) throw new DomainError("O sinistro foi atualizado por outra pessoa. Recarregue a página.");

  await tx.claimEvent.create({
    data: {
      claimId: claim.id,
      actorId: actor.id,
      type: "STATUS",
      fromStatus: claim.status,
      toStatus: input.to,
      message: input.message?.trim() || `${transition.action}: ${STATUS_LABEL[claim.status]} → ${STATUS_LABEL[input.to]}.`,
    },
  });
  return claim;
}

export async function transitionClaim(actor: Actor, claimId: string, input: TransitionInput) {
  return prisma.$transaction((tx) => applyTransition(tx, actor, claimId, input));
}

export async function createClaim(actor: Actor, input: CreateClaimInput, files: File[]): Promise<{ id: string; protocol: string }> {
  files.forEach(validateUpload);

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
    include: { policies: { orderBy: { validUntil: "desc" }, take: 1 } },
  });
  if (!vehicle || !canOpenClaim(actor, vehicle)) throw new DomainError("Veículo não encontrado.");
  const policy = vehicle.policies[0];
  if (!policy) throw new DomainError("Este veículo não tem apólice vinculada.");
  if (policy.validUntil.getTime() < input.occurredAt.getTime()) {
    throw new DomainError("A apólice não estava vigente na data do ocorrido.");
  }

  const seen = new Set<string>();
  for (const d of input.damages) {
    if (!isValidPartFor(d.partKey, vehicle.type)) throw new DomainError(`Peça inválida para ${vehicle.type.toLowerCase()}: ${d.partKey}`);
    if (seen.has(d.partKey)) throw new DomainError(`Peça repetida: ${partLabel(d.partKey)}`);
    seen.add(d.partKey);
  }

  const claim = await prisma.$transaction(async (tx) => {
    const protocol = await nextProtocol(tx);
    return tx.claim.create({
      data: {
        protocol,
        policyId: policy.id,
        clientId: actor.id,
        type: input.type,
        description: input.description,
        occurredAt: input.occurredAt,
        location: input.location,
        status: "ABERTO",
        damages: {
          create: input.damages.map((d) => ({ partKey: d.partKey, severity: d.severity, note: d.note || null, source: "CLIENTE" as const })),
        },
        events: {
          create: {
            actorId: actor.id,
            type: "CRIACAO",
            toStatus: "ABERTO",
            message: `Sinistro aberto com ${input.damages.length} peça(s) marcada(s).`,
          },
        },
      },
      select: { id: true, protocol: true },
    });
  });

  if (files.length) await saveAttachments(actor, claim.id, files);
  return claim;
}

export async function saveAttachments(actor: Actor, claimId: string, files: File[]): Promise<number> {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { clientId: true, workshopId: true } });
  if (!claim || !canUploadAttachment(actor, claim)) throw new DomainError("Sinistro não encontrado.");
  files.forEach(validateUpload);

  const stored = [];
  for (const f of files) stored.push({ ...(await storage.save(claimId, f)), kind: attachmentKindFor(f) });

  await prisma.$transaction([
    prisma.attachment.createMany({
      data: stored.map((s) => ({ claimId, uploaderId: actor.id, url: s.url, name: s.name, kind: s.kind })),
    }),
    prisma.claimEvent.create({
      data: { claimId, actorId: actor.id, type: "ANEXO", message: `${stored.length} anexo(s) adicionado(s).` },
    }),
  ]);
  return stored.length;
}

export async function postMessage(actor: Actor, claimId: string, message: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { clientId: true, workshopId: true } });
  if (!claim || !canPostMessage(actor, claim)) throw new DomainError("Sinistro não encontrado.");
  await prisma.claimEvent.create({ data: { claimId, actorId: actor.id, type: "MENSAGEM", message } });
}
