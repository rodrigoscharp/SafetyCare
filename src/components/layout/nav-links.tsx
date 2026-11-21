"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Gauge, Home, Inbox, PlusCircle, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { home: Home, plus: PlusCircle, car: Car, inbox: Inbox, gauge: Gauge, wrench: Wrench } satisfies Record<string, LucideIcon>;

export type NavIcon = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: NavIcon; exact?: boolean; highlight?: boolean };

function useActive() {
  const pathname = usePathname();
  return (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function TopNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  if (items.length < 2) return null;
  return (
    <nav
      className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.highlight ? (
                  <span className="bg-brand-gradient -mt-5 grid size-12 place-items-center rounded-2xl text-white shadow-lg shadow-primary/30">
                    <Icon className="size-5" />
                  </span>
                ) : (
                  <Icon className="size-5" />
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
