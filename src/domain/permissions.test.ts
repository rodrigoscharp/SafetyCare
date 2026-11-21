import { describe, expect, it } from "vitest";
import {
  canEditQuote,
  canManageVehicle,
  canOpenClaim,
  canReviewQuote,
  canViewClaim,
  claimScope,
  type Actor,
  type ClaimAccess,
} from "./permissions";

const cliente: Actor = { id: "c1", role: "CLIENTE" };
const outroCliente: Actor = { id: "c2", role: "CLIENTE" };
const oficina: Actor = { id: "w1", role: "OFICINA" };
const outraOficina: Actor = { id: "w2", role: "OFICINA" };
const seguradora: Actor = { id: "s1", role: "SEGURADORA" };

const claim = (over: Partial<ClaimAccess> = {}): ClaimAccess => ({
  clientId: "c1",
  workshopId: "w1",
  status: "AGUARDANDO_ORCAMENTO",
  ...over,
});

describe("permissões", () => {
  it("escopo de listagem por perfil", () => {
    expect(claimScope(cliente)).toEqual({ clientId: "c1" });
    expect(claimScope(oficina)).toEqual({ workshopId: "w1" });
    expect(claimScope(seguradora)).toEqual({});
  });

  it("cliente só vê os próprios sinistros", () => {
    expect(canViewClaim(cliente, claim())).toBe(true);
    expect(canViewClaim(outroCliente, claim())).toBe(false);
  });

  it("oficina só vê sinistros encaminhados a ela", () => {
    expect(canViewClaim(oficina, claim())).toBe(true);
    expect(canViewClaim(outraOficina, claim())).toBe(false);
    expect(canViewClaim(oficina, claim({ workshopId: null }))).toBe(false);
  });

  it("seguradora vê todos", () => {
    expect(canViewClaim(seguradora, claim({ clientId: "x", workshopId: null }))).toBe(true);
  });

  it("apenas a oficina responsável edita orçamento, e só nos status editáveis", () => {
    expect(canEditQuote(oficina, claim())).toBe(true);
    expect(canEditQuote(oficina, claim({ status: "AJUSTE_SOLICITADO" }))).toBe(true);
    expect(canEditQuote(oficina, claim({ status: "ORCAMENTO_ENVIADO" }))).toBe(false);
    expect(canEditQuote(outraOficina, claim())).toBe(false);
    expect(canEditQuote(seguradora, claim())).toBe(false);
    expect(canEditQuote(cliente, claim())).toBe(false);
  });

  it("apenas a seguradora revisa orçamento enviado", () => {
    expect(canReviewQuote(seguradora, claim({ status: "ORCAMENTO_ENVIADO" }))).toBe(true);
    expect(canReviewQuote(seguradora, claim({ status: "EM_REPARO" }))).toBe(false);
    expect(canReviewQuote(oficina, claim({ status: "ORCAMENTO_ENVIADO" }))).toBe(false);
  });

  it("veículos: só o dono gerencia e abre sinistro", () => {
    expect(canManageVehicle(cliente, { ownerId: "c1" })).toBe(true);
    expect(canManageVehicle(outroCliente, { ownerId: "c1" })).toBe(false);
    expect(canOpenClaim(cliente, { ownerId: "c1" })).toBe(true);
    expect(canOpenClaim(seguradora, { ownerId: "c1" })).toBe(false);
  });
});
