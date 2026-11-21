"use client";

import type { Coverage, VehicleType } from "@prisma/client";
import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { approveQuoteAction, rejectQuoteAction, requestAdjustmentAction, saveCoverageAction } from "@/actions/insurer";
import { ActionDot, type QuoteTableItem } from "@/components/claim/quote-table";
import { FinancialSummaryView } from "@/components/claim/financial-summary";
import { ReasonDialog } from "@/components/reason-dialog";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { partLabel } from "@/domain/parts";
import type { DamageLike } from "@/domain/part-status";
import { financialSummary, itemTotal } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

type Decision = { coverage: Coverage; insurerNote: string };

export function QuoteReview({
  claimId,
  vehicleType,
  color,
  damages,
  items,
  version,
  estimatedDays,
  workshop,
  deductible,
}: {
  claimId: string;
  vehicleType: VehicleType;
  color: string;
  damages: DamageLike[];
  items: QuoteTableItem[];
  version: number;
  estimatedDays: number;
  workshop: string;
  deductible: number;
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(items.map((i) => [i.id, { coverage: i.coverage, insurerNote: i.insurerNote ?? "" }])),
  );
  const [pending, start] = useTransition();

  const live = items.map((i) => ({ ...i, coverage: decisions[i.id].coverage, insurerNote: decisions[i.id].insurerNote || null }));
  const summary = financialSummary(live, deductible);
  const pendingCount = live.filter((i) => i.coverage === "PENDENTE").length;

  const set = (id: string, patch: Partial<Decision>) => setDecisions((cur) => ({ ...cur, [id]: { ...cur[id], ...patch } }));
  const payload = () => ({
    claimId,
    decisions: items.map((i) => ({ itemId: i.id, coverage: decisions[i.id].coverage, insurerNote: decisions[i.id].insurerNote || null })),
  });
  const run = (fn: () => ReturnType<typeof saveCoverageAction>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orçamento v{version} · {workshop}</CardTitle>
          <CardDescription>
            Defina a cobertura de cada item. O modelo 3D atualiza em tempo real. Prazo estimado: {estimatedDays} dia(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleViewer type={vehicleType} color={color} mode="view" damages={damages} items={live} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Cobertura por item</CardTitle>
            <CardDescription>{pendingCount ? `${pendingCount} item(ns) sem decisão.` : "Todos os itens decididos."}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDecisions((cur) => Object.fromEntries(Object.entries(cur).map(([k, d]) => [k, d.coverage === "PENDENTE" ? { ...d, coverage: "COBERTO" } : d])))}
          >
            Cobrir pendentes
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ul className="divide-y rounded-lg border">
            {live.map((i) => {
              const d = decisions[i.id];
              return (
                <li key={i.id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{partLabel(i.partKey)}</p>
                    <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
                      <ActionDot action={i.action} />
                      <span>Peça {formatBRL(i.partPrice)}</span>
                      <span>M.O. {formatBRL(i.laborPrice)}</span>
                      <span className="text-foreground font-medium">{formatBRL(itemTotal(i))}</span>
                    </p>
                    <Input
                      value={d.insurerNote}
                      onChange={(e) => set(i.id, { insurerNote: e.target.value })}
                      placeholder="Nota para oficina/segurado (opcional)"
                      maxLength={500}
                      className="mt-2 h-8 text-xs"
                      aria-label={`Nota sobre ${partLabel(i.partKey)}`}
                    />
                  </div>
                  <div className="flex gap-1.5" role="radiogroup" aria-label={`Cobertura de ${partLabel(i.partKey)}`}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={d.coverage === "COBERTO"}
                      onClick={() => set(i.id, { coverage: "COBERTO" })}
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        d.coverage === "COBERTO" ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "hover:bg-accent",
                      )}
                    >
                      <Check className="size-3.5" /> Coberto
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={d.coverage === "NAO_COBERTO"}
                      onClick={() => set(i.id, { coverage: "NAO_COBERTO" })}
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        d.coverage === "NAO_COBERTO" ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300" : "hover:bg-accent",
                      )}
                    >
                      <X className="size-3.5" /> Não coberto
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">Resumo financeiro (prévia)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FinancialSummaryView summary={summary} audience="staff" provisional={pendingCount > 0} />
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <ReasonDialog
              trigger={<Button variant="ghost" className="text-destructive">Negar sinistro</Button>}
              title="Negar sinistro"
              description="Encerra o sinistro sem cobertura. O motivo fica visível para todos."
              confirmLabel="Negar"
              destructive
              onConfirm={(t) => rejectQuoteAction(claimId, t)}
            />
            <Button variant="outline" disabled={pending} onClick={() => run(() => saveCoverageAction(payload()))}>
              Salvar decisões
            </Button>
            <ReasonDialog
              trigger={<Button variant="outline">Pedir ajuste</Button>}
              title="Pedir ajuste à oficina"
              description="A oficina poderá enviar uma nova versão do orçamento. Suas decisões e notas por item ficam registradas."
              confirmLabel="Pedir ajuste"
              placeholder="Ex.: valor da peça acima da tabela de referência."
              onConfirm={(t) => requestAdjustmentAction(payload(), t)}
            />
            <Button disabled={pending || pendingCount > 0} onClick={() => run(() => approveQuoteAction(payload()))}>
              {pending ? "Salvando…" : "Aprovar orçamento"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
