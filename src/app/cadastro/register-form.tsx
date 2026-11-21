"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "CLIENTE", label: "Segurado", hint: "Abro e acompanho meus sinistros" },
  { value: "OFICINA", label: "Oficina", hint: "Recebo veículos e monto orçamentos" },
  { value: "SEGURADORA", label: "Seguradora", hint: "Analiso e aprovo sinistros" },
] as const;

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);
  const [role, setRole] = useState<string>("CLIENTE");
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="grid gap-4">
      {state && !state.ok && !fe ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium">Perfil</legend>
        {ROLES.map((r) => (
          <label
            key={r.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
              role === r.value ? "border-primary bg-primary/5" : "hover:bg-accent",
            )}
          >
            <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="accent-primary mt-0.5" />
            <span>
              <span className="font-medium">{r.label}</span>
              <span className="text-muted-foreground block text-xs">{r.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <FormField id="name" label={role === "OFICINA" ? "Nome da oficina" : "Nome"} error={fe?.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </FormField>
      <FormField id="email" label="E-mail" error={fe?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <FormField id="password" label="Senha" error={fe?.password} hint="Mínimo de 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </FormField>
      <Button type="submit" disabled={pending}>{pending ? "Criando conta…" : "Criar conta"}</Button>
      <p className="text-muted-foreground text-center text-sm">
        Já tem conta? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
