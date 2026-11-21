import type { ViewerMode } from "./types";
import { OUTLINE_NOT_COVERED, SEVERITY_COLOR, VISUAL_COLOR } from "./visual-style";

export function ViewerLegend({ mode, color }: { mode: ViewerMode; color: string }) {
  const entries =
    mode === "select"
      ? [
          { label: "Intacta", swatch: <Swatch color={color} /> },
          { label: "Dano leve", swatch: <Swatch color={SEVERITY_COLOR.LEVE} /> },
          { label: "Dano médio", swatch: <Swatch color={SEVERITY_COLOR.MEDIO} /> },
          { label: "Dano grave", swatch: <Swatch color={SEVERITY_COLOR.GRAVE} /> },
        ]
      : [
          { label: "Intacta", swatch: <Swatch color={color} /> },
          { label: "Dano declarado", swatch: <Swatch color={VISUAL_COLOR.DANO} /> },
          { label: "Trocar", swatch: <Swatch color={VISUAL_COLOR.TROCAR} /> },
          { label: "Reparar", swatch: <Swatch color={VISUAL_COLOR.REPARAR} /> },
          { label: "Pintar", swatch: <Swatch color={VISUAL_COLOR.PINTAR} /> },
          { label: "Não coberto", swatch: <HatchSwatch /> },
        ];
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs" aria-label="Legenda de cores">
      {entries.map((e) => (
        <li key={e.label} className="flex items-center gap-2">
          {e.swatch}
          <span className="text-muted-foreground">{e.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function Swatch({ color }: { color: string }) {
  return <span className="inline-block size-3 shrink-0 rounded-sm border border-black/10" style={{ background: color }} />;
}

export function HatchSwatch() {
  return (
    <span
      className="inline-block size-3 shrink-0 rounded-sm"
      style={{
        background: "repeating-linear-gradient(45deg,#9ca3af 0 2px,#4b5563 2px 4px)",
        outline: `1.5px solid ${OUTLINE_NOT_COVERED}`,
      }}
    />
  );
}
