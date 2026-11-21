import { z } from "zod";

const cents = z.number().int("Valor inválido").min(0, "Valor não pode ser negativo").max(100_000_000, "Valor muito alto");

export const quoteItemInputSchema = z.object({
  partKey: z.string().min(1).max(64),
  action: z.enum(["TROCAR", "REPARAR", "PINTAR"]),
  partPrice: cents,
  laborPrice: cents,
});

export const quoteInputSchema = z
  .object({
    claimId: z.string().min(1).max(64),
    estimatedDays: z.number().int().min(0, "Prazo inválido").max(365, "Prazo muito longo"),
    items: z.array(quoteItemInputSchema).max(60),
  })
  .refine((q) => new Set(q.items.map((i) => i.partKey)).size === q.items.length, { message: "Peça repetida no orçamento", path: ["items"] })
  .refine((q) => q.items.every((i) => i.partPrice + i.laborPrice > 0), { message: "Todo item precisa ter valor", path: ["items"] });

export type QuoteInput = z.infer<typeof quoteInputSchema>;

export const coverageReviewSchema = z.object({
  claimId: z.string().min(1).max(64),
  decisions: z
    .array(
      z.object({
        itemId: z.string().min(1).max(64),
        coverage: z.enum(["PENDENTE", "COBERTO", "NAO_COBERTO"]),
        insurerNote: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .max(60),
});

export type CoverageReviewInput = z.infer<typeof coverageReviewSchema>;
