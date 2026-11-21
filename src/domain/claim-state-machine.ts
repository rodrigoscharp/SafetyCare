import type { ClaimStatus, Role } from "@prisma/client";
import { DomainError } from "./errors";

export type Transition = {
  from: ClaimStatus;
  to: ClaimStatus;
  /** Perfis autorizados a executar a transição */
  roles: readonly Role[];
  /** Rótulo do botão/ação na interface */
  action: string;
};

/**
 * Tabela única de transições do sinistro. Nenhuma tela ou action altera status sem passar por aqui.
 */
export const TRANSITIONS: readonly Transition[] = [
  { from: "ABERTO", to: "EM_ANALISE", roles: ["SEGURADORA"], action: "Assumir análise" },
  { from: "EM_ANALISE", to: "NEGADO", roles: ["SEGURADORA"], action: "Negar sinistro" },
  { from: "EM_ANALISE", to: "ENCAMINHADO_OFICINA", roles: ["SEGURADORA"], action: "Encaminhar à oficina" },
  { from: "EM_ANALISE", to: "INDENIZACAO_INTEGRAL", roles: ["SEGURADORA"], action: "Indenização integral" },
  { from: "ENCAMINHADO_OFICINA", to: "AGUARDANDO_ORCAMENTO", roles: ["OFICINA"], action: "Confirmar recebimento do veículo" },
  { from: "AGUARDANDO_ORCAMENTO", to: "ORCAMENTO_ENVIADO", roles: ["OFICINA"], action: "Enviar orçamento" },
  { from: "ORCAMENTO_ENVIADO", to: "AJUSTE_SOLICITADO", roles: ["SEGURADORA"], action: "Solicitar ajuste" },
  { from: "ORCAMENTO_ENVIADO", to: "ORCAMENTO_APROVADO", roles: ["SEGURADORA"], action: "Aprovar orçamento" },
  { from: "ORCAMENTO_ENVIADO", to: "NEGADO", roles: ["SEGURADORA"], action: "Negar sinistro" },
  { from: "AJUSTE_SOLICITADO", to: "ORCAMENTO_ENVIADO", roles: ["OFICINA"], action: "Enviar nova versão" },
  { from: "ORCAMENTO_APROVADO", to: "EM_REPARO", roles: ["OFICINA"], action: "Iniciar reparo" },
  { from: "EM_REPARO", to: "PRONTO_PARA_RETIRADA", roles: ["OFICINA"], action: "Marcar pronto para retirada" },
  { from: "PRONTO_PARA_RETIRADA", to: "CONCLUIDO", roles: ["CLIENTE"], action: "Confirmar retirada" },
];

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em análise",
  NEGADO: "Negado",
  ENCAMINHADO_OFICINA: "Encaminhado à oficina",
  INDENIZACAO_INTEGRAL: "Indenização integral",
  AGUARDANDO_ORCAMENTO: "Aguardando orçamento",
  ORCAMENTO_ENVIADO: "Orçamento enviado",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  ORCAMENTO_APROVADO: "Orçamento aprovado",
  EM_REPARO: "Em reparo",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  CONCLUIDO: "Concluído",
};

export const ALL_STATUSES = Object.keys(STATUS_LABEL) as ClaimStatus[];

export const TERMINAL_STATUSES: readonly ClaimStatus[] = ["NEGADO", "INDENIZACAO_INTEGRAL", "CONCLUIDO"];

export function isTerminal(status: ClaimStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Contexto extra que algumas transições exigem. */
export type TransitionContext = {
  workshopId?: string | null;
  reason?: string | null;
  /** Itens do orçamento ainda sem decisão de cobertura */
  pendingCoverageItems?: number;
  /** Quantidade de itens no orçamento a ser enviado */
  quoteItemCount?: number;
};

export type TransitionCheck = { ok: true; transition: Transition } | { ok: false; reason: string };

export function findTransition(from: ClaimStatus, to: ClaimStatus): Transition | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to);
}

/** Valida uma transição (status + perfil + pré-condições). Função pura. */
export function checkTransition(
  from: ClaimStatus,
  to: ClaimStatus,
  role: Role,
  ctx: TransitionContext = {},
): TransitionCheck {
  const transition = findTransition(from, to);
  if (!transition) {
    return { ok: false, reason: `Transição inválida: ${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}.` };
  }
  if (!transition.roles.includes(role)) {
    return { ok: false, reason: `Seu perfil não pode executar "${transition.action}".` };
  }
  if (to === "ENCAMINHADO_OFICINA" && !ctx.workshopId) {
    return { ok: false, reason: "Escolha a oficina para encaminhar o sinistro." };
  }
  if ((to === "NEGADO" || to === "AJUSTE_SOLICITADO") && !ctx.reason?.trim()) {
    return { ok: false, reason: "Informe o motivo." };
  }
  if (to === "ORCAMENTO_ENVIADO" && (ctx.quoteItemCount ?? 0) < 1) {
    return { ok: false, reason: "O orçamento precisa de ao menos um item." };
  }
  if (to === "ORCAMENTO_APROVADO" && (ctx.pendingCoverageItems ?? 0) > 0) {
    return { ok: false, reason: "Defina a cobertura de todos os itens antes de aprovar." };
  }
  return { ok: true, transition };
}

/** Igual a checkTransition, mas lança DomainError. */
export function assertTransition(from: ClaimStatus, to: ClaimStatus, role: Role, ctx: TransitionContext = {}): Transition {
  const result = checkTransition(from, to, role, ctx);
  if (!result.ok) throw new DomainError(result.reason);
  return result.transition;
}

/** Transições que o perfil pode disparar a partir do status atual. */
export function availableTransitions(from: ClaimStatus, role: Role): Transition[] {
  return TRANSITIONS.filter((t) => t.from === from && t.roles.includes(role));
}

/** Etapas exibidas no stepper do caminho feliz. */
export const MAIN_PATH: readonly ClaimStatus[] = [
  "ABERTO",
  "EM_ANALISE",
  "ENCAMINHADO_OFICINA",
  "AGUARDANDO_ORCAMENTO",
  "ORCAMENTO_ENVIADO",
  "ORCAMENTO_APROVADO",
  "EM_REPARO",
  "PRONTO_PARA_RETIRADA",
  "CONCLUIDO",
];

/** Índice da etapa no stepper (AJUSTE_SOLICITADO conta como orçamento enviado). */
export function stepIndex(status: ClaimStatus): number {
  if (status === "AJUSTE_SOLICITADO") return MAIN_PATH.indexOf("ORCAMENTO_ENVIADO");
  return MAIN_PATH.indexOf(status);
}
