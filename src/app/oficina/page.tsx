import type { Metadata } from "next";
import Link from "next/link";
import type { ClaimStatus } from "@prisma/client";
import { Wrench } from "lucide-react";
import { ClaimList } from "@/components/claim/claim-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { STATUS_LABEL } from "@/domain/claim-state-machine";
import { requirePageUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { countClaimsByStatus, listClaimsForActor } from "@/server/claims";

export const metadata: Metadata = { title: "Fila da oficina" };

const FILTERS: { key: string; label: string; statuses: ClaimStatus[] }[] = [
  { key: "acao", label: "Precisa de ação", statuses: ["ENCAMINHADO_OFICINA", "AGUARDANDO_ORCAMENTO", "AJUSTE_SOLICITADO", "ORCAMENTO_APROVADO", "EM_REPARO"] },
  { key: "avaliacao", label: "Com a seguradora", statuses: ["ORCAMENTO_ENVIADO"] },
  { key: "retirada", label: "Aguardando retirada", statuses: ["PRONTO_PARA_RETIRADA"] },
  { key: "encerrados", label: "Encerrados", statuses: ["CONCLUIDO", "NEGADO", "INDENIZACAO_INTEGRAL"] },
];

export default async function WorkshopQueue({ searchParams }: { searchParams: Promise<{ filtro?: string; status?: string }> }) {
  const user = await requirePageUser("OFICINA");
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === sp.filtro) ?? FILTERS[0];
  const status = filter.statuses.find((s) => s === sp.status);
  const [counts, claims] = await Promise.all([countClaimsByStatus(user), listClaimsForActor(user, { status: status ? [status] : filter.statuses })]);

  return (
    <>
      <PageHeader title="Fila de sinistros" description="Sinistros encaminhados à sua oficina." />
      <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Filtros">
        {FILTERS.map((f) => {
          const n = f.statuses.reduce((a, s) => a + (counts[s] ?? 0), 0);
          const active = f.key === filter.key && !status;
          return (
            <Link
              key={f.key}
              href={`/oficina?filtro=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f.label} <span className="tabular-nums opacity-80">· {n}</span>
            </Link>
          );
        })}
      </div>
      {filter.statuses.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Status">
          {filter.statuses.filter((s) => (counts[s] ?? 0) > 0 || status === s).map((s) => (
            <Link
              key={s}
              href={`/oficina?filtro=${filter.key}&status=${s}`}
              className={cn("rounded-md px-2 py-0.5 text-xs", status === s ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {STATUS_LABEL[s]} · {counts[s] ?? 0}
            </Link>
          ))}
        </div>
      ) : null}
      {claims.length ? (
        <ClaimList claims={claims} basePath="/oficina" viewer="OFICINA" />
      ) : (
        <EmptyState icon={Wrench} title="Nada por aqui" description="Nenhum sinistro neste filtro." />
      )}
    </>
  );
}
