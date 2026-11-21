"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hand, Maximize2, Minimize2, Move3d, Pause, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { partLabel, partsFor } from "@/domain/parts";
import { partVisual, type DamageLike } from "@/domain/part-status";
import { cn } from "@/lib/utils";
import { DamageEditor } from "./damage-editor";
import { ViewerLegend } from "./legend";
import { focusCamera, presetCamera, proceduralProvider, type ViewPreset } from "./procedural-provider";
import { PartList } from "./part-list";
import { PartTooltip } from "./part-tooltip";
import type { VehicleViewerProps } from "./types";
import type { CameraRequest, PartRenderState } from "./vehicle-scene";

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

  // calculada só na montagem: a câmera não deve pular enquanto o usuário marca danos
  const [initialKeys] = useState(() => [...damages.map((d) => d.partKey), ...items.map((i) => i.partKey)]);
  const cameraPosition = useMemo(() => focusCamera(model, initialKeys), [model, initialKeys]);
  const [view, setView] = useState<ViewPreset>("danos");
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // o 3D só "prende" rolagem e toque depois que o usuário interage com ele
  const [engagedByUser, setEngagedByUser] = useState(false);
  const engaged = expanded || engagedByUser;
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!engagedByUser) return;
    const onDown = (e: PointerEvent) => {
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) setEngagedByUser(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [engagedByUser]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const goTo = (preset: ViewPreset) => {
    setView(preset);
    setAutoRotate(false);
    const affected = [...damages.map((d) => d.partKey), ...items.map((i) => i.partKey)];
    const position = preset === "danos" ? focusCamera(model, affected) : presetCamera(model, preset);
    setCameraRequest((cur) => ({ position, nonce: (cur?.nonce ?? 0) + 1 }));
  };

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

  const hasAffected = damages.length + items.length > 0;
  const views: { key: ViewPreset; label: string }[] = [
    ...(hasAffected ? [{ key: "danos" as const, label: "Danos" }] : []),
    { key: "frente", label: "Frente" },
    { key: "esquerda", label: "Esquerda" },
    { key: "traseira", label: "Traseira" },
    { key: "direita", label: "Direita" },
    { key: "topo", label: "Topo" },
  ];

  return (
    <div
      className={cn(
        "grid gap-4",
        expanded ? "bg-background fixed inset-0 z-50 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_300px]" : "xl:grid-cols-[minmax(0,1fr)_280px]",
        className,
      )}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? "Modelo 3D em tela cheia" : undefined}
    >
      <div
        ref={stageRef}
        onPointerDown={() => setEngagedByUser(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setEngagedByUser(false)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setEngagedByUser(false)}
        className={cn(
          "relative overflow-hidden rounded-3xl border transition-shadow",
          engaged && !expanded && "ring-primary/40 ring-2",
          "bg-[radial-gradient(ellipse_at_50%_35%,var(--card)_0%,var(--accent)_70%,var(--muted)_100%)]",
          expanded ? "h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2rem)]" : "h-[440px] sm:h-[540px] lg:h-[620px]",
        )}
      >
        <VehicleScene
          key={type}
          model={model}
          cameraPosition={cameraPosition}
          cameraRequest={cameraRequest}
          autoRotate={autoRotate}
          engaged={engaged}
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

        <div className="absolute top-3 right-3 z-30 flex gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="bg-card/90 shadow-sm backdrop-blur"
            aria-pressed={autoRotate}
            aria-label={autoRotate ? "Parar giro automático" : "Girar automaticamente"}
            title={autoRotate ? "Parar giro" : "Girar"}
            onClick={() => setAutoRotate((v) => !v)}
          >
            {autoRotate ? <Pause className="size-4" /> : <RotateCw className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="bg-card/90 shadow-sm backdrop-blur"
            aria-label={expanded ? "Sair da tela cheia" : "Tela cheia"}
            title={expanded ? "Sair da tela cheia (Esc)" : "Tela cheia"}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>

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

        <div className="absolute inset-x-3 bottom-3 z-30 flex flex-col items-center gap-2">
          <div
            role="toolbar"
            aria-label="Vistas do veículo"
            className="bg-card/90 flex max-w-full gap-1 overflow-x-auto rounded-2xl border p-1 shadow-lg backdrop-blur"
          >
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => goTo(v.key)}
                aria-pressed={view === v.key}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm",
                  view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground pointer-events-none flex items-center gap-1.5 text-xs">
            {engaged ? (
              <>
                <Move3d className="size-3.5" /> Arraste para girar · role ou use dois dedos para aproximar
              </>
            ) : (
              <>
                <Hand className="size-3.5" /> Toque ou clique no modelo para interagir
              </>
            )}
          </p>
        </div>
      </div>

      <aside
        className={cn(
          "bg-card flex flex-col gap-3 rounded-3xl border p-4",
          expanded ? "hidden lg:flex lg:h-[calc(100dvh-2rem)]" : "xl:max-h-[620px]",
        )}
      >
        <ViewerLegend mode={mode} color={bodyColor} />
        <div className="border-t" />
        <ScrollArea className="max-h-72 xl:max-h-none xl:min-h-0 xl:flex-1 [&_[data-radix-scroll-area-viewport]>div]:!block">
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
