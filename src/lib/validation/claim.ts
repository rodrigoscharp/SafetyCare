import { z } from "zod";
import { parseSaoPauloDate, parseSaoPauloDateTime, parseBRLToCents } from "@/lib/format";

const cuid = z.string().min(1).max(64);

export const damageSchema = z.object({
  partKey: z.string().min(1).max(64),
  severity: z.enum(["LEVE", "MEDIO", "GRAVE"]),
  note: z.string().trim().max(300).optional().nullable(),
});

export const createClaimSchema = z
  .object({
    vehicleId: cuid,
    type: z.enum(["COLISAO", "FURTO", "ROUBO", "INCENDIO", "ALAGAMENTO", "VIDROS", "OUTRO"]),
    description: z.string().trim().min(10, "Descreva o ocorrido com ao menos 10 caracteres").max(2000),
    occurredAt: z
      .string()
      .transform((v, ctx) => {
        const d = parseSaoPauloDateTime(v);
        if (!d) {
          ctx.addIssue({ code: "custom", message: "Data e hora inválidas" });
          return z.NEVER;
        }
        return d;
      })
      .refine((d) => d.getTime() <= Date.now() + 60_000, "A data não pode estar no futuro"),
    location: z.string().trim().min(3, "Informe o local").max(200),
    damages: z.array(damageSchema).max(40),
  })
  .refine((v) => v.type === "FURTO" || v.type === "ROUBO" || v.damages.length > 0, {
    message: "Marque ao menos uma peça danificada no modelo 3D",
    path: ["damages"],
  });

export type CreateClaimInput = z.infer<typeof createClaimSchema>;

export const messageSchema = z.object({
  claimId: cuid,
  message: z.string().trim().min(1, "Escreva uma mensagem").max(1000),
});

const money = z.string().transform((v, ctx) => {
  const c = parseBRLToCents(v);
  if (c === null) {
    ctx.addIssue({ code: "custom", message: "Valor inválido" });
    return z.NEVER;
  }
  return c;
});

export const vehicleSchema = z.object({
  id: cuid.optional(),
  type: z.enum(["CARRO", "MOTO"]),
  brand: z.string().trim().min(2, "Informe a marca").max(60),
  model: z.string().trim().min(1, "Informe o modelo").max(80),
  year: z.coerce.number().int().min(1950, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/[^A-Z0-9]/g, ""))
    .refine((v) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v), "Placa inválida (ex.: ABC1D23)"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  policyNumber: z.string().trim().min(3, "Informe o número da apólice").max(40),
  deductible: money,
  validUntil: z.string().transform((v, ctx) => {
    const d = parseSaoPauloDate(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: "Data inválida" });
      return z.NEVER;
    }
    return d;
  }),
});
