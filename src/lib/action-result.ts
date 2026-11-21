import { ZodError } from "zod";
import { AuthError } from "@/lib/session";
import { DomainError } from "@/domain/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const initialActionState: ActionResult<undefined> | null = null;

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  return { ok: false, error, fieldErrors };
}

/** Converte erros conhecidos em resultado amigável; relança o resto (ex.: redirect do Next). */
export function toActionError(e: unknown): { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of e.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return fail(e.issues[0]?.message ?? "Dados inválidos", fieldErrors);
  }
  if (e instanceof AuthError || e instanceof DomainError) return fail(e.message);
  throw e;
}
