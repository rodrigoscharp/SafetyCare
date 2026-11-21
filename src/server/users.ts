import "server-only";
import { prisma } from "@/lib/prisma";

export function listWorkshops() {
  return prisma.user.findMany({ where: { role: "OFICINA" }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

export async function isWorkshop(id: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  return u?.role === "OFICINA";
}
