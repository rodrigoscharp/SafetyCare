"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { Move3d } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { partLabel, partsFor } from "@/domain/parts";
import { partVisual, type DamageLike } from "@/domain/part-status";
import { cn } from "@/lib/utils";
import { DamageEditor } from "./damage-editor";
import { ViewerLegend } from "./legend";
import { proceduralProvider } from "./procedural-provider";
import { PartList } from "./part-list";
import { PartTooltip } from "./part-tooltip";
import type { VehicleViewerProps } from "./types";
import type { PartRenderState } from "./vehicle-scene";

const VehicleScene = dynamic(() => import("./vehicle-scene"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

export function ViewerSkeleton() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      <Skeleton className="h-24 w-2/3 rounded-3xl" />
      <p className="text-muted-foreground text-xs">Carregando modelo 3D…</p>
    </div>
  );
}

const DEFAULT_COLOR = "#9aa3ad";
const EMPTY: readonly never[] = [];

export function VehicleViewer({
  type,
  color = DEFAULT_COLOR,
  damages = EMPTY,
  items = EMPTY,
  mode,
  onDamagesChange,
  onPartClick,
  clickHint,
  className,
}: VehicleViewerProps) {
  const model = useMemo(() => proceduralProvider.getModel(type), [type]);
  const catalog = useMemo(() => partsFor(type), [type]);
  const bodyColor = /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_COLOR;

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const states = useMemo(() => {
    const out: Record<string, PartRenderState> = {};
    for (const p of catalog) {
      out[p.key] = {
        visual: partVisual(p.key, damages, items),
        severity: damages.find((d) => d.partKey === p.key)?.severity,
      };
    }
    return out;
  }, [catalog, damages, items]);

  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const i of items) out[i.partKey] = i.partPrice + i.laborPrice;
    return out;
  }, [items]);

  const activeKey = hoveredKey ?? pinnedKey ?? editingKey;

  const updateDamage = useCallback(
    (next: DamageLike) => onDamagesChange?.(damages.map((d) => (d.partKey === next.partKey ? next : d))),
    [damages, onDamagesChange],
  );

  const activate = useCallback(
    (key: string) => {
      if (mode === "select") {
        const exists = damages.some((d) => d.partKey === key);
        if (!exists) {
          onDamagesChange?.([...damages, { partKey: key, severity: "MEDIO", note: "" }]);
          setEditingKey(key);
        } else if (editingKey === key) {
          onDamagesChange?.(damages.filter((d) => d.partKey !== key));
          setEditingKey(null);
        } else {
          setEditingKey(key);
        }
        return;
      }
      if (onPartClick) onPartClick(key);
      // toque (sem hover) fixa o tooltip da peça
      setPinnedKey((cur) => (cur === key ? null : key));
    },
    [mode, damages, editingKey, onDamagesChange, onPartClick],
  );

  const editingDamage = editingKey ? damages.find((d) => d.partKey === editingKey) : undefined;
  const clickable = mode === "select" || Boolean(onPartClick);
  const hint = mode === "select" ? "Clique para marcar/editar dano" : clickHint;

  const tooltip =
    activeKey && !(mode === "select" && editingKey === activeKey) ? (
      <PartTooltip
        label={partLabel(activeKey)}
        damage={damages.find((d) => d.partKey === activeKey)}
        item={items.find((i) => i.partKey === activeKey)}
        hint={hint}
      />
    ) : null;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]", className)}>
      <div className="from-muted/60 to-background relative h-[380px] overflow-hidden rounded-xl border bg-gradient-to-b sm:h-[460px] lg:h-[540px]">
        <VehicleScene
          key={type}
          model={model}
          color={bodyColor}
          states={states}
          activeKey={activeKey}
          selectedKey={mode === "select" ? editingKey : null}
          clickable={clickable}
          tooltip={tooltip}
          onHover={setHoveredKey}
          onPartClick={activate}
          onMissed={() => {
            setPinnedKey(null);
          }}
        />
        {editingDamage ? (
          <DamageEditor
            label={partLabel(editingDamage.partKey)}
            damage={editingDamage}
            onChange={updateDamage}
            onRemove={() => {
              onDamagesChange?.(damages.filter((d) => d.partKey !== editingDamage.partKey));
              setEditingKey(null);
            }}
            onClose={() => setEditingKey(null)}
          />
        ) : null}
        <p className="text-muted-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 text-xs">
          <Move3d className="size-3.5" /> Arraste para girar · role para zoom
        </p>
      </div>

      <aside className="bg-card flex flex-col gap-3 rounded-xl border p-3 lg:max-h-[540px]">
        <ViewerLegend mode={mode} color={bodyColor} />
        <div className="border-t" />
        <ScrollArea className="max-h-72 lg:max-h-none lg:min-h-0 lg:flex-1">
          <PartList
            parts={catalog}
            states={states}
            totals={totals}
            activeKey={activeKey}
            bodyColor={bodyColor}
            actionLabel={mode === "select" ? "Ativar para marcar dano" : (clickHint ?? "Ver detalhes")}
            onHover={setHoveredKey}
            onActivate={activate}
          />
        </ScrollArea>
      </aside>
    </div>
  );
}
