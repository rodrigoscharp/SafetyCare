import { describe, expect, it } from "vitest";
import { partVisual } from "./part-status";

describe("partVisual", () => {
  const damages = [{ partKey: "capo", severity: "MEDIO" as const }];
  it("intacta sem dano nem item", () => expect(partVisual("teto", damages, [])).toBe("INTACTA"));
  it("dano declarado sem orçamento", () => expect(partVisual("capo", damages, [])).toBe("DANO"));
  it("item usa a ação", () =>
    expect(partVisual("capo", damages, [{ partKey: "capo", action: "PINTAR", partPrice: 0, laborPrice: 1, coverage: "COBERTO" }])).toBe("PINTAR"));
  it("não coberto tem prioridade", () =>
    expect(partVisual("capo", damages, [{ partKey: "capo", action: "TROCAR", partPrice: 1, laborPrice: 1, coverage: "NAO_COBERTO" }])).toBe("NAO_COBERTO"));
});
