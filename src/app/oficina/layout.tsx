import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requirePageUser } from "@/lib/session";

export default async function WorkshopLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser("OFICINA");
  return (
    <AppShell user={user} nav={[{ href: "/oficina", label: "Fila de sinistros", icon: "wrench" }]}>
      {children}
    </AppShell>
  );
}
