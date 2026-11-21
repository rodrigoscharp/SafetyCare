import type { VehicleType } from "@prisma/client";

export type PartGroup = "carroceria" | "vidros" | "iluminacao" | "rodas" | "acessorios" | "mecanica";

export type PartDefinition = {
  key: string;
  label: string;
  group: PartGroup;
  vehicleTypes: readonly VehicleType[];
};

const CARRO = ["CARRO"] as const;
const MOTO = ["MOTO"] as const;
const AMBOS = ["CARRO", "MOTO"] as const;

/** Catálogo de peças. `key` é o identificador estável usado no 3D (mesh.name), no banco e nos orçamentos. */
export const PARTS: readonly PartDefinition[] = [
  // Carro
  { key: "capo", label: "Capô", group: "carroceria", vehicleTypes: CARRO },
  { key: "parachoque_dianteiro", label: "Para-choque dianteiro", group: "carroceria", vehicleTypes: CARRO },
  { key: "parachoque_traseiro", label: "Para-choque traseiro", group: "carroceria", vehicleTypes: CARRO },
  { key: "paralama_dianteiro_esq", label: "Para-lama dianteiro esquerdo", group: "carroceria", vehicleTypes: CARRO },
  { key: "paralama_dianteiro_dir", label: "Para-lama dianteiro direito", group: "carroceria", vehicleTypes: CARRO },
  { key: "paralama_traseiro_esq", label: "Para-lama traseiro esquerdo", group: "carroceria", vehicleTypes: CARRO },
  { key: "paralama_traseiro_dir", label: "Para-lama traseiro direito", group: "carroceria", vehicleTypes: CARRO },
  { key: "porta_dianteira_esq", label: "Porta dianteira esquerda", group: "carroceria", vehicleTypes: CARRO },
  { key: "porta_dianteira_dir", label: "Porta dianteira direita", group: "carroceria", vehicleTypes: CARRO },
  { key: "porta_traseira_esq", label: "Porta traseira esquerda", group: "carroceria", vehicleTypes: CARRO },
  { key: "porta_traseira_dir", label: "Porta traseira direita", group: "carroceria", vehicleTypes: CARRO },
  { key: "teto", label: "Teto", group: "carroceria", vehicleTypes: CARRO },
  { key: "tampa_porta_malas", label: "Tampa do porta-malas", group: "carroceria", vehicleTypes: CARRO },
  { key: "parabrisa", label: "Para-brisa", group: "vidros", vehicleTypes: CARRO },
  { key: "vidro_traseiro", label: "Vidro traseiro", group: "vidros", vehicleTypes: CARRO },
  { key: "farol_esq", label: "Farol esquerdo", group: "iluminacao", vehicleTypes: CARRO },
  { key: "farol_dir", label: "Farol direito", group: "iluminacao", vehicleTypes: CARRO },
  { key: "lanterna_esq", label: "Lanterna esquerda", group: "iluminacao", vehicleTypes: CARRO },
  { key: "lanterna_dir", label: "Lanterna direita", group: "iluminacao", vehicleTypes: CARRO },
  { key: "roda_dianteira_esq", label: "Roda dianteira esquerda", group: "rodas", vehicleTypes: CARRO },
  { key: "roda_dianteira_dir", label: "Roda dianteira direita", group: "rodas", vehicleTypes: CARRO },
  { key: "roda_traseira_esq", label: "Roda traseira esquerda", group: "rodas", vehicleTypes: CARRO },
  { key: "roda_traseira_dir", label: "Roda traseira direita", group: "rodas", vehicleTypes: CARRO },
  // Ambos
  { key: "retrovisor_esq", label: "Retrovisor esquerdo", group: "acessorios", vehicleTypes: AMBOS },
  { key: "retrovisor_dir", label: "Retrovisor direito", group: "acessorios", vehicleTypes: AMBOS },
  // Moto
  { key: "tanque", label: "Tanque", group: "carroceria", vehicleTypes: MOTO },
  { key: "carenagem_esq", label: "Carenagem esquerda", group: "carroceria", vehicleTypes: MOTO },
  { key: "carenagem_dir", label: "Carenagem direita", group: "carroceria", vehicleTypes: MOTO },
  { key: "farol", label: "Farol", group: "iluminacao", vehicleTypes: MOTO },
  { key: "lanterna", label: "Lanterna", group: "iluminacao", vehicleTypes: MOTO },
  { key: "guidao", label: "Guidão", group: "acessorios", vehicleTypes: MOTO },
  { key: "banco", label: "Banco", group: "acessorios", vehicleTypes: MOTO },
  { key: "escapamento", label: "Escapamento", group: "mecanica", vehicleTypes: MOTO },
  { key: "roda_dianteira", label: "Roda dianteira", group: "rodas", vehicleTypes: MOTO },
  { key: "roda_traseira", label: "Roda traseira", group: "rodas", vehicleTypes: MOTO },
  { key: "paralama_dianteiro", label: "Paralama dianteiro", group: "carroceria", vehicleTypes: MOTO },
  { key: "paralama_traseiro", label: "Paralama traseiro", group: "carroceria", vehicleTypes: MOTO },
];

const BY_KEY = new Map(PARTS.map((p) => [p.key, p]));

export function getPart(key: string): PartDefinition | undefined {
  return BY_KEY.get(key);
}

export function partLabel(key: string): string {
  return BY_KEY.get(key)?.label ?? key;
}

export function partsFor(type: VehicleType): PartDefinition[] {
  return PARTS.filter((p) => p.vehicleTypes.includes(type));
}

export function isValidPartFor(key: string, type: VehicleType): boolean {
  return BY_KEY.get(key)?.vehicleTypes.includes(type) ?? false;
}
