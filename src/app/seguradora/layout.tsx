import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/lib/session";

export default async function InsurerLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser("SEGURADORA");
  return (
    <AppShell user={user} nav={[{ href: "/seguradora", label: "Painel" }]}>
      {children}
    </AppShell>
  );
}
