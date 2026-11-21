import type { ClaimStatus } from "@prisma/client";
import { Check, X } from "lucide-react";
import { MAIN_PATH, STATUS_LABEL, stepIndex } from "@/domain/claim-state-machine";
import { cn } from "@/lib/utils";

const SHORT: Partial<Record<ClaimStatus, string>> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Análise",
  ENCAMINHADO_OFICINA: "Oficina",
  AGUARDANDO_ORCAMENTO: "Orçamento",
  ORCAMENTO_ENVIADO: "Avaliação",
  ORCAMENTO_APROVADO: "Aprovado",
  EM_REPARO: "Reparo",
  PRONTO_PARA_RETIRADA: "Retirada",
  CONCLUIDO: "Concluído",
};

export function StatusStepper({ status }: { status: ClaimStatus }) {
  if (status === "NEGADO" || status === "INDENIZACAO_INTEGRAL") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-4 text-sm",
          status === "NEGADO" ? "border-red-500/30 bg-red-500/5" : "border-violet-500/30 bg-violet-500/5",
        )}
      >
        <span className={cn("grid size-8 place-items-center rounded-full", status === "NEGADO" ? "bg-red-500/15 text-red-500" : "bg-violet-500/15 text-violet-500")}>
          {status === "NEGADO" ? <X className="size-4" /> : <Check className="size-4" />}
        </span>
        <div>
          <p className="font-medium">{STATUS_LABEL[status]}</p>
          <p className="text-muted-foreground text-xs">
            {status === "NEGADO" ? "O sinistro foi encerrado sem cobertura. Veja o motivo na linha do tempo." : "O sinistro será indenizado integralmente, sem reparo em oficina."}
          </p>
        </div>
      </div>
    );
  }

  const current = stepIndex(status);
  return (
    <ol className="flex w-full items-start overflow-x-auto pb-1" aria-label="Andamento do sinistro">
      {MAIN_PATH.map((s, i) => {
        const done = i < current || status === "CONCLUIDO";
        const active = i === current && status !== "CONCLUIDO";
        return (
          <li key={s} className="flex min-w-[72px] flex-1 flex-col items-center gap-1.5 text-center" aria-current={active ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : done || active ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-[11px] font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary ring-primary/20 ring-4",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === MAIN_PATH.length - 1 ? "bg-transparent" : done ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-[11px] leading-tight", active ? "text-foreground font-medium" : "text-muted-foreground")}>
              {s === "ORCAMENTO_ENVIADO" && status === "AJUSTE_SOLICITADO" ? "Ajuste" : SHORT[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
