import type { Role } from "@prisma/client";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ROLE_HOME } from "@/domain/roles";
import { cn } from "@/lib/utils";
import { BottomNav, TopNav, type NavItem } from "./nav-links";
import { UserMenu } from "./user-menu";

/** Shell das áreas logadas: cabeçalho no topo (mesmo padrão do site) e barra inferior no celular. */
export function AppShell({ user, nav, children }: { user: { name: string; role: Role }; nav: NavItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-8">
          <Logo href={ROLE_HOME[user.role]} />
          <TopNav items={nav} />
          <div className="ml-auto">
            <UserMenu name={user.name} role={user.role} />
          </div>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-7xl px-4 pt-6 sm:px-8 lg:pt-10", nav.length > 1 ? "pb-28 md:pb-16" : "pb-16")}>{children}</main>
      <BottomNav items={nav} />
    </div>
  );
}
