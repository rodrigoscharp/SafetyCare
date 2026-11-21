import type { VehicleType } from "@prisma/client";
import { CylinderGeometry, ExtrudeGeometry, Shape, TorusGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MaterialKind, MeshSpec, PartMeshSpec, VehicleModel, VehicleModelProvider } from "./model-provider";

type Range = [number, number];

/** Caixa arredondada definida por intervalos em x/y/z. */
function box(x: Range, y: Range, z: Range, material: MaterialKind, radius = 0.04): MeshSpec {
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const d = z[1] - z[0];
  const r = Math.min(radius, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  return {
    geometry: new RoundedBoxGeometry(w, h, d, 3, Math.max(r, 0.002)),
    position: [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2],
    material,
  };
}

/** Painel inclinado entre dois pontos do plano XY (para-brisa, vidro traseiro). */
function slanted(a: [number, number], b: [number, number], width: number, thickness: number, material: MaterialKind): MeshSpec {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  // desloca levemente para fora da cabine, na direção da normal
  const nx = -Math.sin(angle) * (thickness / 2 + 0.005);
  const ny = Math.cos(angle) * (thickness / 2 + 0.005);
  const sign = ny < 0 ? -1 : 1;
  return {
    geometry: new RoundedBoxGeometry(len, thickness, width, 2, Math.min(0.02, thickness / 2 - 0.001)),
    position: [(a[0] + b[0]) / 2 + nx * sign, (a[1] + b[1]) / 2 + ny * sign, 0],
    rotation: [0, 0, angle],
    material,
  };
}

/** Cilindro com eixo em Z (rodas, cubos) ou X (escapamento, farol de moto). */
function cylinder(
  center: [number, number, number],
  radius: number,
  length: number,
  axis: "x" | "z",
  material: MaterialKind,
  segments = 28,
): MeshSpec {
  return {
    geometry: new CylinderGeometry(radius, radius, length, segments),
    position: center,
    rotation: axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2],
    material,
  };
}

const part = (key: string, spec: MeshSpec): PartMeshSpec => ({ key, ...spec });

