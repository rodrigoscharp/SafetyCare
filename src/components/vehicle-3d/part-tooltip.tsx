import type { DamageLike, QuoteItemLike } from "@/domain/part-status";
import { ACTION_LABEL, COVERAGE_LABEL, SEVERITY_LABEL } from "@/domain/labels";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PartTooltip({
  label,
  damage,
  item,
  hint,
}: {
  label: string;
  damage?: DamageLike;
  item?: QuoteItemLike;
  hint?: string;
}) {
  return (
    <div className="bg-popover text-popover-foreground w-56 rounded-lg border p-3 text-xs shadow-xl">
      <p className="text-sm font-semibold">{label}</p>
      {item ? (
        <div className="mt-2 grid gap-1">
          <Row k="Ação" v={ACTION_LABEL[item.action]} />
          <Row k="Peça" v={formatBRL(item.partPrice)} />
          <Row k="Mão de obra" v={formatBRL(item.laborPrice)} />
          <Row k="Total" v={formatBRL(item.partPrice + item.laborPrice)} strong />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Cobertura</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-medium",
                item.coverage === "COBERTO" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                item.coverage === "NAO_COBERTO" && "bg-red-500/15 text-red-600 dark:text-red-400",
                item.coverage === "PENDENTE" && "bg-muted text-muted-foreground",
              )}
            >
              {COVERAGE_LABEL[item.coverage]}
            </span>
          </div>
          {item.insurerNote ? <p className="text-muted-foreground mt-1 italic">“{item.insurerNote}”</p> : null}
        </div>
      ) : damage ? (
        <div className="mt-2 grid gap-1">
          <Row k="Dano" v={SEVERITY_LABEL[damage.severity]} />
          {damage.note ? <p className="text-muted-foreground">{damage.note}</p> : null}
          <p className="text-muted-foreground mt-1">Aguardando orçamento</p>
        </div>
      ) : (
        <p className="text-muted-foreground mt-1">Sem danos registrados</p>
      )}
      {hint ? <p className="text-primary mt-2 font-medium">{hint}</p> : null}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>{v}</span>
    </div>
  );
}
