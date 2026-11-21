import type { Role } from "@prisma/client";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROLE_HOME, ROLE_LABEL } from "@/domain/roles";
import { BottomNav, SidebarNav, type NavItem } from "./nav-links";

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function UserBadge({ name, role }: { name: string; role: Role }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="bg-accent text-accent-foreground grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold">{initials(name)}</span>
      <div className="min-w-0">
        <p className="truncate text-sm leading-tight font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">{ROLE_LABEL[role]}</p>
      </div>
    </div>
  );
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="ghost" size="icon" type="submit" aria-label="Sair">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}

export function AppShell({ user, nav, children }: { user: { name: string; role: Role }; nav: NavItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="bg-sidebar sticky top-0 hidden h-dvh flex-col border-r p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo href={ROLE_HOME[user.role]} />
        </div>
        <div className="mt-6 flex-1">
          <SidebarNav items={nav} />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-2xl border p-2.5">
          <UserBadge name={user.name} role={user.role} />
          <div className="flex shrink-0">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>

      <header className="bg-background/85 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-lg lg:hidden">
        <Logo href={ROLE_HOME[user.role]} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className={`mx-auto w-full max-w-6xl px-4 pt-6 ${nav.length > 1 ? "pb-28" : "pb-10"} sm:px-6 lg:px-10 lg:pt-10 lg:pb-12`}>{children}</main>
      <BottomNav items={nav} />
    </div>
  );
}
