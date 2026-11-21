"use client";

import type { RepairAction, VehicleType } from "@prisma/client";
import { useMemo, useRef, useState, useTransition } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveQuoteDraftAction, submitQuoteAction } from "@/actions/workshop";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_LABEL } from "@/domain/labels";
import { partLabel, partsFor } from "@/domain/parts";
import type { DamageLike, QuoteItemLike } from "@/domain/part-status";
import { suggestedAction } from "@/domain/quote";
import { centsToInput, formatBRL, parseBRLToCents } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = { partKey: string; action: RepairAction; partPrice: string; laborPrice: string; previousNote?: string | null };

const ACTIONS: RepairAction[] = ["TROCAR", "REPARAR", "PINTAR"];

export function QuoteEditor({
  claimId,
  vehicleType,
  color,
  damages,
  initialItems,
  initialDays,
  version,
}: {
  claimId: string;
  vehicleType: VehicleType;
  color: string;
  damages: DamageLike[];
  initialItems: (QuoteItemLike & { insurerNote?: string | null })[];
  initialDays: number;
  version: number;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialItems.map((i) => ({
      partKey: i.partKey,
      action: i.action,
      partPrice: centsToInput(i.partPrice),
      laborPrice: centsToInput(i.laborPrice),
      previousNote: i.insurerNote,
    })),
  );
  const [days, setDays] = useState(String(initialDays || ""));
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const catalog = useMemo(() => partsFor(vehicleType), [vehicleType]);

  const parsed = rows.map((r) => ({ ...r, part: parseBRLToCents(r.partPrice || "0"), labor: parseBRLToCents(r.laborPrice || "0") }));
  const total = parsed.reduce((s, r) => s + (r.part ?? 0) + (r.labor ?? 0), 0);

  const viewerItems: QuoteItemLike[] = parsed.map((r) => ({
    partKey: r.partKey,
    action: r.action,
    partPrice: r.part ?? 0,
    laborPrice: r.labor ?? 0,
    coverage: "PENDENTE",
  }));

  function addPart(partKey: string) {
    if (rows.some((r) => r.partKey === partKey)) {
      setFlash(partKey);
      rowRefs.current.get(partKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setFlash(null), 1200);
      return;
    }
    const severity = damages.find((d) => d.partKey === partKey)?.severity;
    setRows((cur) => [...cur, { partKey, action: suggestedAction(severity), partPrice: "", laborPrice: "" }]);
    toast.success(`${partLabel(partKey)} adicionado ao orçamento.`);
  }

  function update(partKey: string, patch: Partial<Row>) {
    setRows((cur) => cur.map((r) => (r.partKey === partKey ? { ...r, ...patch } : r)));
  }

  function payload() {
    const invalid = parsed.find((r) => r.part === null || r.labor === null);
    if (invalid) {
      toast.error(`Valor inválido em ${partLabel(invalid.partKey)}.`);
      return null;
    }
    const d = Number(days || "0");
    if (!Number.isInteger(d) || d < 0) {
      toast.error("Prazo estimado inválido.");
      return null;
    }
    return {
      claimId,
      estimatedDays: d,
      items: parsed.map((r) => ({ partKey: r.partKey, action: r.action, partPrice: r.part ?? 0, laborPrice: r.labor ?? 0 })),
    };
  }

  function save(submit: boolean) {
    const p = payload();
    if (!p) return;
    start(async () => {
      const r = submit ? await submitQuoteAction(p) : await saveQuoteDraftAction(p);
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  const unquoted = damages.filter((d) => !rows.some((r) => r.partKey === d.partKey));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danos e orçamento no 3D</CardTitle>
          <CardDescription>Clique numa peça para adicioná-la ao orçamento. As cores mostram a ação escolhida.</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleViewer
            type={vehicleType}
            color={color}
            mode="view"
            damages={damages}
            items={viewerItems}
            onPartClick={addPart}
            clickHint="Clique para adicionar ao orçamento"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orçamento v{version}</CardTitle>
          <CardDescription>Valores em reais. Itens novos fora dos danos declarados ficam registrados como identificados pela oficina.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {unquoted.length ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Danos declarados sem item:</span>
              {unquoted.map((d) => (
                <Button key={d.partKey} size="sm" variant="outline" onClick={() => addPart(d.partKey)}>
                  <Plus className="size-3" /> {partLabel(d.partKey)}
                </Button>
              ))}
            </div>
          ) : null}

          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-muted-foreground text-left text-xs">
                  <tr>
                    <th className="py-2 pr-2 font-medium">Peça</th>
                    <th className="px-2 py-2 font-medium">Ação</th>
                    <th className="px-2 py-2 font-medium">Peça (R$)</th>
                    <th className="px-2 py-2 font-medium">Mão de obra (R$)</th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                    <th className="py-2 pl-2"><span className="sr-only">Remover</span></th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r) => (
                    <tr
                      key={r.partKey}
                      ref={(el) => {
                        if (el) rowRefs.current.set(r.partKey, el);
                        else rowRefs.current.delete(r.partKey);
                      }}
                      className={cn("border-t transition-colors", flash === r.partKey && "bg-primary/10")}
                    >
                      <td className="py-2 pr-2">
                        <span className="font-medium">{partLabel(r.partKey)}</span>
                        {r.previousNote ? <p className="text-muted-foreground text-xs italic">Seguradora: “{r.previousNote}”</p> : null}
                      </td>
                      <td className="px-2 py-2">
                        <Select value={r.action} onValueChange={(v) => update(r.partKey, { action: v as RepairAction })}>
                          <SelectTrigger className="w-28" aria-label={`Ação para ${partLabel(r.partKey)}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTIONS.map((a) => (
                              <SelectItem key={a} value={a}>{ACTION_LABEL[a]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          inputMode="decimal"
                          value={r.partPrice}
                          onChange={(e) => update(r.partKey, { partPrice: e.target.value })}
                          placeholder="0,00"
                          aria-label={`Preço da peça ${partLabel(r.partKey)}`}
                          aria-invalid={r.part === null}
                          className="w-28"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          inputMode="decimal"
                          value={r.laborPrice}
                          onChange={(e) => update(r.partKey, { laborPrice: e.target.value })}
                          placeholder="0,00"
                          aria-label={`Mão de obra ${partLabel(r.partKey)}`}
                          aria-invalid={r.labor === null}
                          className="w-28"
                        />
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{formatBRL((r.part ?? 0) + (r.labor ?? 0))}</td>
                      <td className="py-2 pl-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${partLabel(r.partKey)}`}
                          onClick={() => setRows((cur) => cur.filter((x) => x.partKey !== r.partKey))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              Nenhum item ainda. Clique nas peças do modelo 3D ou use o seletor abaixo.
            </p>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 border-t pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium" htmlFor="add-part">Adicionar peça</label>
                <Select value="" onValueChange={addPart}>
                  <SelectTrigger id="add-part" className="w-56"><SelectValue placeholder="Escolher peça…" /></SelectTrigger>
                  <SelectContent>
                    {catalog.map((p) => (
                      <SelectItem key={p.key} value={p.key} disabled={rows.some((r) => r.partKey === p.key)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium" htmlFor="days">Prazo estimado (dias)</label>
                <Input id="days" type="number" min={0} max={365} value={days} onChange={(e) => setDays(e.target.value)} className="w-32" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Total do orçamento</p>
              <p className="text-2xl font-semibold tabular-nums">{formatBRL(total)}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={pending} onClick={() => save(false)}>Salvar rascunho</Button>
            <Button disabled={pending || rows.length === 0} onClick={() => save(true)}>
              <Send className="size-4" /> {pending ? "Enviando…" : "Enviar para a seguradora"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
