"use client";

import type { Role } from "@prisma/client";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL } from "@/domain/roles";

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ name, role }: { name: string; role: Role }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-muted flex items-center gap-2.5 rounded-full py-1 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Menu de ${name}`}
      >
        <span className="hidden text-right sm:block">
          <span className="block max-w-40 truncate text-sm leading-tight font-medium">{name}</span>
          <span className="text-muted-foreground block text-xs">{ROLE_LABEL[role]}</span>
        </span>
        <span className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-semibold text-white">{initials(name)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{name}</span>
          <span className="text-muted-foreground block text-xs font-normal">{ROLE_LABEL[role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme(dark ? "light" : "dark")}>
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? "Tema claro" : "Tema escuro"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut className="size-4" /> Sair
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
