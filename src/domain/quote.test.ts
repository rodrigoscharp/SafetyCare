import { describe, expect, it } from "vitest";
import { financialSummary, quoteTotals, suggestedAction } from "./quote";

describe("orçamento", () => {
  it("soma peças e mão de obra", () => {
    expect(quoteTotals([{ partPrice: 100, laborPrice: 50 }, { partPrice: 0, laborPrice: 30 }])).toEqual({ partsTotal: 100, laborTotal: 80, total: 180 });
  });

  it("sugere ação pela gravidade", () => {
    expect(suggestedAction("GRAVE")).toBe("TROCAR");
    expect(suggestedAction("MEDIO")).toBe("REPARAR");
    expect(suggestedAction("LEVE")).toBe("PINTAR");
    expect(suggestedAction(undefined)).toBe("REPARAR");
  });
});

describe("resumo financeiro", () => {
  const items = [
    { partPrice: 140_000, laborPrice: 30_000, coverage: "COBERTO" as const },
    { partPrice: 0, laborPrice: 55_000, coverage: "COBERTO" as const },
    { partPrice: 115_000, laborPrice: 10_000, coverage: "COBERTO" as const },
    { partPrice: 0, laborPrice: 40_000, coverage: "NAO_COBERTO" as const },
  ];

  it("cenário parcialmente coberto do seed", () => {
    const s = financialSummary(items, 250_000);
    expect(s.coveredTotal).toBe(350_000);
    expect(s.notCoveredTotal).toBe(40_000);
    expect(s.deductibleApplied).toBe(250_000);
    expect(s.insurerPays).toBe(100_000);
    expect(s.clientPays).toBe(290_000);
    expect(s.quoteTotal).toBe(390_000);
  });

  it("franquia nunca passa do total coberto", () => {
    const s = financialSummary([{ partPrice: 50_000, laborPrice: 0, coverage: "COBERTO" }], 250_000);
    expect(s.deductibleApplied).toBe(50_000);
    expect(s.insurerPays).toBe(0);
    expect(s.clientPays).toBe(50_000);
  });

  it("nada coberto: segurado paga tudo, sem franquia", () => {
    const s = financialSummary([{ partPrice: 10_000, laborPrice: 5_000, coverage: "NAO_COBERTO" }], 250_000);
    expect(s.deductibleApplied).toBe(0);
    expect(s.clientPays).toBe(15_000);
    expect(s.insurerPays).toBe(0);
  });

  it("pendentes não entram no que cada um paga", () => {
    const s = financialSummary([{ partPrice: 10_000, laborPrice: 0, coverage: "PENDENTE" }], 1_000);
    expect(s.pendingTotal).toBe(10_000);
    expect(s.clientPays).toBe(0);
    expect(s.insurerPays).toBe(0);
  });
});
