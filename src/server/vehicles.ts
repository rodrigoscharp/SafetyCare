import "server-only";
import { DomainError } from "@/domain/errors";
import { canManageVehicle, type Actor } from "@/domain/permissions";
import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { vehicleSchema } from "@/lib/validation/claim";

export type VehicleInput = z.infer<typeof vehicleSchema>;

export async function listVehicles(actor: Actor) {
  if (actor.role !== "CLIENTE") return [];
  return prisma.vehicle.findMany({
    where: { ownerId: actor.id },
    include: { policies: { orderBy: { validUntil: "desc" }, take: 1 }, _count: { select: { policies: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveVehicle(actor: Actor, input: VehicleInput) {
  if (actor.role !== "CLIENTE") throw new DomainError("Apenas segurados cadastram veículos.");

  const plateOwner = await prisma.vehicle.findUnique({ where: { plate: input.plate }, select: { id: true } });
  if (plateOwner && plateOwner.id !== input.id) throw new DomainError("Já existe um veículo com esta placa.");
  const policyOwner = await prisma.policy.findUnique({ where: { number: input.policyNumber }, select: { vehicleId: true } });
  if (policyOwner && policyOwner.vehicleId !== input.id) throw new DomainError("Número de apólice já utilizado.");

  const vehicleData = {
    type: input.type,
    brand: input.brand,
    model: input.model,
    year: input.year,
    plate: input.plate,
    color: input.color,
  };
  const policyData = { number: input.policyNumber, deductible: input.deductible, validUntil: input.validUntil };

  if (!input.id) {
    return prisma.vehicle.create({ data: { ...vehicleData, ownerId: actor.id, policies: { create: policyData } } });
  }

  const existing = await prisma.vehicle.findUnique({
    where: { id: input.id },
    include: { policies: { orderBy: { validUntil: "desc" }, take: 1 } },
  });
  if (!existing || !canManageVehicle(actor, existing)) throw new DomainError("Veículo não encontrado.");
  const hasClaims = await prisma.claim.count({ where: { policy: { vehicleId: existing.id } } });
  if (hasClaims && existing.type !== input.type) throw new DomainError("Não é possível mudar o tipo de um veículo com sinistros.");

  return prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.update({ where: { id: existing.id }, data: vehicleData });
    const policy = existing.policies[0];
    if (policy) await tx.policy.update({ where: { id: policy.id }, data: policyData });
    else await tx.policy.create({ data: { ...policyData, vehicleId: v.id } });
    return v;
  });
}

export async function deleteVehicle(actor: Actor, id: string) {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v || !canManageVehicle(actor, v)) throw new DomainError("Veículo não encontrado.");
  const claims = await prisma.claim.count({ where: { policy: { vehicleId: id } } });
  if (claims) throw new DomainError("Este veículo possui sinistros e não pode ser excluído.");
  await prisma.vehicle.delete({ where: { id } });
}
