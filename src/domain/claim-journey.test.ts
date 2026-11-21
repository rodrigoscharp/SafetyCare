import { describe, expect, it } from "vitest";
import { ALL_STATUSES } from "./claim-state-machine";
import { daysSince, journeyStep } from "./claim-journey";

describe("jornada do sinistro", () => {
  it("todo status tem texto para os três perfis", () => {
    for (const s of ALL_STATUSES) {
      for (const r of ["CLIENTE", "OFICINA", "SEGURADORA"] as const) {
        const j = journeyStep(s, r);
        expect(j.title.length).toBeGreaterThan(0);
        expect(j.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("indica de quem é a vez", () => {
    expect(journeyStep("ABERTO", "SEGURADORA").yourTurn).toBe(true);
    expect(journeyStep("ABERTO", "CLIENTE").yourTurn).toBe(false);
    expect(journeyStep("PRONTO_PARA_RETIRADA", "CLIENTE").yourTurn).toBe(true);
    expect(journeyStep("AJUSTE_SOLICITADO", "OFICINA").yourTurn).toBe(true);
  });

  it("progresso e etapa", () => {
    expect(journeyStep("ABERTO", "CLIENTE").step).toBe(1);
    expect(journeyStep("CONCLUIDO", "CLIENTE").progress).toBe(1);
    expect(journeyStep("NEGADO", "CLIENTE").step).toBeNull();
    expect(journeyStep("NEGADO", "CLIENTE").tone).toBe("danger");
  });

  it("daysSince", () => {
    const now = new Date("2026-11-20T12:00:00Z");
    expect(daysSince(new Date("2026-11-18T13:00:00Z"), now)).toBe(1);
    expect(daysSince(new Date("2026-11-21T00:00:00Z"), now)).toBe(0);
  });
});
