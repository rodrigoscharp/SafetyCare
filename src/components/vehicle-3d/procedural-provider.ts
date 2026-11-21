import type { VehicleType } from "@prisma/client";
import type { VehicleModel, VehicleModelProvider } from "./model-provider";
import { buildCar } from "./procedural-car";
import { buildMoto } from "./procedural-moto";

const cache = new Map<VehicleType, VehicleModel>();

export const proceduralProvider: VehicleModelProvider = {
  id: "procedural",
  getModel(type) {
    let model = cache.get(type);
    if (!model) {
      model = type === "CARRO" ? buildCar() : buildMoto();
      cache.set(type, model);
    }
    return model;
  },
};

/**
 * Posição inicial da câmera voltada para as peças afetadas (centroide no plano XZ).
 * Sem peças afetadas, usa a câmera padrão do modelo.
 */
export function focusCamera(model: VehicleModel, keys: readonly string[]): [number, number, number] {
  const pts = model.parts.filter((p) => keys.includes(p.key)).map((p) => p.position);
  const [dx, dy, dz] = model.camera.position;
  if (!pts.length) return [dx, dy, dz];
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cz = pts.reduce((a, p) => a + p[2], 0) / pts.length;
  // vista diagonal: mantém um lado visível mesmo quando o dano é só na frente/traseira
  const vx = Math.abs(cx) < 0.15 ? dx : cx;
  const vz = Math.abs(cz) < 0.15 ? -Math.abs(vx) * 0.9 : cz * 3;
  const len = Math.hypot(vx, vz) || 1;
  const dist = Math.hypot(dx, dz);
  return [(vx / len) * dist, dy, (vz / len) * dist];
}

export type ViewPreset = "danos" | "frente" | "esquerda" | "traseira" | "direita" | "topo";

/** Posições de câmera das vistas prontas (frente = +X, esquerda = -Z). */
export function presetCamera(model: VehicleModel, preset: Exclude<ViewPreset, "danos">): [number, number, number] {
  const [dx, , dz] = model.camera.position;
  const d = Math.hypot(dx, dz);
  const [, ty] = model.camera.target;
  switch (preset) {
    case "frente":
      return [d, ty + d * 0.18, 0];
    case "traseira":
      return [-d, ty + d * 0.18, 0];
    case "esquerda":
      return [0, ty + d * 0.18, -d];
    case "direita":
      return [0, ty + d * 0.18, d];
    case "topo":
      return [0, d * 1.5, -0.001];
  }
}
