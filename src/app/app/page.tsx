import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileWarning, Plus } from "lucide-react";
import { ClaimList } from "@/components/claim/claim-list";
import { ClaimTracker } from "@/components/claim/claim-tracker";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { isTerminal } from "@/domain/claim-state-machine";
import { financialSummary } from "@/domain/quote";
import { requirePageUser } from "@/lib/session";
import { listClaimsForActor } from "@/server/claims";

export const metadata: Metadata = { title: "Início" };

function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

export default async function ClientHome() {
  const user = await requirePageUser("CLIENTE");
  const claims = await listClaimsForActor(user);
  const active = claims.filter((c) => !isTerminal(c.status));
  const closed = claims.filter((c) => isTerminal(c.status));

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Olá, {firstName(user.name)}</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {active.length ? `${active.length} sinistro${active.length > 1 ? "s" : ""} em andamento` : "Tudo tranquilo por aqui"}
          </h1>
        </div>
        <Button asChild size="lg" className="hidden sm:inline-flex">
          <Link href="/app/sinistros/novo"><Plus className="size-5" /> Abrir sinistro</Link>
        </Button>
      </div>

      {claims.length === 0 ? (
        <EmptyState
          icon={FileWarning}
          title="Aconteceu algo com seu veículo?"
          description="Abra um sinistro em poucos minutos e marque os danos direto no modelo 3D."
          action={<Button asChild size="lg"><Link href="/app/sinistros/novo">Abrir sinistro</Link></Button>}
        />
      ) : null}

      {active.length ? (
        <section className="grid gap-4" aria-label="Em andamento">
          {active.map((c) => {
            const q = c.quotes[0];
            const s = q ? financialSummary(q.items, c.policy.deductible) : null;
            return (
              <Link key={c.id} href={`/app/sinistros/${c.id}`} className="group block rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-ring/40">
                <div className="transition-transform group-hover:-translate-y-0.5">
                  <ClaimTracker
                    compact
                    status={c.status}
                    viewer="CLIENTE"
                    facts={{
                      protocol: c.protocol,
                      vehicle: `${c.policy.vehicle.brand} ${c.policy.vehicle.model}`,
                      workshop: c.workshop?.name,
                      estimatedDays: q?.estimatedDays,
                      clientPays: s && s.quoteTotal > 0 ? s.clientPays : null,
                      provisional: s ? s.pendingTotal > 0 : false,
                    }}
                  />
                </div>
                <span className="text-muted-foreground group-hover:text-foreground mt-2 flex items-center justify-end gap-1 text-sm font-medium">
                  Ver detalhes <ChevronRight className="size-4" />
                </span>
              </Link>
            );
          })}
        </section>
      ) : null}

      {closed.length ? (
        <section className="grid gap-3" aria-label="Encerrados">
          <h2 className="text-lg font-semibold">Encerrados</h2>
          <ClaimList claims={closed} basePath="/app" viewer="CLIENTE" show="workshop" />
        </section>
      ) : null}
    </div>
  );
}
