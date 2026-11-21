import Link from "next/link";
import { Bike, Car, ChevronRight } from "lucide-react";
import type { ClaimListItem } from "@/server/claims";
import { CLAIM_TYPE_LABEL } from "@/domain/labels";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

export function ClaimList({
  claims,
  basePath,
  show = "client",
}: {
  claims: ClaimListItem[];
  basePath: string;
  /** Coluna de pessoa exibida: cliente (para oficina/seguradora) ou oficina (para cliente) */
  show?: "client" | "workshop";
}) {
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-xl border">
      {claims.map((c) => {
        const v = c.policy.vehicle;
        const Icon = v.type === "MOTO" ? Bike : Car;
        const person = show === "client" ? c.client.name : (c.workshop?.name ?? "—");
        return (
          <li key={c.id}>
            <Link
              href={`${basePath}/sinistros/${c.id}`}
              className="hover:bg-accent/50 focus-visible:bg-accent/50 flex items-center gap-4 px-4 py-3 transition-colors outline-none"
            >
              <span className="bg-muted grid size-10 shrink-0 place-items-center rounded-lg">
                <Icon className="text-muted-foreground size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-sm font-medium">{c.protocol}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">
                  {v.brand} {v.model} · {v.plate} · {CLAIM_TYPE_LABEL[c.type]}
                </p>
              </div>
              <div className="text-muted-foreground hidden shrink-0 text-right text-xs sm:block">
                <p className="text-foreground text-sm">{person}</p>
                <p>Atualizado em {formatDate(c.updatedAt)}</p>
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
