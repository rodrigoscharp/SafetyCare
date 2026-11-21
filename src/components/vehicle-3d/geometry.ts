import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Matrix4,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { MaterialKind, MeshSpec } from "./model-provider";

export type P = [number, number];
export type V3 = [number, number, number];

/** Pontos de um arco (centro, raio, ângulo inicial → final, em radianos). */
export function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n = 12): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Recorta um polígono (qualquer) por um retângulo (Sutherland–Hodgman). */
export function clipPolygon(poly: P[], xMin: number, xMax: number, yMin: number, yMax: number): P[] {
  type Edge = { inside: (p: P) => boolean; cut: (a: P, b: P) => P };
  const lerpX = (a: P, b: P, x: number): P => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
  const lerpY = (a: P, b: P, y: number): P => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];
  const edges: Edge[] = [
    { inside: (p) => p[0] >= xMin, cut: (a, b) => lerpX(a, b, xMin) },
    { inside: (p) => p[0] <= xMax, cut: (a, b) => lerpX(a, b, xMax) },
    { inside: (p) => p[1] >= yMin, cut: (a, b) => lerpY(a, b, yMin) },
    { inside: (p) => p[1] <= yMax, cut: (a, b) => lerpY(a, b, yMax) },
  ];
  let out = poly;
  for (const e of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const ci = e.inside(cur);
      const pi = e.inside(prev);
      if (ci) {
        if (!pi) out.push(e.cut(prev, cur));
        out.push(cur);
      } else if (pi) {
        out.push(e.cut(prev, cur));
      }
    }
    if (!out.length) break;
  }
  return out;
}

/** Faixa poligonal abaixo de uma linha (capô, teto, tampa): espessura para baixo. */
export function stripBelow(line: P[], thickness: number): P[] {
  return [...line, ...[...line].reverse().map(([x, y]) => [x, y - thickness] as P)];
}

export function shapeFrom(points: P[]): Shape {
  const s = new Shape();
  points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

/** Extrusão no eixo Z, centrada em z = 0. */
export function extrudeCentered(points: P[], depth: number, bevel = 0, segments = 3): ExtrudeGeometry {
  const g = new ExtrudeGeometry(shapeFrom(points), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    // mantém o contorno original: o arredondamento cresce para dentro, não para fora
    bevelOffset: -bevel,
    bevelSegments: segments,
    curveSegments: 12,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Recentraliza a geometria na origem e devolve a posição (para o hover escalar em torno do centro). */
export function centered(geometry: BufferGeometry, offset: V3 = [0, 0, 0]): { geometry: BufferGeometry; position: V3 } {
  geometry.computeBoundingBox();
  const c = new Vector3();
  geometry.boundingBox?.getCenter(c);
  geometry.translate(-c.x, -c.y, -c.z);
  return { geometry, position: [c.x + offset[0], c.y + offset[1], c.z + offset[2]] };
}

export function spec(geometry: BufferGeometry, material: MaterialKind, offset: V3 = [0, 0, 0]): MeshSpec {
  return { ...centered(geometry, offset), material };
}

/** Junta geometrias (convertendo para não indexadas, pois Extrude não tem índice). */
export function merge(geos: BufferGeometry[]): BufferGeometry {
  const prepared = geos.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g;
    // garante os mesmos atributos em todas
    for (const name of Object.keys(ng.attributes)) if (!["position", "normal", "uv"].includes(name)) ng.deleteAttribute(name);
    return ng;
  });
  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error("Falha ao juntar geometrias");
  return merged;
}

/**
 * Painel trapezoidal inclinado (para-brisa, vidro traseiro): base em `a`, topo em `b` (plano XY),
 * largura `w0` na base e `w1` no topo, empurrado `lift` para fora da cabine.
 */
export function trapezoidPanel(a: P, b: P, w0: number, w1: number, thickness: number, lift: number): BufferGeometry {
  const dir = new Vector3(b[0] - a[0], b[1] - a[1], 0);
  const len = dir.length();
  dir.normalize();
  const shape = shapeFrom([
    [-w0 / 2, 0],
    [w0 / 2, 0],
    [w1 / 2, len],
    [-w1 / 2, len],
  ]);
  const g = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
  // normal apontando para fora/cima da cabine
  let normal = new Vector3(-dir.y, dir.x, 0);
  if (normal.y < 0) normal = normal.negate();
  const basis = new Matrix4().makeBasis(new Vector3(0, 0, 1), dir, normal);
  g.applyMatrix4(basis);
  g.translate(a[0] + normal.x * lift, a[1] + normal.y * lift, 0);
  return g;
}

/** Pneu por revolução de um perfil arredondado; eixo Z. */
export function tireGeometry(rOuter: number, rInner: number, width: number, segments = 48): BufferGeometry {
  const h = width / 2;
  const sh = (rOuter - rInner) * 0.35;
  const profile = [
    new Vector2(rInner, -h * 0.92),
    new Vector2(rOuter - sh, -h),
    new Vector2(rOuter - sh * 0.25, -h * 0.85),
    new Vector2(rOuter, -h * 0.45),
    new Vector2(rOuter, h * 0.45),
    new Vector2(rOuter - sh * 0.25, h * 0.85),
    new Vector2(rOuter - sh, h),
    new Vector2(rInner, h * 0.92),
  ];
  const g = new LatheGeometry(profile, segments);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Aro de liga com raios (uma geometria só, material cromado); eixo Z, face externa em +Z. */
export function rimGeometry(radius: number, depth: number, spokes = 5): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const lip = new CylinderGeometry(radius, radius, depth * 0.35, 40, 1, true);
  lip.rotateX(Math.PI / 2);
  lip.translate(0, 0, depth * 0.3);
  parts.push(lip);
  const barrel = new CylinderGeometry(radius * 0.97, radius * 0.97, depth, 40, 1, true);
  barrel.rotateX(Math.PI / 2);
  parts.push(barrel);
  const hub = new CylinderGeometry(radius * 0.22, radius * 0.26, depth * 0.5, 20);
  hub.rotateX(Math.PI / 2);
  hub.translate(0, 0, depth * 0.3);
  parts.push(hub);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const spoke = new CylinderGeometry(radius * 0.07, radius * 0.11, radius * 0.78, 8);
    spoke.translate(0, radius * 0.5, 0);
    spoke.rotateZ(a);
    spoke.translate(0, 0, depth * 0.38);
    parts.push(spoke);
  }
  return merge(parts);
}

/** Tubo por pontos (escapamento, quadro, guidão). */
export function tube(points: V3[], radius: number, segments = 32): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  return new TubeGeometry(curve, segments, radius, 12, false);
}

/** Espelha no eixo Z corrigindo a ordem dos vértices (senão as faces ficam do avesso). */
export function mirrorZ(geometry: BufferGeometry): BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  g.applyMatrix4(new Matrix4().makeScale(1, 1, -1));
  for (const name of Object.keys(g.attributes)) {
    const attr = g.getAttribute(name);
    const size = attr.itemSize;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < attr.count; i += 3) {
      // troca o 2º e o 3º vértice de cada triângulo
      for (let k = 0; k < size; k++) {
        const a = (i + 1) * size + k;
        const b = (i + 2) * size + k;
        const t = arr[a];
        arr[a] = arr[b];
        arr[b] = t;
      }
    }
    attr.needsUpdate = true;
  }
  return g;
}
