"use client";

import type { VehicleType } from "@prisma/client";
import { useState } from "react";
import { VehicleViewer, type ViewerMode } from "@/components/vehicle-3d";
import { Button } from "@/components/ui/button";
import type { DamageLike, QuoteItemLike } from "@/domain/part-status";

const SAMPLE_ITEMS: Record<VehicleType, QuoteItemLike[]> = {
  CARRO: [
    { partKey: "parachoque_dianteiro", action: "TROCAR", partPrice: 140_000, laborPrice: 30_000, coverage: "COBERTO" },
    { partKey: "capo", action: "REPARAR", partPrice: 0, laborPrice: 55_000, coverage: "COBERTO" },
    { partKey: "farol_esq", action: "TROCAR", partPrice: 115_000, laborPrice: 10_000, coverage: "PENDENTE" },
    { partKey: "paralama_dianteiro_esq", action: "PINTAR", partPrice: 0, laborPrice: 40_000, coverage: "NAO_COBERTO", insurerNote: "Dano preexistente" },
  ],
  MOTO: [
    { partKey: "carenagem_esq", action: "TROCAR", partPrice: 48_000, laborPrice: 9_000, coverage: "COBERTO" },
    { partKey: "tanque", action: "PINTAR", partPrice: 0, laborPrice: 35_000, coverage: "COBERTO" },
    { partKey: "retrovisor_esq", action: "TROCAR", partPrice: 6_000, laborPrice: 1_500, coverage: "NAO_COBERTO" },
  ],
};

const SAMPLE_DAMAGES: Record<VehicleType, DamageLike[]> = {
  CARRO: [{ partKey: "porta_dianteira_esq", severity: "LEVE", note: "Risco" }],
  MOTO: [{ partKey: "guidao", severity: "GRAVE", note: "Torto" }],
};

export function LabClient() {
  const [type, setType] = useState<VehicleType>("CARRO");
  const [mode, setMode] = useState<ViewerMode>("view");
  const [color, setColor] = useState("#9aa3ad");
  const [damages, setDamages] = useState<DamageLike[]>([]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle value={type} options={[["CARRO", "Carro"], ["MOTO", "Moto"]]} onChange={(v) => { setType(v); setDamages([]); }} />
        <Toggle value={mode} options={[["view", "Modo view"], ["select", "Modo select"]]} onChange={setMode} />
        <label className="flex items-center gap-2 text-sm">
          Cor
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded border bg-transparent" />
        </label>
      </div>
      {mode === "view" ? (
        <VehicleViewer type={type} color={color} mode="view" damages={SAMPLE_DAMAGES[type]} items={SAMPLE_ITEMS[type]} />
      ) : (
        <>
          <VehicleViewer type={type} color={color} mode="select" damages={damages} onDamagesChange={setDamages} />
          <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">{JSON.stringify(damages, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border p-0.5">
      {options.map(([v, label]) => (
        <Button key={v} size="sm" variant={value === v ? "secondary" : "ghost"} onClick={() => onChange(v)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
