import { type BufferGeometry, CylinderGeometry, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  arcPoints,
  clipPolygon,
  extrudeCentered,
  merge,
  mirrorZ,
  rimGeometry,
  spec,
  stripBelow,
  tireGeometry,
  trapezoidPanel,
  type P,
  type V3,
} from "./geometry";
import type { MaterialKind, MeshSpec, PartMeshSpec, VehicleModel } from "./model-provider";

/*
 * Hatch compacto procedural. Eixos: X = frente, Y = cima, Z = direita (esquerda = -Z).
 * Tudo nasce de uma silhueta lateral; portas, para-lamas e para-choques são recortes dela,
 * por isso acompanham o desenho do carro (caixas de roda, capô inclinado, linha de cintura).
 */

const WHEEL_X = 1.3;
const WHEEL_R = 0.335;
const WHEEL_Y = WHEEL_R;
const ARCH_R = 0.43;
const TRACK = 0.79;
const BODY_DEPTH = 1.62; // largura da extrusão antes do arredondamento
const BEVEL = 0.075;
const SIDE_Z = BODY_DEPTH / 2 + BEVEL; // face lateral da carroceria

/** Silhueta lateral da carroceria (sem a cabine). */
function silhouette(): P[] {
  return [
    [2.05, 0.24],
    [2.15, 0.3],
    [2.2, 0.44],
    [2.19, 0.6],
    [2.14, 0.7],
    [2.04, 0.77],
    [1.9, 0.81],
    [1.6, 0.865],
    [1.3, 0.915],
    [1.08, 0.945],
    [0.6, 0.965],
    [0, 0.975],
    [-0.8, 0.985],
    [-1.45, 0.99],
    [-1.75, 0.975],
    [-1.98, 0.94],
    [-2.12, 0.88],
    [-2.19, 0.74],
    [-2.21, 0.52],
    [-2.17, 0.34],
    [-2.06, 0.24],
    [-1.74, 0.24],
    ...arcPoints(-WHEEL_X, WHEEL_Y, ARCH_R, Math.PI, 0, 16),
    [-0.87, 0.24],
    [0.87, 0.24],
    ...arcPoints(WHEEL_X, WHEEL_Y, ARCH_R, Math.PI, 0, 16),
    [1.74, 0.24],
  ];
}

/** Cabine (vidros laterais) vista de lado. */
const GREENHOUSE: P[] = [
  [1.08, 0.93],
  [0.34, 1.4],
  [0, 1.43],
  [-0.5, 1.43],
  [-0.84, 1.4],
  [-1.47, 0.97],
];

const both = (fn: (side: 1 | -1, suffix: "dir" | "esq") => PartMeshSpec): PartMeshSpec[] => [fn(1, "dir"), fn(-1, "esq")];

function sidePanel(key: string, side: 1 | -1, xMin: number, xMax: number, yMin: number, yMax: number): PartMeshSpec {
  const pts = clipPolygon(silhouette(), xMin, xMax, yMin, yMax);
  const g = extrudeCentered(pts, 0.012, 0.012, 2);
  return { key, ...spec(g, "body", [0, 0, side * (SIDE_Z + 0.008)]) };
}

function mirrored(g: () => BufferGeometry, side: 1 | -1) {
  const geo = g();
  return side === -1 ? mirrorZ(geo) : geo;
}

