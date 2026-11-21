"use server";

import bcrypt from "bcryptjs";
import { AuthError as NextAuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { ROLE_HOME } from "@/domain/roles";
import { fail, toActionError, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionError(parsed.error);

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (e) {
    if (e instanceof NextAuthError) return fail("E-mail ou senha incorretos.");
    throw e;
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email: parsed.data.email }, select: { role: true } });
  redirect(ROLE_HOME[user.role]);
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionError(parsed.error);
  const { name, email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return fail("Já existe uma conta com este e-mail.", { email: ["E-mail já cadastrado"] });

  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) } });
  await signIn("credentials", { email, password, redirect: false });
  redirect(ROLE_HOME[role]);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
