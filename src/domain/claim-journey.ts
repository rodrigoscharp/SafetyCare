import type { ClaimStatus, Role } from "@prisma/client";
import { MAIN_PATH, isTerminal, stepIndex } from "./claim-state-machine";

export type JourneyStep = {
  /** Título principal do card de acompanhamento */
  title: string;
  /** O que acontece agora, na linguagem de quem está vendo */
  description: string;
  /** Quem precisa agir agora (null quando encerrado) */
  owner: Role | null;
  /** O perfil que está vendo precisa agir */
  yourTurn: boolean;
  /** Etapa atual (1-based) no caminho principal; null para desfechos fora dele */
  step: number | null;
  total: number;
  /** 0–1 */
  progress: number;
  tone: "progress" | "success" | "danger" | "neutral";
};

type Copy = { title: string; client: string; workshop: string; insurer: string; owner: Role | null };

const COPY: Record<ClaimStatus, Copy> = {
  ABERTO: {
    title: "Sinistro registrado",
    client: "Recebemos seu sinistro. Um analista vai assumir em breve.",
    workshop: "Aguardando análise da seguradora.",
    insurer: "Novo sinistro. Assuma a análise para decidir o encaminhamento.",
    owner: "SEGURADORA",
  },
  EM_ANALISE: {
    title: "Em análise",
    client: "Um analista está avaliando seu relato e as fotos.",
    workshop: "A seguradora está analisando o sinistro.",
    insurer: "Decida: encaminhar à oficina, indenizar ou negar.",
    owner: "SEGURADORA",
  },
  ENCAMINHADO_OFICINA: {
    title: "Leve o veículo à oficina",
    client: "Seu sinistro foi encaminhado. Leve o veículo à oficina indicada.",
    workshop: "Confirme quando o veículo chegar para liberar o orçamento.",
    insurer: "Aguardando a oficina receber o veículo.",
    owner: "OFICINA",
  },
  AGUARDANDO_ORCAMENTO: {
    title: "Orçamento em preparação",
    client: "A oficina está avaliando as peças e montando o orçamento.",
    workshop: "Monte o orçamento peça por peça e envie para a seguradora.",
    insurer: "Aguardando o orçamento da oficina.",
    owner: "OFICINA",
  },
  ORCAMENTO_ENVIADO: {
    title: "Orçamento em avaliação",
    client: "A seguradora está decidindo o que é coberto em cada item.",
    workshop: "Orçamento com a seguradora. Aguarde a decisão.",
    insurer: "Revise item a item e aprove, peça ajuste ou negue.",
    owner: "SEGURADORA",
  },
  AJUSTE_SOLICITADO: {
    title: "Ajuste no orçamento",
    client: "A seguradora pediu um ajuste à oficina. Isso é comum e rápido.",
    workshop: "A seguradora pediu ajuste. Revise e envie uma nova versão.",
    insurer: "Aguardando a nova versão do orçamento.",
    owner: "OFICINA",
  },
  ORCAMENTO_APROVADO: {
    title: "Orçamento aprovado",
    client: "Tudo certo! A oficina vai começar o reparo.",
    workshop: "Orçamento aprovado. Inicie o reparo.",
    insurer: "Aprovado. A oficina vai iniciar o reparo.",
    owner: "OFICINA",
  },
  EM_REPARO: {
    title: "Reparo em andamento",
    client: "Seu veículo está sendo consertado.",
    workshop: "Ao terminar, avise que o veículo está pronto.",
    insurer: "Veículo em reparo na oficina.",
    owner: "OFICINA",
  },
  PRONTO_PARA_RETIRADA: {
    title: "Pronto para retirada",
    client: "Seu veículo está pronto. Retire na oficina e confirme aqui.",
    workshop: "Aguardando o segurado retirar o veículo.",
    insurer: "Aguardando a retirada pelo segurado.",
    owner: "CLIENTE",
  },
  CONCLUIDO: {
    title: "Concluído",
    client: "Veículo entregue. Obrigado por usar o SafetyCare.",
    workshop: "Veículo entregue ao segurado.",
    insurer: "Sinistro encerrado com entrega do veículo.",
    owner: null,
  },
  NEGADO: {
    title: "Sinistro negado",
    client: "Este sinistro não foi coberto. Veja o motivo no histórico.",
    workshop: "Sinistro negado pela seguradora.",
    insurer: "Sinistro encerrado sem cobertura.",
    owner: null,
  },
  INDENIZACAO_INTEGRAL: {
    title: "Indenização integral",
    client: "Seu veículo será indenizado integralmente, sem reparo.",
    workshop: "Indenização integral, sem reparo em oficina.",
    insurer: "Encerrado com indenização integral.",
    owner: null,
  },
};

export function journeyStep(status: ClaimStatus, viewer: Role): JourneyStep {
  const c = COPY[status];
  const idx = stepIndex(status);
  const total = MAIN_PATH.length;
  const terminal = isTerminal(status);
  const step = idx >= 0 ? idx + 1 : null;
  return {
    title: c.title,
    description: viewer === "CLIENTE" ? c.client : viewer === "OFICINA" ? c.workshop : c.insurer,
    owner: c.owner,
    yourTurn: c.owner === viewer,
    step,
    total,
    progress: status === "CONCLUIDO" || status === "INDENIZACAO_INTEGRAL" || status === "NEGADO" ? 1 : step ? step / total : 0,
    tone: status === "NEGADO" ? "danger" : terminal ? "success" : status === "ABERTO" ? "neutral" : "progress",
  };
}

/** Dias inteiros desde uma data (para "parado há N dias"). */
export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}
