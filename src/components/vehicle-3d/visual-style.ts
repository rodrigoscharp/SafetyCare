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

type MaterialBase = {
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  emissive?: string;
};

export function baseMaterial(kind: MaterialKind, bodyColor: string): MaterialBase {
  switch (kind) {
    case "body":
      // pintura metálica com verniz
      return { color: bodyColor, roughness: 0.3, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 };
    case "glass":
      return { color: "#0b1220", roughness: 0.04, metalness: 0.85, opacity: 0.9, clearcoat: 1, clearcoatRoughness: 0 };
    case "headlight":
      return { color: "#f4f7fb", roughness: 0.05, metalness: 0.6, emissive: "#cfe0ff", clearcoat: 1, clearcoatRoughness: 0 };
    case "taillight":
      return { color: "#b0121c", roughness: 0.12, metalness: 0.3, emissive: "#5a0408", clearcoat: 1, clearcoatRoughness: 0 };
    case "tire":
      return { color: "#17181b", roughness: 0.9, metalness: 0 };
    case "chrome":
      return { color: "#d9dde2", roughness: 0.14, metalness: 1 };
    case "metal":
      return { color: "#8b9096", roughness: 0.42, metalness: 0.85 };
    case "dark":
      return { color: "#202329", roughness: 0.55, metalness: 0.2, clearcoat: 0.3 };
    case "seat":
      return { color: "#1c1d21", roughness: 0.8, metalness: 0 };
    case "plate":
      return { color: "#eef1f5", roughness: 0.5, metalness: 0.1 };
  }
}