export function buildCar(): VehicleModel {
  const sil = silhouette();
  const parts: PartMeshSpec[] = [];

  // Para-choques: recortes da frente/traseira, envolvendo toda a largura
  parts.push({ key: "parachoque_dianteiro", ...spec(extrudeCentered(clipPolygon(sil, 1.9, 2.4, 0.2, 0.62), BODY_DEPTH + 0.02, 0.085, 4), "body") });
  parts.push({ key: "parachoque_traseiro", ...spec(extrudeCentered(clipPolygon(sil, -2.4, -1.92, 0.2, 0.64), BODY_DEPTH + 0.02, 0.085, 4), "body") });

  // Laterais
  parts.push(...both((s, n) => sidePanel(`paralama_dianteiro_${n}`, s, 1.03, 1.95, 0.27, 0.93)));
  parts.push(...both((s, n) => sidePanel(`porta_dianteira_${n}`, s, 0.02, 1.0, 0.27, 0.95)));
  parts.push(...both((s, n) => sidePanel(`porta_traseira_${n}`, s, -0.97, -0.01, 0.27, 0.96)));
  parts.push(...both((s, n) => sidePanel(`paralama_traseiro_${n}`, s, -1.95, -1.0, 0.27, 0.95)));

  // Capô, tampa e teto: faixas que seguem a linha superior
  parts.push({
    key: "capo",
    ...spec(extrudeCentered(stripBelow([[1.92, 0.808], [1.6, 0.868], [1.3, 0.918], [1.1, 0.946]], 0.035), 1.5, 0.03, 3), "body", [0, 0.012, 0]),
  });
  parts.push({
    key: "tampa_porta_malas",
    ...spec(extrudeCentered(stripBelow([[-1.49, 0.992], [-1.75, 0.977], [-1.97, 0.942], [-2.1, 0.885]], 0.035), 1.5, 0.03, 3), "body", [0, 0.012, 0]),
  });
  parts.push({
    key: "teto",
    ...spec(extrudeCentered(stripBelow([[0.32, 1.405], [0, 1.435], [-0.5, 1.435], [-0.82, 1.405]], 0.04), 1.22, 0.035, 3), "body", [0, 0.015, 0]),
  });

  // Vidros (afinam em direção ao teto)
  parts.push({ key: "parabrisa", ...spec(trapezoidPanel([1.06, 0.95], [0.38, 1.385], 1.4, 1.18, 0.012, 0.012), "glass") });
  parts.push({ key: "vidro_traseiro", ...spec(trapezoidPanel([-1.44, 0.985], [-0.86, 1.385], 1.36, 1.16, 0.012, 0.012), "glass") });

  // Faróis (lente inclinada acompanhando o nariz) e lanternas (faixa na traseira)
  parts.push(
    ...both((s, n) => {
      const g = new RoundedBoxGeometry(0.2, 0.085, 0.38, 3, 0.03);
      g.rotateZ(-0.42);
      g.rotateY(s * 0.18);
      return { key: `farol_${n}`, geometry: g, position: [2.08, 0.725, s * 0.56] as V3, material: "headlight" };
    }),
  );
  parts.push(
    ...both((s, n) => {
      const g = new RoundedBoxGeometry(0.06, 0.1, 0.42, 3, 0.025);
      g.rotateZ(0.5);
      g.rotateY(-s * 0.15);
      return { key: `lanterna_${n}`, geometry: g, position: [-2.13, 0.83, s * 0.56] as V3, material: "taillight" };
    }),
  );

  // Retrovisores: carcaça em gota sobre a porta dianteira
  parts.push(
    ...both((s, n) => {
      const geo = mirrored(() => {
        const head = new SphereGeometry(0.1, 20, 14);
        head.scale(0.9, 0.62, 1.15);
        head.translate(0, 0, 0.1);
        const arm = new RoundedBoxGeometry(0.09, 0.03, 0.1, 2, 0.012);
        arm.translate(0.02, -0.03, 0);
        return merge([head, arm]);
      }, s);
      return { key: `retrovisor_${n}`, ...spec(geo, "body", [0.96, 1.02, s * (SIDE_Z + 0.02)]) };
    }),
  );

  // Pneus (perfil arredondado)
  for (const [x, nx] of [
    [WHEEL_X, "dianteira"],
    [-WHEEL_X, "traseira"],
  ] as const) {
    parts.push(
      ...both((s, n) => ({
        key: `roda_${nx}_${n}`,
        geometry: tireGeometry(WHEEL_R, 0.215, 0.235),
        position: [x, WHEEL_Y, s * TRACK] as V3,
        material: "tire",
      })),
    );
  }

  const decor: MeshSpec[] = [];
  // Carroceria (núcleo) e cabine
  decor.push(spec(extrudeCentered(sil, BODY_DEPTH, BEVEL, 5), "body"));
  decor.push(spec(extrudeCentered(GREENHOUSE, 1.24, 0.07, 5), "glass", [0, 0, 0]));
  // Colunas B e C na cor da carroceria, sobre os vidros laterais
  for (const s of [1, -1]) {
    decor.push(spec(extrudeCentered([[0.08, 0.97], [0.14, 0.97], [0.06, 1.41], [-0.02, 1.41]], 0.01, 0.01, 2), "body", [0, 0, s * 0.695]));
    decor.push(spec(extrudeCentered([[-1.1, 0.98], [-0.94, 0.98], [-0.74, 1.4], [-0.86, 1.4]], 0.01, 0.01, 2), "body", [0, 0, s * 0.695]));
  }
  // Colunas (molduras escuras das janelas) e soleira
  decor.push(spec(extrudeCentered(stripBelow([[1.0, 0.985], [0, 1.0], [-1.4, 1.0]], 0.03), 1.42, 0.02), "dark"));
  decor.push(spec(extrudeCentered(clipPolygon(sil, -0.9, 0.9, 0.2, 0.33), BODY_DEPTH + 0.04, 0.04), "dark"));
  // Grade, entrada de ar inferior, placas e assoalho
  decor.push({ geometry: new RoundedBoxGeometry(0.05, 0.15, 0.82, 3, 0.03), position: [2.17, 0.6, 0], material: "dark" });
  decor.push({ geometry: new RoundedBoxGeometry(0.05, 0.1, 1.1, 3, 0.03), position: [2.2, 0.36, 0], material: "dark" });
  decor.push({ geometry: new RoundedBoxGeometry(0.02, 0.11, 0.36, 2, 0.01), position: [2.215, 0.46, 0], material: "plate" });
  decor.push({ geometry: new RoundedBoxGeometry(0.02, 0.11, 0.36, 2, 0.01), position: [-2.225, 0.58, 0], material: "plate" });
  decor.push({ geometry: new RoundedBoxGeometry(3.9, 0.08, 1.5, 2, 0.03), position: [0, 0.2, 0], material: "dark" });
  // Maçanetas
  for (const x of [0.62, -0.38]) {
    for (const s of [1, -1]) {
      decor.push({ geometry: new RoundedBoxGeometry(0.16, 0.025, 0.03, 2, 0.01), position: [x, 0.86, s * (SIDE_Z + 0.03)], material: "chrome" });
    }
  }
  // Aros, discos de freio e pinças
  const rim = rimGeometry(0.205, 0.2);
  for (const x of [WHEEL_X, -WHEEL_X]) {
    for (const s of [1, -1] as const) {
      const r = s === -1 ? mirrorZ(rim) : rim.clone();
      decor.push({ geometry: r, position: [x, WHEEL_Y, s * TRACK], material: "chrome" });
      const disc = new CylinderGeometry(0.16, 0.16, 0.025, 32);
      disc.rotateX(Math.PI / 2);
      decor.push({ geometry: disc, position: [x, WHEEL_Y, s * (TRACK - 0.05)], material: "dark" });
    }
  }

  return {
    parts,
    decor,
    camera: { position: [5.2, 2.4, -5.6], target: [0, 0.62, 0], minDistance: 3.6, maxDistance: 11 },
  };
}

export type { MaterialKind };
