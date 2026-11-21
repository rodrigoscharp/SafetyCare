"use client";

import type { PartDefinition } from "@/domain/parts";
import { PART_VISUAL_LABEL, type PartVisual } from "@/domain/part-status";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HatchSwatch, Swatch } from "./legend";
import type { PartRenderState } from "./vehicle-scene";
import { SEVERITY_COLOR, VISUAL_COLOR } from "./visual-style";

export function PartList({
  parts,
  states,
  totals,
  activeKey,
  bodyColor,
  actionLabel,
  onHover,
  onActivate,
}: {
  parts: PartDefinition[];
  states: Record<string, PartRenderState>;
  totals: Record<string, number>;
  activeKey: string | null;
  bodyColor: string;
  actionLabel: string;
  onHover: (key: string | null) => void;
  onActivate: (key: string) => void;
}) {
  const affected = parts.filter((p) => (states[p.key]?.visual ?? "INTACTA") !== "INTACTA");
  const intact = parts.filter((p) => (states[p.key]?.visual ?? "INTACTA") === "INTACTA");

  const renderItem = (p: PartDefinition) => {
    const st = states[p.key] ?? { visual: "INTACTA" as PartVisual };
    const total = totals[p.key];
    return (
      <li key={p.key}>
        <button
          type="button"
          onMouseEnter={() => onHover(p.key)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(p.key)}
          onBlur={() => onHover(null)}
          onClick={() => onActivate(p.key)}
          aria-label={`${p.label}: ${PART_VISUAL_LABEL[st.visual]}. ${actionLabel}`}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors outline-none",
            "hover:bg-accent focus-visible:ring-ring focus-visible:ring-2",
            activeKey === p.key && "bg-accent",
          )}
        >
          {st.visual === "NAO_COBERTO" ? (
            <HatchSwatch />
          ) : (
            <Swatch
              color={
                st.visual === "INTACTA"
                  ? bodyColor
                  : st.visual === "DANO"
                    ? SEVERITY_COLOR[st.severity ?? "MEDIO"]
                    : VISUAL_COLOR[st.visual]
              }
            />
          )}
          <span className="flex-1 truncate">{p.label}</span>
          {total !== undefined ? (
            <span className="text-muted-foreground text-xs tabular-nums">{formatBRL(total)}</span>
          ) : st.visual !== "INTACTA" ? (
            <span className="text-muted-foreground text-xs">{PART_VISUAL_LABEL[st.visual]}</span>
          ) : null}
        </button>
      </li>
    );
  };

  return (
    <div className="grid gap-3">
      <section>
        <h4 className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wide uppercase">
          Peças afetadas ({affected.length})
        </h4>
        {affected.length ? (
          <ul className="grid">{affected.map(renderItem)}</ul>
        ) : (
          <p className="text-muted-foreground px-2 text-xs">Nenhuma peça marcada.</p>
        )}
      </section>
      <section>
        <h4 className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wide uppercase">Demais peças</h4>
        <ul className="grid">{intact.map(renderItem)}</ul>
      </section>
    </div>
  );
}
