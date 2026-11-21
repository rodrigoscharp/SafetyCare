import type { Role } from "@prisma/client";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_HOME, ROLE_LABEL } from "@/domain/roles";
import { NavLinks, type NavItem } from "./nav-links";

export function AppShell({
  user,
  nav,
  children,
}: {
  user: { name: string; role: Role };
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Logo href={ROLE_HOME[user.role]} />
          <div className="hidden flex-1 md:block">
            <NavLinks items={nav} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">{user.name}</p>
            </div>
            <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t px-2 py-1.5 md:hidden">
          <NavLinks items={nav} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
