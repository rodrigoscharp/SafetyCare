import type { Metadata } from "next";
import Link from "next/link";
import type { ClaimStatus } from "@prisma/client";
import { Inbox } from "lucide-react";
import { ClaimList } from "@/components/claim/claim-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ALL_STATUSES, STATUS_LABEL } from "@/domain/claim-state-machine";
import { requirePageUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { countClaimsByStatus, listClaimsForActor } from "@/server/claims";

export const metadata: Metadata = { title: "Painel da seguradora" };

/** Grupos do painel: o que pede ação da seguradora vem primeiro. */
const GROUPS: { key: string; label: string; hint: string; statuses: ClaimStatus[] }[] = [
  { key: "triagem", label: "Triagem", hint: "Novos e em análise", statuses: ["ABERTO", "EM_ANALISE"] },
  { key: "orcamento", label: "Orçamentos a revisar", hint: "Aguardando sua decisão", statuses: ["ORCAMENTO_ENVIADO"] },
  { key: "oficina", label: "Na oficina", hint: "Encaminhados, ajuste, aprovados e em reparo", statuses: ["ENCAMINHADO_OFICINA", "AGUARDANDO_ORCAMENTO", "AJUSTE_SOLICITADO", "ORCAMENTO_APROVADO", "EM_REPARO", "PRONTO_PARA_RETIRADA"] },
  { key: "encerrados", label: "Encerrados", hint: "Concluídos, negados e indenizados", statuses: ["CONCLUIDO", "NEGADO", "INDENIZACAO_INTEGRAL"] },
];

function parseStatus(v: string | undefined): ClaimStatus | undefined {
  return ALL_STATUSES.find((s) => s === v);
}

export default async function InsurerDashboard({ searchParams }: { searchParams: Promise<{ status?: string; grupo?: string }> }) {
  const user = await requirePageUser("SEGURADORA");
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const group = GROUPS.find((g) => g.key === sp.grupo);
  const filter = status ? [status] : (group?.statuses ?? GROUPS[0].statuses.concat(GROUPS[1].statuses));
  const [counts, claims] = await Promise.all([countClaimsByStatus(user), listClaimsForActor(user, { status: filter })]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const title = status ? STATUS_LABEL[status] : (group?.label ?? "Precisa da sua ação");

  return (
    <>
      <PageHeader title="Painel" description={`${total} sinistro(s) no total.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GROUPS.map((g) => {
          const n = g.statuses.reduce((a, s) => a + (counts[s] ?? 0), 0);
          const active = group?.key === g.key && !status;
          return (
            <Link
              key={g.key}
              href={`/seguradora?grupo=${g.key}`}
              className={cn("bg-card hover:border-primary/50 rounded-2xl border p-5 shadow-sm shadow-black/[0.03] transition-colors", active && "border-primary ring-primary/20 ring-2")}
            >
              <p className="text-muted-foreground text-xs">{g.label}</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{n}</p>
              <p className="text-muted-foreground mt-1 text-xs">{g.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Filtrar por status">
        <FilterChip href="/seguradora" active={!status && !group} label="Precisa da sua ação" />
        {ALL_STATUSES.filter((s) => (counts[s] ?? 0) > 0 || status === s).map((s) => (
          <FilterChip key={s} href={`/seguradora?status=${s}`} active={status === s} label={`${STATUS_LABEL[s]} · ${counts[s] ?? 0}`} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      {claims.length ? (
        <ClaimList claims={claims} basePath="/seguradora" viewer="SEGURADORA" />
      ) : (
        <EmptyState icon={Inbox} title="Fila vazia" description="Nenhum sinistro neste filtro." />
      )}
    </>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
