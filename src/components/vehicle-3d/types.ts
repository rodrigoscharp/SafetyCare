import type { VehicleType } from "@prisma/client";
import type { DamageLike, QuoteItemLike } from "@/domain/part-status";

export type ViewerMode = "select" | "view";

export type VehicleViewerProps = {
  type: VehicleType;
  /** Cor da carroceria (hex) */
  color?: string;
  damages?: readonly DamageLike[];
  items?: readonly QuoteItemLike[];
  mode: ViewerMode;
  /** Modo select: recebe a lista de danos atualizada */
  onDamagesChange?: (damages: DamageLike[]) => void;
  /** Modo view: torna as peças clicáveis (ex.: oficina adiciona item ao orçamento) */
  onPartClick?: (partKey: string) => void;
  /** Rótulo do clique no modo view, exibido na dica (ex.: "Clique para adicionar ao orçamento") */
  clickHint?: string;
  className?: string;
};
