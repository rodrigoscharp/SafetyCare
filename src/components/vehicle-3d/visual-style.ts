import type { Severity } from "@prisma/client";
import type { PartVisual } from "@/domain/part-status";
import type { MaterialKind } from "./model-provider";

/** Cores dos estados (3D, legenda e lista). */
export const VISUAL_COLOR: Record<Exclude<PartVisual, "INTACTA">, string> = {
  DANO: "#a855f7",
  TROCAR: "#e5484d",
  REPARAR: "#f5a524",
  PINTAR: "#3b82f6",
  NAO_COBERTO: "#8b929c",
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  LEVE: "#c4b5fd",
  MEDIO: "#a855f7",
  GRAVE: "#7e22ce",
};

export const OUTLINE_NOT_COVERED = "#ef4444";

type MaterialBase = { color: string; roughness: number; metalness: number; opacity?: number; clearcoat?: number; emissive?: string };

export function baseMaterial(kind: MaterialKind, bodyColor: string): MaterialBase {
  switch (kind) {
    case "body":
      return { color: bodyColor, roughness: 0.38, metalness: 0.35, clearcoat: 0.8 };
    case "glass":
      return { color: "#16202c", roughness: 0.08, metalness: 0.3, opacity: 0.82, clearcoat: 1 };
    case "headlight":
      return { color: "#e9eef5", roughness: 0.1, metalness: 0.4, emissive: "#9fb4cc", clearcoat: 1 };
    case "taillight":
      return { color: "#a3161f", roughness: 0.2, metalness: 0.2, emissive: "#3a0508", clearcoat: 1 };
    case "tire":
      return { color: "#1b1c1f", roughness: 0.85, metalness: 0.05 };
    case "chrome":
      return { color: "#c5cad0", roughness: 0.22, metalness: 0.95 };
    case "dark":
      return { color: "#2a2d33", roughness: 0.6, metalness: 0.3 };
    case "seat":
      return { color: "#232428", roughness: 0.75, metalness: 0.05 };
  }
}
