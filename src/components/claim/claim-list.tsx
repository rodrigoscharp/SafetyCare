import type { Role } from "@prisma/client";
import Link from "next/link";
import { Bike, Car, ChevronRight, Clock, Hand } from "lucide-react";
import type { ClaimListItem } from "@/server/claims";
import { daysSince, journeyStep } from "@/domain/claim-journey";
import { isTerminal } from "@/domain/claim-state-machine";
import { CLAIM_TYPE_LABEL } from "@/domain/labels";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function ClaimList({
  claims,
  basePath,
  viewer,
  show = "client",
}: {
  claims: ClaimListItem[];
  basePath: string;
  viewer: Role;
  /** Pessoa exibida: cliente (para oficina/seguradora) ou oficina (para cliente) */
  show?: "client" | "workshop";
}) {
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-2xl border shadow-sm shadow-black/[0.03]">
      {claims.map((c) => {
        const v = c.policy.vehicle;
        const Icon = v.type === "MOTO" ? Bike : Car;
        const person = show === "client" ? c.client.name : (c.workshop?.name ?? "Sem oficina");
        const j = journeyStep(c.status, viewer);
        const idle = daysSince(c.updatedAt);
        const stale = !isTerminal(c.status) && idle >= 3;
        return (
          <li key={c.id}>
            <Link
              href={`${basePath}/sinistros/${c.id}`}
              className="hover:bg-accent/40 focus-visible:bg-accent/40 flex items-center gap-4 px-4 py-4 transition-colors outline-none sm:px-5"
            >
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", j.yourTurn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{v.brand} {v.model}</span>
                  <StatusBadge status={c.status} />
                  {j.yourTurn ? (
                    <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold"><Hand className="size-3.5" /> Sua vez</span>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">
                  <span className="font-mono">{c.protocol}</span> · {CLAIM_TYPE_LABEL[c.type]} · {person}
                </p>
              </div>
              <div className="hidden shrink-0 text-right text-xs sm:block">
                {isTerminal(c.status) ? (
                  <span className="text-muted-foreground">Encerrado</span>
                ) : (
                  <span className={cn("inline-flex items-center gap-1", stale ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                    <Clock className="size-3.5" />
                    {idle === 0 ? "Atualizado hoje" : `Parado há ${idle} dia${idle > 1 ? "s" : ""}`}
                  </span>
                )}
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
