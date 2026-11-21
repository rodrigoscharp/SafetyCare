import type { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  CLIENTE: "/app",
  OFICINA: "/oficina",
  SEGURADORA: "/seguradora",
};

export const ROLE_LABEL: Record<Role, string> = {
  CLIENTE: "Cliente",
  OFICINA: "Oficina",
  SEGURADORA: "Seguradora",
};

const PREFIXES: [string, Role][] = [
  ["/app", "CLIENTE"],
  ["/oficina", "OFICINA"],
  ["/seguradora", "SEGURADORA"],
];

/** Perfil exigido por uma rota protegida; null se a rota é pública. */
export function requiredRoleForPath(pathname: string): Role | null {
  for (const [prefix, role] of PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

export function isRole(value: unknown): value is Role {
  return value === "CLIENTE" || value === "OFICINA" || value === "SEGURADORA";
}
