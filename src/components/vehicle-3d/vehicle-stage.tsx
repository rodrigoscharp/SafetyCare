"use client";

import type { VehicleType } from "@prisma/client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { partLabel, partsFor } from "@/domain/parts";
import { partVisual, type DamageLike, type QuoteItemLike } from "@/domain/part-status";
import { PartTooltip } from "./part-tooltip";
import { focusCamera, proceduralProvider } from "./procedural-provider";
import type { PartRenderState } from "./vehicle-scene";

const VehicleScene = dynamic(() => import("./vehicle-scene"), { ssr: false, loading: () => null });

const EMPTY: readonly never[] = [];

/** Palco 3D enxuto para vitrines (site institucional): gira sozinho, hover mostra a peça, não prende a rolagem. */
export function VehicleStage({
  type,
  color,
  damages = EMPTY,
  items = EMPTY,
}: {
  type: VehicleType;
  color: string;
  damages?: readonly DamageLike[];
  items?: readonly QuoteItemLike[];
}) {
  const model = useMemo(() => proceduralProvider.getModel(type), [type]);
  const [hovered, setHovered] = useState<string | null>(null);
  const states = useMemo(() => {
    const out: Record<string, PartRenderState> = {};
    for (const p of partsFor(type)) {
      out[p.key] = { visual: partVisual(p.key, damages, items), severity: damages.find((d) => d.partKey === p.key)?.severity };
    }
    return out;
  }, [type, damages, items]);
  const [cameraPosition] = useState(() => focusCamera(model, items.map((i) => i.partKey)));

  return (
    <VehicleScene
      model={model}
      cameraPosition={cameraPosition}
      cameraRequest={null}
      autoRotate={!hovered}
      engaged={false}
      color={color}
      states={states}
      activeKey={hovered}
      selectedKey={null}
      clickable={false}
      tooltip={
        hovered ? (
          <PartTooltip
            label={partLabel(hovered)}
            damage={damages.find((d) => d.partKey === hovered)}
            item={items.find((i) => i.partKey === hovered)}
          />
        ) : null
      }
      onHover={setHovered}
      onPartClick={() => undefined}
      onMissed={() => setHovered(null)}
    />
  );
}
