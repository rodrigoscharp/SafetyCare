import type { FinancialSummary } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FinancialSummaryView({
  summary,
  audience,
  provisional,
}: {
  summary: FinancialSummary;
  /** "client" fala com o segurado ("você paga") */
  audience: "client" | "staff";
  /** Ainda há itens sem decisão de cobertura */
  provisional?: boolean;
}) {
  const payLabel = audience === "client" ? "Você paga" : "Segurado paga";
  return (
    <div className="grid gap-4">
      <dl className="grid gap-2 text-sm">
        <Line k="Total do orçamento" v={summary.quoteTotal} />
        <Line k="Itens cobertos" v={summary.coveredTotal} tone="text-emerald-600 dark:text-emerald-400" />
        <Line k="Itens não cobertos" v={summary.notCoveredTotal} tone={summary.notCoveredTotal ? "text-red-600 dark:text-red-400" : undefined} />
        {summary.pendingTotal ? <Line k="Em análise" v={summary.pendingTotal} tone="text-muted-foreground" /> : null}
        <div className="border-t" />
        <Line
          k={`Franquia${summary.deductibleApplied < summary.deductible ? " (limitada ao valor coberto)" : ""}`}
          v={summary.deductibleApplied}
          hint={summary.deductibleApplied < summary.deductible ? `Apólice: ${formatBRL(summary.deductible)}` : undefined}
        />
        <Line k="Seguradora paga" v={summary.insurerPays} />
      </dl>
      <div className="bg-primary/10 border-primary/30 flex items-end justify-between gap-3 rounded-xl border p-4">
        <div>
          <p className="text-sm font-medium">{payLabel}</p>
          <p className="text-muted-foreground text-xs">Franquia + itens não cobertos</p>
        </div>
        <p className="text-3xl font-semibold tabular-nums">{formatBRL(summary.clientPays)}</p>
      </div>
      {provisional ? (
        <p className="text-muted-foreground text-xs">Valores provisórios: a seguradora ainda está analisando a cobertura de alguns itens.</p>
      ) : null}
    </div>
  );
}

function Line({ k, v, tone, hint }: { k: string; v: number; tone?: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">
        {k}
        {hint ? <span className="block text-xs">{hint}</span> : null}
      </dt>
      <dd className={cn("font-medium tabular-nums", tone)}>{formatBRL(v)}</dd>
    </div>
  );
}
