import { describe, expect, it } from "vitest";
import { arcPoints, clipPolygon, stripBelow, type P } from "./geometry";

describe("geometria procedural", () => {
  it("recorta um polígono pelo retângulo", () => {
    const square: P[] = [[0, 0], [4, 0], [4, 4], [0, 4]];
    const clipped = clipPolygon(square, 1, 3, -1, 2);
    const xs = clipped.map((p) => p[0]);
    const ys = clipped.map((p) => p[1]);
    expect(Math.min(...xs)).toBe(1);
    expect(Math.max(...xs)).toBe(3);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(2);
  });

  it("devolve vazio quando não há interseção", () => {
    expect(clipPolygon([[0, 0], [1, 0], [1, 1]], 5, 6, 5, 6)).toEqual([]);
  });

  it("arco começa e termina nos ângulos pedidos", () => {
    const pts = arcPoints(0, 0, 1, Math.PI, 0, 4);
    expect(pts[0][0]).toBeCloseTo(-1);
    expect(pts.at(-1)?.[0]).toBeCloseTo(1);
    expect(pts[2][1]).toBeCloseTo(1);
  });

  it("faixa abaixo de uma linha tem o dobro de pontos", () => {
    expect(stripBelow([[0, 1], [1, 1]], 0.1)).toEqual([[0, 1], [1, 1], [1, 0.9], [0, 0.9]]);
  });
});
