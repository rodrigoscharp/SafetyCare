import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/lib/session";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser("CLIENTE");
  return (
    <AppShell
      user={user}
      nav={[
        { href: "/app", label: "Início", icon: "home", exact: true },
        { href: "/app/sinistros/novo", label: "Abrir sinistro", icon: "plus", highlight: true },
        { href: "/app/veiculos", label: "Veículos", icon: "car" },
      ]}
    >
      {children}
    </AppShell>
  );
}
