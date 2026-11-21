import type { Metadata } from "next";
import { AuthCard } from "@/components/layout/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Cadastro" };

export default function RegisterPage() {
  return (
    <AuthCard title="Criar conta" description="No MVP o cadastro não exige verificação.">
      <RegisterForm />
    </AuthCard>
  );
}
