"use client";

import type { Severity } from "@prisma/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DamageLike } from "@/domain/part-status";
import { SEVERITY_LABEL } from "@/domain/labels";
import { cn } from "@/lib/utils";
import { SEVERITY_COLOR } from "./visual-style";

const SEVERITIES: Severity[] = ["LEVE", "MEDIO", "GRAVE"];

export function DamageEditor({
  label,
  damage,
  onChange,
  onRemove,
  onClose,
}: {
  label: string;
  damage: DamageLike;
  onChange: (d: DamageLike) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={`Dano em ${label}`}
      className="bg-popover text-popover-foreground absolute top-3 left-3 z-40 w-[min(18rem,calc(100%-1.5rem))] rounded-xl border p-3 shadow-xl"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Fechar">
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-muted-foreground mb-1.5 text-xs">Gravidade</p>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Gravidade">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={damage.severity === s}
            onClick={() => onChange({ ...damage, severity: s })}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
              damage.severity === s ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: SEVERITY_COLOR[s] }} />
            {SEVERITY_LABEL[s]}
          </button>
        ))}
      </div>
      <label className="text-muted-foreground mt-3 mb-1.5 block text-xs" htmlFor="damage-note">
        Observação (opcional)
      </label>
      <Textarea
        id="damage-note"
        rows={2}
        maxLength={300}
        placeholder="Ex.: amassado na parte inferior"
        value={damage.note ?? ""}
        onChange={(e) => onChange({ ...damage, note: e.target.value })}
        className="text-sm"
      />
      <div className="mt-3 flex justify-between">
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          Remover dano
        </Button>
        <Button type="button" size="sm" onClick={onClose}>
          Concluir
        </Button>
      </div>
    </div>
  );
}
