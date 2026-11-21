import { describe, expect, it } from "vitest";
import type { ClaimStatus, Role } from "@prisma/client";
import {
  ALL_STATUSES,
  TRANSITIONS,
  assertTransition,
  availableTransitions,
  checkTransition,
  isTerminal,
  stepIndex,
} from "./claim-state-machine";
import { DomainError } from "./errors";

const ROLES: Role[] = ["CLIENTE", "OFICINA", "SEGURADORA"];

describe("máquina de estados do sinistro", () => {
  it.each<[ClaimStatus, ClaimStatus, Role]>([
    ["ABERTO", "EM_ANALISE", "SEGURADORA"],
    ["EM_ANALISE", "INDENIZACAO_INTEGRAL", "SEGURADORA"],
    ["ENCAMINHADO_OFICINA", "AGUARDANDO_ORCAMENTO", "OFICINA"],
    ["ORCAMENTO_APROVADO", "EM_REPARO", "OFICINA"],
    ["EM_REPARO", "PRONTO_PARA_RETIRADA", "OFICINA"],
    ["PRONTO_PARA_RETIRADA", "CONCLUIDO", "CLIENTE"],
  ])("permite %s → %s para %s", (from, to, role) => {
    expect(checkTransition(from, to, role).ok).toBe(true);
  });

  it("cada transição só é permitida aos perfis da tabela", () => {
    for (const t of TRANSITIONS) {
      for (const role of ROLES) {
        const ctx = { workshopId: "w1", reason: "motivo", quoteItemCount: 1, pendingCoverageItems: 0 };
        expect(checkTransition(t.from, t.to, role, ctx).ok).toBe(t.roles.includes(role));
      }
    }
  });

  it("rejeita transições fora da tabela", () => {
    expect(checkTransition("ABERTO", "CONCLUIDO", "SEGURADORA").ok).toBe(false);
    expect(checkTransition("ABERTO", "ENCAMINHADO_OFICINA", "SEGURADORA", { workshopId: "w" }).ok).toBe(false);
    expect(checkTransition("EM_REPARO", "ORCAMENTO_APROVADO", "OFICINA").ok).toBe(false);
  });

  it("estados terminais não têm saída", () => {
    for (const s of ALL_STATUSES.filter(isTerminal)) {
      for (const role of ROLES) expect(availableTransitions(s, role)).toHaveLength(0);
    }
  });

  it("todo status não terminal tem ao menos uma saída", () => {
    for (const s of ALL_STATUSES.filter((x) => !isTerminal(x))) {
      expect(TRANSITIONS.some((t) => t.from === s)).toBe(true);
    }
  });

  it("encaminhar exige oficina", () => {
    const r = checkTransition("EM_ANALISE", "ENCAMINHADO_OFICINA", "SEGURADORA");
    expect(r.ok).toBe(false);
    expect(checkTransition("EM_ANALISE", "ENCAMINHADO_OFICINA", "SEGURADORA", { workshopId: "w1" }).ok).toBe(true);
  });

  it("negar e pedir ajuste exigem motivo", () => {
    expect(checkTransition("EM_ANALISE", "NEGADO", "SEGURADORA", { reason: "  " }).ok).toBe(false);
    expect(checkTransition("EM_ANALISE", "NEGADO", "SEGURADORA", { reason: "Fora da vigência" }).ok).toBe(true);
    expect(checkTransition("ORCAMENTO_ENVIADO", "AJUSTE_SOLICITADO", "SEGURADORA").ok).toBe(false);
  });

  it("enviar orçamento exige ao menos um item", () => {
    expect(checkTransition("AGUARDANDO_ORCAMENTO", "ORCAMENTO_ENVIADO", "OFICINA", { quoteItemCount: 0 }).ok).toBe(false);
    expect(checkTransition("AJUSTE_SOLICITADO", "ORCAMENTO_ENVIADO", "OFICINA", { quoteItemCount: 2 }).ok).toBe(true);
  });

  it("aprovar exige cobertura definida em todos os itens", () => {
    expect(checkTransition("ORCAMENTO_ENVIADO", "ORCAMENTO_APROVADO", "SEGURADORA", { pendingCoverageItems: 1 }).ok).toBe(false);
    expect(checkTransition("ORCAMENTO_ENVIADO", "ORCAMENTO_APROVADO", "SEGURADORA", { pendingCoverageItems: 0 }).ok).toBe(true);
  });

  it("assertTransition lança DomainError", () => {
    expect(() => assertTransition("ABERTO", "EM_ANALISE", "CLIENTE")).toThrow(DomainError);
  });

  it("availableTransitions filtra por perfil", () => {
    expect(availableTransitions("EM_ANALISE", "SEGURADORA").map((t) => t.to).sort()).toEqual(
      ["ENCAMINHADO_OFICINA", "INDENIZACAO_INTEGRAL", "NEGADO"].sort(),
    );
    expect(availableTransitions("EM_ANALISE", "OFICINA")).toEqual([]);
  });

  it("stepIndex trata ajuste como etapa de orçamento", () => {
    expect(stepIndex("AJUSTE_SOLICITADO")).toBe(stepIndex("ORCAMENTO_ENVIADO"));
    expect(stepIndex("NEGADO")).toBe(-1);
  });
});
