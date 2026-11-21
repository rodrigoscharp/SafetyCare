import type {
  AttachmentKind,
  ClaimType,
  Coverage,
  QuoteStatus,
  RepairAction,
  Severity,
  VehicleType,
} from "@prisma/client";

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  COLISAO: "Colisão",
  FURTO: "Furto",
  ROUBO: "Roubo",
  INCENDIO: "Incêndio",
  ALAGAMENTO: "Alagamento",
  VIDROS: "Vidros",
  OUTRO: "Outro",
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = { CARRO: "Carro", MOTO: "Moto" };

export const SEVERITY_LABEL: Record<Severity, string> = { LEVE: "Leve", MEDIO: "Médio", GRAVE: "Grave" };

export const ACTION_LABEL: Record<RepairAction, string> = { TROCAR: "Trocar", REPARAR: "Reparar", PINTAR: "Pintar" };

export const COVERAGE_LABEL: Record<Coverage, string> = {
  PENDENTE: "Em análise",
  COBERTO: "Coberto",
  NAO_COBERTO: "Não coberto",
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  APROVADO: "Aprovado",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  RECUSADO: "Recusado",
};

export const ATTACHMENT_KIND_LABEL: Record<AttachmentKind, string> = { FOTO: "Foto", DOCUMENTO: "Documento" };