function buildCar(): VehicleModel {
  const sideR: Range = [0.8, 0.875];
  const sideL: Range = [-0.875, -0.8];
  const wheelZ = 0.79;

  const cabin = new Shape();
  cabin.moveTo(1.18, 0.9);
  cabin.lineTo(0.42, 1.36);
  cabin.lineTo(-0.72, 1.36);
  cabin.lineTo(-1.38, 0.9);
  cabin.closePath();
  const cabinGeo = new ExtrudeGeometry(cabin, { depth: 1.46, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  cabinGeo.translate(0, 0, -0.73);

  const parts: PartMeshSpec[] = [
    part("parachoque_dianteiro", box([1.96, 2.17], [0.24, 0.62], [-0.88, 0.88], "body", 0.09)),
    part("parachoque_traseiro", box([-2.17, -1.96], [0.24, 0.62], [-0.88, 0.88], "body", 0.09)),
    part("capo", { ...box([1.18, 2.0], [0.89, 0.95], [-0.79, 0.79], "body", 0.025), rotation: [0, 0, -0.045] }),
    part("tampa_porta_malas", box([-1.99, -1.38], [0.89, 0.95], [-0.79, 0.79], "body", 0.025)),
    part("teto", box([-0.72, 0.42], [1.355, 1.42], [-0.75, 0.75], "body", 0.03)),
    part("parabrisa", slanted([1.17, 0.92], [0.43, 1.37], 1.42, 0.03, "glass")),
    part("vidro_traseiro", slanted([-0.73, 1.37], [-1.37, 0.92], 1.42, 0.03, "glass")),

    part("paralama_dianteiro_dir", box([1.18, 1.97], [0.66, 0.9], sideR, "body", 0.03)),
    part("paralama_dianteiro_esq", box([1.18, 1.97], [0.66, 0.9], sideL, "body", 0.03)),
    part("paralama_traseiro_dir", box([-1.97, -0.95], [0.66, 0.9], sideR, "body", 0.03)),
    part("paralama_traseiro_esq", box([-1.97, -0.95], [0.66, 0.9], sideL, "body", 0.03)),
    part("porta_dianteira_dir", box([0.12, 1.15], [0.36, 0.9], sideR, "body", 0.03)),
    part("porta_dianteira_esq", box([0.12, 1.15], [0.36, 0.9], sideL, "body", 0.03)),
    part("porta_traseira_dir", box([-0.92, 0.09], [0.36, 0.9], sideR, "body", 0.03)),
    part("porta_traseira_esq", box([-0.92, 0.09], [0.36, 0.9], sideL, "body", 0.03)),

    part("farol_dir", box([1.99, 2.06], [0.7, 0.82], [0.42, 0.76], "headlight", 0.025)),
    part("farol_esq", box([1.99, 2.06], [0.7, 0.82], [-0.76, -0.42], "headlight", 0.025)),
    part("lanterna_dir", box([-2.06, -1.99], [0.7, 0.82], [0.46, 0.78], "taillight", 0.025)),
    part("lanterna_esq", box([-2.06, -1.99], [0.7, 0.82], [-0.78, -0.46], "taillight", 0.025)),
    part("retrovisor_dir", box([0.98, 1.12], [0.98, 1.1], [0.9, 1.06], "body", 0.03)),
    part("retrovisor_esq", box([0.98, 1.12], [0.98, 1.1], [-1.06, -0.9], "body", 0.03)),

    part("roda_dianteira_dir", cylinder([1.35, 0.34, wheelZ], 0.34, 0.25, "z", "tire")),
    part("roda_dianteira_esq", cylinder([1.35, 0.34, -wheelZ], 0.34, 0.25, "z", "tire")),
    part("roda_traseira_dir", cylinder([-1.35, 0.34, wheelZ], 0.34, 0.25, "z", "tire")),
    part("roda_traseira_esq", cylinder([-1.35, 0.34, -wheelZ], 0.34, 0.25, "z", "tire")),
  ];

  const decor: MeshSpec[] = [
    box([-2.0, 2.0], [0.3, 0.9], [-0.8, 0.8], "body", 0.12),
    box([-1.9, 1.9], [0.16, 0.32], [-0.72, 0.72], "dark", 0.05),
    { geometry: cabinGeo, position: [0, 0, 0], material: "glass" },
    box([2.0, 2.04], [0.46, 0.62], [-0.38, 0.38], "dark", 0.02), // grade
    ...[1.35, -1.35].flatMap((x) =>
      [wheelZ, -wheelZ].map((z) => cylinder([x, 0.34, z + Math.sign(z) * 0.005], 0.2, 0.255, "z", "chrome", 20)),
    ),
  ];

  return { parts, decor, camera: { position: [5.2, 2.6, -5.6], target: [0, 0.6, 0], minDistance: 4, maxDistance: 11 } };
}

function buildMoto(): VehicleModel {
  const rFront = 0.3;
  const fx = 0.74;
  const rx = -0.7;

  const fender = (x: number, rotZ: number): MeshSpec => {
    const g = new TorusGeometry(rFront + 0.06, 0.035, 10, 24, Math.PI * 0.62);
    g.scale(1, 1, 2.2);
    return { geometry: g, position: [x, rFront, 0], rotation: [0, 0, rotZ], material: "body" };
  };

  const parts: PartMeshSpec[] = [
    part("roda_dianteira", cylinder([fx, rFront, 0], rFront, 0.11, "z", "tire")),
    part("roda_traseira", cylinder([rx, rFront, 0], rFront, 0.13, "z", "tire")),
    part("paralama_dianteiro", fender(fx, Math.PI * 0.2)),
    part("paralama_traseiro", fender(rx, Math.PI * 0.25)),
    part("tanque", { ...box([0.02, 0.5], [0.76, 0.98], [-0.17, 0.17], "body", 0.09), rotation: [0, 0, 0.12] }),
    part("banco", box([-0.6, 0.04], [0.8, 0.88], [-0.13, 0.13], "seat", 0.04)),
    part("carenagem_dir", { ...box([-0.45, 0.3], [0.56, 0.78], [0.15, 0.19], "body", 0.02), rotation: [0, 0, 0.08] }),
    part("carenagem_esq", { ...box([-0.45, 0.3], [0.56, 0.78], [-0.19, -0.15], "body", 0.02), rotation: [0, 0, 0.08] }),
    part("farol", cylinder([0.66, 1.0, 0], 0.085, 0.08, "x", "headlight")),
    part("lanterna", box([-0.8, -0.74], [0.84, 0.9], [-0.07, 0.07], "taillight", 0.015)),
    part("guidao", cylinder([0.5, 1.14, 0], 0.022, 0.72, "z", "chrome", 12)),
    part("retrovisor_dir", box([0.46, 0.54], [1.24, 1.3], [0.28, 0.38], "dark", 0.02)),
    part("retrovisor_esq", box([0.46, 0.54], [1.24, 1.3], [-0.38, -0.28], "dark", 0.02)),
    part("escapamento", { ...cylinder([-0.4, 0.4, 0.2], 0.05, 0.65, "x", "chrome", 16), rotation: [0, 0, Math.PI / 2 - 0.18] }),
  ];

  const forkLen = Math.hypot(0.5 - fx, 1.12 - rFront);
  const forkAngle = Math.atan2(1.12 - rFront, 0.5 - fx) - Math.PI / 2;
  const frameLen = Math.hypot(0.5 - rx, 0.95 - rFront);
  const frameAngle = Math.atan2(0.95 - rFront, 0.5 - rx) - Math.PI / 2;

  const decor: MeshSpec[] = [
    ...[0.07, -0.07].map<MeshSpec>((z) => ({
      geometry: new CylinderGeometry(0.022, 0.022, forkLen, 12),
      position: [(fx + 0.5) / 2, (rFront + 1.12) / 2, z],
      rotation: [0, 0, forkAngle],
      material: "chrome",
    })),
    {
      geometry: new CylinderGeometry(0.03, 0.03, frameLen, 12),
      position: [(0.5 + rx) / 2, (0.95 + rFront) / 2, 0],
      rotation: [0, 0, frameAngle],
      material: "dark",
    },
    box([-0.12, 0.32], [0.3, 0.6], [-0.13, 0.13], "dark", 0.04), // motor
    cylinder([fx, rFront, 0], 0.12, 0.115, "z", "chrome", 18),
    cylinder([rx, rFront, 0], 0.12, 0.135, "z", "chrome", 18),
  ];

  return { parts, decor, camera: { position: [2.2, 1.3, -2.7], target: [0, 0.6, 0], minDistance: 1.6, maxDistance: 6 } };
}

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
