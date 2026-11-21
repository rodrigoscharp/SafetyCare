import type { ClaimStatus } from "@prisma/client";
import { STATUS_LABEL } from "@/domain/claim-state-machine";
import { cn } from "@/lib/utils";

const TONE: Record<ClaimStatus, string> = {
  ABERTO: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  EM_ANALISE: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  NEGADO: "bg-red-500/15 text-red-700 dark:text-red-300",
  ENCAMINHADO_OFICINA: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  INDENIZACAO_INTEGRAL: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  AGUARDANDO_ORCAMENTO: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ORCAMENTO_ENVIADO: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  AJUSTE_SOLICITADO: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  ORCAMENTO_APROVADO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  EM_REPARO: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  PRONTO_PARA_RETIRADA: "bg-green-500/20 text-green-700 dark:text-green-300",
  CONCLUIDO: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
};

export function StatusBadge({ status, className }: { status: ClaimStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
