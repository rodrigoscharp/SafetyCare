import { CylinderGeometry, LatheGeometry, SphereGeometry, TorusGeometry, Vector2 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { extrudeCentered, merge, mirrorZ, rimGeometry, spec, tireGeometry, tube, type V3 } from "./geometry";
import type { MeshSpec, PartMeshSpec, VehicleModel } from "./model-provider";

/*
 * Moto street (estilo CG/Titan) procedural. Eixos: X = frente, Y = cima, Z = direita.
 */

const R = 0.3;
const FX = 0.74; // eixo dianteiro
const RX = -0.7; // eixo traseiro
const HEAD: V3 = [0.5, 1.02, 0]; // caixa de direção

function fender(x: number, startDeg: number, lengthDeg: number, width: number): ReturnType<typeof spec> {
  const g = new TorusGeometry(R + 0.06, 0.028, 10, 36, (lengthDeg * Math.PI) / 180);
  g.scale(1, 1, width / 0.056);
  g.rotateZ((startDeg * Math.PI) / 180);
  return spec(g, "body", [x, R, 0]);
}

export function buildMoto(): VehicleModel {
  const parts: PartMeshSpec[] = [];

  parts.push({ key: "roda_dianteira", geometry: tireGeometry(R, 0.235, 0.1, 48), position: [FX, R, 0], material: "tire" });
  parts.push({ key: "roda_traseira", geometry: tireGeometry(R, 0.235, 0.12, 48), position: [RX, R, 0], material: "tire" });
  parts.push({ key: "paralama_dianteiro", ...fender(FX, 20, 130, 0.13) });
  parts.push({ key: "paralama_traseiro", ...fender(RX, 30, 110, 0.15) });

  // Tanque em gota, bem arredondado
  parts.push({
    key: "tanque",
    ...spec(
      extrudeCentered(
        [
          [0.02, 0.79],
          [0.06, 0.92],
          [0.2, 1.0],
          [0.38, 1.01],
          [0.5, 0.95],
          [0.48, 0.84],
          [0.34, 0.78],
        ],
        0.2,
        0.075,
        6,
      ),
      "body",
    ),
  });

  // Banco com leve degrau para o garupa
  parts.push({
    key: "banco",
    ...spec(
      extrudeCentered(
        [
          [-0.66, 0.84],
          [-0.64, 0.9],
          [-0.32, 0.91],
          [-0.22, 0.88],
          [0.0, 0.9],
          [0.06, 0.84],
        ],
        0.16,
        0.045,
        5,
      ),
      "seat",
    ),
  });

  // Carenagens laterais (tampas sob o banco)
  for (const [s, n] of [
    [1, "dir"],
    [-1, "esq"],
  ] as const) {
    const g = extrudeCentered(
      [
        [-0.5, 0.6],
        [-0.02, 0.58],
        [0.06, 0.74],
        [-0.12, 0.83],
        [-0.52, 0.82],
      ],
      0.012,
      0.014,
      3,
    );
    parts.push({ key: `carenagem_${n}`, ...spec(g, "body", [0, 0, s * 0.14]) });
  }

  // Farol: concha + lente
  const bowl = new LatheGeometry(
    [new Vector2(0, -0.06), new Vector2(0.07, -0.05), new Vector2(0.095, 0.0), new Vector2(0.095, 0.03), new Vector2(0, 0.035)],
    32,
  );
  bowl.rotateZ(-Math.PI / 2);
  parts.push({ key: "farol", ...spec(bowl, "headlight", [0.66, 1.0, 0]) });

  // Lanterna
  parts.push({ key: "lanterna", geometry: new RoundedBoxGeometry(0.05, 0.06, 0.14, 2, 0.02), position: [-0.8, 0.88, 0], material: "taillight" });

  // Guidão curvado
  parts.push({
    key: "guidao",
    ...spec(
      tube(
        [
          [0.44, 1.14, -0.36],
          [0.5, 1.14, -0.22],
          [0.53, 1.12, 0],
          [0.5, 1.14, 0.22],
          [0.44, 1.14, 0.36],
        ],
        0.017,
        40,
      ),
      "chrome",
    ),
  });

  // Retrovisores: haste + espelho
  const mirror = () => {
    const stem = tube(
      [
        [0.5, 1.14, 0.26],
        [0.5, 1.24, 0.3],
        [0.48, 1.32, 0.34],
      ],
      0.008,
      12,
    );
    const head = new SphereGeometry(0.06, 18, 12);
    head.scale(0.4, 0.75, 1.15);
    head.translate(0.48, 1.34, 0.36);
    return merge([stem, head]);
  };
  parts.push({ key: "retrovisor_dir", ...spec(mirror(), "dark") });
  parts.push({ key: "retrovisor_esq", ...spec(mirrorZ(mirror()), "dark") });

  // Escapamento: curva + abafador
  const muffler = new LatheGeometry(
    [new Vector2(0, -0.22), new Vector2(0.045, -0.2), new Vector2(0.055, -0.1), new Vector2(0.055, 0.14), new Vector2(0.04, 0.22), new Vector2(0, 0.23)],
    24,
  );
  muffler.rotateZ(Math.PI / 2 + 0.12);
  muffler.translate(-0.52, 0.5, 0.17);
  const pipe = tube(
    [
      [0.18, 0.5, 0.06],
      [0.2, 0.3, 0.12],
      [0.0, 0.24, 0.16],
      [-0.3, 0.34, 0.17],
      [-0.34, 0.42, 0.17],
    ],
    0.022,
    40,
  );
  parts.push({ key: "escapamento", ...spec(merge([pipe, muffler]), "chrome") });

  const decor: MeshSpec[] = [];
  // Aros
  decor.push({ geometry: rimGeometry(0.235, 0.07, 6), position: [FX, R, 0], material: "chrome" });
  decor.push({ geometry: rimGeometry(0.235, 0.08, 6), position: [RX, R, 0], material: "chrome" });
  // Garfo (duas bengalas)
  for (const z of [0.065, -0.065]) {
    decor.push(spec(tube([[FX, R, z], [(FX + HEAD[0]) / 2, (R + HEAD[1]) / 2, z], [HEAD[0], HEAD[1] + 0.06, z]], 0.022, 16), "chrome"));
  }
  // Quadro, balança e chassi
  decor.push(spec(tube([HEAD, [0.2, 0.86, 0], [-0.3, 0.78, 0], [-0.78, 0.84, 0]], 0.028, 40), "dark"));
  decor.push(spec(tube([HEAD, [0.42, 0.6, 0], [0.24, 0.34, 0], [0.0, 0.32, 0]], 0.026, 30), "dark"));
  for (const z of [0.08, -0.08]) {
    decor.push(spec(tube([[RX, R, z], [-0.35, 0.4, z], [-0.05, 0.44, z]], 0.022, 20), "dark"));
  }
  // Motor: cárter + cilindro com aletas
  decor.push({ geometry: new RoundedBoxGeometry(0.34, 0.2, 0.22, 3, 0.05), position: [0.02, 0.4, 0], material: "metal" });
  const fins: CylinderGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const f = new CylinderGeometry(0.085, 0.085, 0.012, 24);
    f.translate(0, i * 0.026, 0);
    fins.push(f);
  }
  const block = merge(fins);
  block.rotateZ(0.5);
  decor.push({ ...spec(block, "metal", [0.12, 0.55, 0]) });
  // Painel e cubo do guidão
  decor.push({ geometry: new SphereGeometry(0.055, 18, 12), position: [0.5, 1.18, 0], material: "dark" });

  return {
    parts,
    decor,
    camera: { position: [2.2, 1.3, -2.7], target: [0, 0.62, 0], minDistance: 1.6, maxDistance: 6 },
  };
}
