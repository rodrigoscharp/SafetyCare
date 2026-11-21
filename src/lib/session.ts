import "server-only";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_HOME } from "@/domain/roles";

export type SessionUser = { id: string; role: Role; name: string; email: string };

export class AuthError extends Error {}

/** Para páginas (Server Components): redireciona se não autenticado ou perfil errado. */
export async function requirePageUser(role?: Role): Promise<SessionUser> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.role) redirect("/login");
  if (role && u.role !== role) redirect(ROLE_HOME[u.role]);
  return { id: u.id, role: u.role, name: u.name ?? "", email: u.email ?? "" };
}

/** Para Server Actions: lança erro em vez de redirecionar. */
export async function requireActionUser(role?: Role | Role[]): Promise<SessionUser> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.role) throw new AuthError("Sessão expirada. Entre novamente.");
  const allowed = role === undefined ? null : Array.isArray(role) ? role : [role];
  if (allowed && !allowed.includes(u.role)) throw new AuthError("Acesso negado para este perfil.");
  return { id: u.id, role: u.role, name: u.name ?? "", email: u.email ?? "" };
}
