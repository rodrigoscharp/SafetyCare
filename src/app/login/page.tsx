import type { Metadata } from "next";
import { AuthCard } from "@/components/layout/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthCard title="Entrar" description="Acesse o acompanhamento dos seus sinistros.">
      <LoginForm />
    </AuthCard>
  );
}
